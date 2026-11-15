// Maqueta 3D en tiempo real de Café Poli: se gira, se acerca y se recorre con la mano, siempre nítida.
// Carga maqueta/cafe.glb (computador) o maqueta/cafe-m.glb (celular) solo cuando se abre.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MOVIL = matchMedia("(max-width: 760px)").matches || /Mobi|Android|iPhone/i.test(navigator.userAgent);
// vistas guardadas (coordenadas del plano en metros): [posición de la cámara, punto que mira]
const VISTAS = {
  general:   [[13.6, 25, 29], [13.6, 0, 1.5]],
  conexion:  [[5.5, 7.5, 13.5], [5.0, 0.6, 3.8]],
  barra:     [[16.4, 3.4, 1.4], [13.6, 1.2, 6.2]],
  tienda:    [[15.2, 2.4, 4.6], [15.1, 1.2, 0.3]],
  avion:     [[22.5, 9.5, 12.5], [23.5, 0.6, 2.5]],
  rincon:    [[21.4, 6.0, -1.0], [25.6, 0.7, -5.2]],
};

let estado = null; // {renderer, scene, camera, controls, raf, modelo, cargado}
// en celular la pantalla es angosta: las vistas abiertas se alejan un poco para que quepa todo
if (MOVIL) for (const k of ["general", "conexion", "avion"]) {
  const [p, t] = VISTAS[k];
  VISTAS[k] = [p.map((v, i) => t[i] + (v - t[i]) * 1.45), t];
}

function crear(contenedor) {
  const canvas = document.createElement("canvas");
  canvas.className = "maq3d-canvas";
  contenedor.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, MOVIL ? 2 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !MOVIL;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;
  scene.add(new THREE.HemisphereLight(0xfff4e3, 0xb59d7c, 0.55));
  const sol = new THREE.DirectionalLight(0xffe8c8, 1.5);
  sol.position.set(30, 32, 22);
  sol.target.position.set(13.6, 0, 1.0);
  sol.castShadow = !MOVIL;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -20, right: 20, top: 16, bottom: -16, near: 5, far: 90 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.03;
  scene.add(sol, sol.target);
  const camera = new THREE.PerspectiveCamera(MOVIL ? 48 : 40, 1, 0.1, 400);
  camera.position.set(...VISTAS.general[0]);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(...VISTAS.general[1]);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.5;
  controls.maxDistance = 70;
  controls.maxPolarAngle = Math.PI * 0.47;   // nunca por debajo del piso
  controls.screenSpacePanning = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.zoomToCursor = true;
  controls.addEventListener("start", () => { controls.autoRotate = false; pintarGirar(); avisoFuera(); });
  // la mirada no se sale del café
  const limites = new THREE.Box3(new THREE.Vector3(-2, 0, -10.5), new THREE.Vector3(29.5, 3.2, 16.5));
  controls.addEventListener("change", () => limites.clampPoint(controls.target, controls.target));
  canvas.addEventListener("dblclick", (e) => enfocar(e));
  let ultimoToque = 0;
  canvas.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") { const t = performance.now(); if (t - ultimoToque < 320) enfocar(e); ultimoToque = t; } });
  new ResizeObserver(() => ajustar()).observe(contenedor);
  estado = { renderer, scene, camera, controls, contenedor, canvas, raf: 0, modelo: null, cargando: false, vuelo: null };
  ajustar();
}

function ajustar() {
  if (!estado) return;
  const { renderer, camera, contenedor } = estado;
  const w = contenedor.clientWidth, h = contenedor.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const raycaster = new THREE.Raycaster();
function enfocar(e) {
  if (!estado || !estado.modelo) return;
  const r = estado.canvas.getBoundingClientRect();
  const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(p, estado.camera);
  const hit = raycaster.intersectObject(estado.modelo, true)[0];
  if (!hit) return;
  const dir = new THREE.Vector3().subVectors(estado.camera.position, estado.controls.target);
  const dist = Math.max(3, dir.length() * 0.5);
  volar(hit.point.clone().add(dir.normalize().multiplyScalar(dist)), hit.point);
}

function volar(pos, mira, ms = 1300) {
  const { camera, controls } = estado;
  controls.autoRotate = false; pintarGirar();
  estado.vuelo = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...pos), t1: new THREE.Vector3(...mira), inicio: performance.now(), ms };
}
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function ciclo(t) {
  if (!estado) return;
  const { renderer, scene, camera, controls } = estado;
  if (estado.vuelo) {
    const v = estado.vuelo, k = Math.min(1, (t - v.inicio) / v.ms), e = suave(k);
    camera.position.lerpVectors(v.p0, v.p1, e);
    controls.target.lerpVectors(v.t0, v.t1, e);
    if (k >= 1) estado.vuelo = null;
  }
  controls.update();
  renderer.render(scene, camera);
  estado.raf = requestAnimationFrame(ciclo);
}

function cargar() {
  if (estado.modelo || estado.cargando) return;
  estado.cargando = true;
  const barra = document.getElementById("maq3d-progreso");
  const caja = document.getElementById("maq3d-carga");
  caja.classList.remove("oculto");
  const draco = new DRACOLoader().setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/");
  const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
  loader.load(MOVIL ? "maqueta/cafe-m.glb" : "maqueta/cafe.glb", (g) => {
    const m = g.scene;
    m.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = !MOVIL; o.receiveShadow = !MOVIL;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const mt of mats) { if (mt && mt.map) mt.map.anisotropy = Math.min(8, estado.renderer.capabilities.getMaxAnisotropy()); }
      }
    });
    estado.scene.add(m);
    estado.modelo = m;
    caja.classList.add("oculto");
    document.getElementById("maq3d-aviso").classList.remove("oculto");
  }, (p) => {
    if (p.total) barra.style.width = `${Math.round((p.loaded / p.total) * 100)}%`;
  }, () => {
    caja.innerHTML = `<p>No se pudo cargar la maqueta 3D en este dispositivo.</p><img src="panos/aerea.jpg" alt="Vista aérea de Café Poli">`;
    estado.cargando = false;
  });
}

function pintarGirar() {
  const b = document.getElementById("maq3d-girar");
  if (b && estado) b.classList.toggle("activo", estado.controls.autoRotate);
}
function avisoFuera() { document.getElementById("maq3d-aviso")?.classList.add("oculto"); }

export function abrirMaqueta3D() {
  const area = document.getElementById("maq3d-area");
  if (!estado) {
    crear(area);
    document.querySelectorAll("[data-vista]").forEach((b) => b.addEventListener("click", () => { const v = VISTAS[b.dataset.vista]; if (v) { volar(v[0], v[1]); avisoFuera(); } }));
    document.getElementById("maq3d-girar").addEventListener("click", () => { estado.controls.autoRotate = !estado.controls.autoRotate; pintarGirar(); });
  }
  ajustar();
  cargar();
  pintarGirar();
  cancelAnimationFrame(estado.raf);
  estado.raf = requestAnimationFrame(ciclo);
}
export function cerrarMaqueta3D() {
  if (estado) cancelAnimationFrame(estado.raf);
}
