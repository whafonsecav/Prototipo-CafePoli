// Café Poli · recorrido 360° fotorrealista con PolGreco como guía.
import * as THREE from "three";
import { PASOS, NODOS } from "./recorrido.js";
import { CONEXIONES, PUNTOS } from "./puntos.js";
import { LOGROS } from "./logros.js";
import { abrirTelefono, telefonoAbierto, alNarrar } from "./telefono.js";

const $ = (id) => document.getElementById(id);
const MOVIL = matchMedia("(max-width: 760px)").matches || /Mobi|Android|iPhone/i.test(navigator.userAgent);
const CARPETA = MOVIL ? "panos/m/" : "panos/";
const params = new URLSearchParams(location.search);

// ------------------------------------------------------------------ visor
const canvas = $("escena");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: params.has("captura") });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(MOVIL ? 80 : 72, innerWidth / innerHeight, 0.1, 200);
const uni = { tA: { value: null }, tB: { value: null }, mezcla: { value: 0 }, brillo: { value: 1 } };
const esfera = new THREE.Mesh(new THREE.SphereGeometry(50, 96, 48), new THREE.ShaderMaterial({
  uniforms: uni, side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tA; uniform sampler2D tB; uniform float mezcla; uniform float brillo; varying vec3 vDir;
    vec2 eq(vec3 d){ return vec2(0.5 + atan(d.x, -d.z) / 6.2831853, 0.5 + asin(clamp(d.y, -1.0, 1.0)) / 3.1415927); }
    void main(){
      vec2 uv = eq(normalize(vDir));
      vec4 a = texture2D(tA, uv); vec4 b = texture2D(tB, uv);
      gl_FragColor = vec4(mix(a.rgb, b.rgb, mezcla) * brillo, 1.0);
      #include <colorspace_fragment>
    }`,
}));
scene.add(esfera);

const cargador = new THREE.TextureLoader();
const cache = new Map();
function textura(nombre) {
  if (cache.has(nombre)) return cache.get(nombre);
  const p = new Promise((ok, mal) => cargador.load(`${CARPETA}${nombre}.jpg`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.wrapS = THREE.RepeatWrapping;
    ok(t);
  }, undefined, mal));
  cache.set(nombre, p);
  return p;
}

// ------------------------------------------------------------------ mirada (yaw desde -z hacia +x, pitch hacia arriba)
const vista = { yaw: 0, pitch: 0, fov: camera.fov, vy: 0, vp: 0 };
let anim = null;
function dirDe(yaw, pitch) { return new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)); }
function angulosHacia(desde, hasta) {
  const dx = hasta[0] - desde[0], dy = hasta[1] - desde[1], dz = hasta[2] - desde[2];
  return { yaw: Math.atan2(dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
}
const difAng = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
function mirarA(yaw, pitch, fov, ms = 1300) {
  anim = { y0: vista.yaw, p0: vista.pitch, f0: vista.fov, dy: difAng(vista.yaw, yaw), p1: pitch, f1: fov, t0: performance.now(), ms };
}
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// arrastrar, zoom y teclado
let arrastre = null;
canvas.addEventListener("pointerdown", (e) => { arrastre = { x: e.clientX, y: e.clientY, t: performance.now(), mov: 0 }; canvas.setPointerCapture(e.pointerId); anim = null; });
canvas.addEventListener("pointermove", (e) => {
  if (!arrastre) return;
  const s = THREE.MathUtils.degToRad(vista.fov) / innerHeight;
  const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
  arrastre.mov += Math.abs(dx) + Math.abs(dy);
  vista.yaw -= dx * s; vista.pitch += dy * s;
  vista.vy = -dx * s; vista.vp = dy * s;
  arrastre.x = e.clientX; arrastre.y = e.clientY;
});
canvas.addEventListener("pointerup", () => { arrastre = null; });
canvas.addEventListener("wheel", (e) => { e.preventDefault(); vista.fov = THREE.MathUtils.clamp(vista.fov + e.deltaY * 0.04, 30, 95); anim = null; }, { passive: false });
let pinza = null;
canvas.addEventListener("touchstart", (e) => { if (e.touches.length === 2) pinza = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), f: vista.fov }; });
canvas.addEventListener("touchmove", (e) => { if (pinza && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); vista.fov = THREE.MathUtils.clamp(pinza.f * pinza.d / d, 30, 95); } });
canvas.addEventListener("touchend", () => { pinza = null; });

// ------------------------------------------------------------------ nodos y transiciones
let nodoActual = null, cambiando = false;
async function irANodo(nombre, { mira = null, fov = null, rapido = false } = {}) {
  if (nombre === "aerea") { mostrarAerea(true); return; }
  mostrarAerea(false);
  const n = NODOS[nombre];
  const objetivo = mira ? angulosHacia(n.pos, mira) : null;
  if (nombre === nodoActual) {
    if (objetivo) mirarA(objetivo.yaw, objetivo.pitch, fov || (MOVIL ? 80 : 72));
    return;
  }
  cambiando = true;
  $("cargando").classList.remove("oculto");
  let tex;
  try { tex = await textura(nombre); } catch (e) { $("cargando").classList.add("oculto"); cambiando = false; aviso("No se pudo cargar esta vista."); return; }
  $("cargando").classList.add("oculto");
  if (!uni.tA.value || rapido) {
    uni.tA.value = tex; uni.tB.value = tex; uni.mezcla.value = 0;
  } else {
    // giro hacia el destino y fundido con un leve acercamiento, como al caminar
    if (nodoActual) {
      const hacia = angulosHacia(NODOS[nodoActual].pos, n.pos);
      mirarA(hacia.yaw, -0.05, vista.fov, 450);
      await espera(470);
    }
    uni.tB.value = tex;
    const f0 = vista.fov, t0 = performance.now();
    await new Promise((ok) => {
      const paso = () => {
        const k = Math.min(1, (performance.now() - t0) / 750);
        uni.mezcla.value = suave(k);
        vista.fov = f0 - Math.sin(k * Math.PI) * 9;
        k < 1 ? requestAnimationFrame(paso) : ok();
      };
      paso();
    });
    uni.tA.value = tex; uni.mezcla.value = 0; vista.fov = f0;
  }
  nodoActual = nombre;
  if (objetivo) {
    if (rapido) { vista.yaw = objetivo.yaw; vista.pitch = objetivo.pitch; vista.fov = fov || vista.fov; }
    else mirarA(objetivo.yaw, objetivo.pitch, fov || (MOVIL ? 80 : 72));
  }
  armarPuntos();
  pintarMapa();
  for (const v of CONEXIONES[nombre] || []) textura(v).catch(() => {});
  cambiando = false;
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function mostrarAerea(si) {
  $("aerea").classList.toggle("visible", si);
  $("capa-puntos").classList.toggle("oculto", si);
}

// ------------------------------------------------------------------ puntos interactivos (HTML sobre la imagen)
const capa = $("capa-puntos");
let elementos = [];
const VISIBLES = {
  pasillo: [],
  vestibulo: ["qr", "puntos", "division", "tienda"],
  barra: ["qr", "puntos", "caja", "carta", "cafes", "parcial", "regalo", "bolsa", "tienda", "arbol"],
  recogida: ["recogida", "bolsa", "origen", "carta", "arbol", "orgullo", "juegoSemana"],
  parche: ["tv", "agenda", "juegos", "microondas", "juegoSemana", "orgullo"],
  logros: ["orgullo", "juegoSemana", "tienda", ...PUNTOS.filter((p) => p.logro !== undefined).map((p) => p.id)],
  avionEnt: ["agua", "division"],
  avion: ["biblioteca", "puestos"],
};
function armarPuntos() {
  capa.innerHTML = "";
  elementos = [];
  const n = NODOS[nodoActual];
  const crear = (pos, clase, html, titulo, alClic) => {
    const b = document.createElement("button");
    b.className = `punto ${clase}`;
    b.innerHTML = html;
    b.title = titulo;
    b.setAttribute("aria-label", titulo);
    b.addEventListener("click", (e) => { e.stopPropagation(); alClic(); });
    capa.appendChild(b);
    elementos.push({ el: b, dir: new THREE.Vector3(pos[0] - n.pos[0], pos[1] - n.pos[1], pos[2] - n.pos[2]).normalize() });
  };
  for (const v of CONEXIONES[nodoActual] || []) {
    const d = NODOS[v];
    crear([d.pos[0], 0.15, d.pos[2]], "ir", `<span class="flecha">➜</span><span class="txt">${d.nombre}</span>`, `Ir a ${d.nombre}`, () => {
      if (modo === "guiado") ponerModo("libre", false);
      irANodo(v);
    });
  }
  for (const id of VISIBLES[nodoActual] || []) {
    const p = PUNTOS.find((q) => q.id === id);
    if (!p) continue;
    crear(p.pos, p.mini ? "mini" : "info", `<span class="ico">${p.icono}</span>${p.mini ? "" : `<span class="txt">${p.etiqueta}</span>`}`, p.etiqueta, () => ejecutar(p.accion));
  }
  crear([n.tino.pos[0], 1.55, n.tino.pos[1]], "tino", `<span class="ico">💬</span>`, "Habla con PolGreco", () => ejecutar({ tipo: "tino" }));
}
function ubicarPuntos() {
  const w = innerWidth, h = innerHeight;
  const v = new THREE.Vector3();
  for (const { el, dir } of elementos) {
    v.copy(dir).multiplyScalar(10).project(camera);
    const atras = v.z > 1 || v.z < -1;
    const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
    const fuera = atras || x < -40 || x > w + 40 || y < -40 || y > h + 40;
    el.style.display = fuera ? "none" : "";
    if (!fuera) el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }
}

// ------------------------------------------------------------------ guía: PolGreco habla
const ui = { guia: $("guia"), titulo: $("paso-titulo"), texto: $("paso-texto"), num: $("paso-num"), accion: $("paso-accion"), atras: $("btn-atras"), sig: $("btn-siguiente"), puntos: $("puntos-paso"), avatar: $("avatar-img"), voz: $("btn-voz") };
let vozActiva = (() => { try { return localStorage.getItem("cafepoli.voz") !== "no"; } catch { return true; } })();
let vozElegida = null;
function elegirVoz() {
  if (!("speechSynthesis" in window)) return;
  const pref = ["es-co", "es-419", "es-mx", "es-us", "es-pe", "es-cl", "es-ar", "es-ve", "es-ec"];
  const punt = (v) => {
    const l = v.lang.replace("_", "-").toLowerCase();
    let s = pref.includes(l) ? 100 - pref.indexOf(l) * 3 : (l.startsWith("es") ? (l === "es-es" ? 20 : 40) : -1);
    if (s < 0) return s;
    if (/natural|online|neural/i.test(v.name)) s += 30;
    if (/google/i.test(v.name)) s += 10;
    if (/jorge|gonzalo|tomas|raul|pablo|andres|male|hombre/i.test(v.name)) s += 6;
    return s;
  };
  vozElegida = speechSynthesis.getVoices().filter((v) => punt(v) >= 0).sort((a, b) => punt(b) - punt(a))[0] || null;
}
if ("speechSynthesis" in window) { elegirVoz(); speechSynthesis.onvoiceschanged = elegirVoz; }
let bocaT = null;
function boca(si, ms = 0) {
  clearInterval(bocaT);
  if (!si) { ui.avatar.src = "assets/polgreco_a.png"; return; }
  let abierta = false;
  const t0 = performance.now();
  bocaT = setInterval(() => {
    abierta = !abierta;
    ui.avatar.src = abierta ? "assets/polgreco_b.png" : "assets/polgreco_a.png";
    if (ms && performance.now() - t0 > ms) boca(false);
  }, 160);
}
const paraVoz = (t) => t.replace(/(\d)\.(\d{3})/g, "$1$2").replace(/\$/g, "");
function hablar(t) {
  if (!t) return;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (!vozActiva || !vozElegida || !("speechSynthesis" in window)) { boca(true, Math.min(6000, t.length * 42)); return; }
  const u = new SpeechSynthesisUtterance(paraVoz(t));
  u.voice = vozElegida; u.lang = vozElegida.lang; u.rate = 1.02; u.pitch = 1.05;
  u.onstart = () => boca(true);
  u.onend = () => boca(false); u.onerror = () => boca(false);
  speechSynthesis.speak(u);
}
function pintarVoz() { ui.voz.textContent = vozActiva ? "🔊" : "🔇"; ui.voz.classList.toggle("apagado", !vozActiva); }
ui.voz.addEventListener("click", () => {
  vozActiva = !vozActiva;
  try { localStorage.setItem("cafepoli.voz", vozActiva ? "si" : "no"); } catch {}
  pintarVoz();
  if (!vozActiva) { speechSynthesis?.cancel(); boca(false); } else if (!vozElegida) aviso("Tu navegador no tiene voz en español; PolGreco te habla por texto.");
});
$("btn-repetir").addEventListener("click", () => hablar(ui.texto.textContent));

// burbuja de PolGreco para explicaciones fuera del guion (puntos, app, fichas)
function decir(titulo, texto, { conVoz = true } = {}) {
  ui.guia.classList.remove("oculto");
  ui.guia.classList.toggle("libre", modo === "libre");
  ui.num.textContent = modo === "libre" ? "PolGreco te cuenta" : `Paso ${pasoActual + 1} de ${PASOS.length}`;
  ui.titulo.textContent = titulo;
  ui.texto.textContent = texto;
  if (conVoz) hablar(texto);
}

// ------------------------------------------------------------------ recorrido guiado
let pasoActual = 0, modo = "guiado";
function guardarPaso(i) { try { localStorage.setItem("cafepoli.paso360", String(i)); } catch {} }
function irPaso(i, { rapido = false, voz = true } = {}) {
  pasoActual = Math.max(0, Math.min(PASOS.length - 1, i));
  const p = PASOS[pasoActual];
  guardarPaso(pasoActual);
  ui.guia.classList.remove("oculto", "libre", "sobre-tel");
  ui.num.textContent = `Paso ${pasoActual + 1} de ${PASOS.length}`;
  ui.titulo.textContent = p.titulo;
  ui.texto.textContent = p.texto;
  ui.atras.disabled = pasoActual === 0;
  ui.sig.textContent = pasoActual === PASOS.length - 1 ? "Volver a empezar ↺" : "Siguiente →";
  ui.puntos.innerHTML = PASOS.map((_, k) => `<i class="${k < pasoActual ? "hecho" : k === pasoActual ? "actual" : ""}"></i>`).join("");
  ui.accion.innerHTML = "";
  if (p.accion) {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = p.accion.texto;
    b.addEventListener("click", () => ejecutar(p.accion));
    ui.accion.appendChild(b);
  }
  cerrarModales();
  irANodo(p.nodo, { mira: p.mira, fov: p.fov, rapido });
  resaltar(p.foco);
  if (voz) hablar(p.texto);
  pintarMapa();
}
function resaltar(id) {
  setTimeout(() => elementos.forEach(({ el }) => el.classList.remove("foco")), 10);
  if (!id) return;
  setTimeout(() => {
    const p = PUNTOS.find((q) => q.id === id || (id === "vitrina-logros" && q.logro === 0) || (id === "vitrina-merch" && q.id === "termo"));
    const el = p && [...capa.children].find((b) => b.title === p.etiqueta);
    if (el) el.classList.add("foco");
  }, 1600);
}
ui.sig.addEventListener("click", () => irPaso(pasoActual === PASOS.length - 1 ? 0 : pasoActual + 1));
ui.atras.addEventListener("click", () => irPaso(pasoActual - 1));
addEventListener("keydown", (e) => {
  if (telefonoAbierto() || !$("ficha").classList.contains("oculto")) return;
  if (modo === "guiado" && (e.key === "ArrowRight" || e.key === "PageDown")) irPaso(pasoActual + 1);
  else if (modo === "guiado" && (e.key === "ArrowLeft" || e.key === "PageUp")) irPaso(pasoActual - 1);
  else if (modo === "libre" && e.key === "ArrowLeft") vista.yaw -= 0.15;
  else if (modo === "libre" && e.key === "ArrowRight") vista.yaw += 0.15;
});

function ponerModo(m, mover = true) {
  modo = m;
  $("modo-guiado").classList.toggle("activo", m === "guiado");
  $("modo-libre").classList.toggle("activo", m === "libre");
  if (m === "libre") {
    speechSynthesis?.cancel(); boca(false);
    ui.guia.classList.add("libre");
    decir("Explora libre", "Arrastra para mirar alrededor, toca las flechas para caminar y los íconos para que te cuente cada cosa.", { conVoz: false });
    if (mover && (!nodoActual || $("aerea").classList.contains("visible"))) irANodo("vestibulo");
  } else irPaso(pasoActual);
}
$("modo-guiado").addEventListener("click", () => ponerModo("guiado"));
$("modo-libre").addEventListener("click", () => ponerModo("libre"));

// ------------------------------------------------------------------ acciones
const FRASES_TINO = [
  "¡Quiubo! Soy PolGreco, el primo cafetero de Polito. Vengo del Eje Cafetero y aquí te llamamos por tu nombre.",
  "¿Un tinto? Vale 2.000 pesos, y si traes tu termo, 300 menos.",
  "En semana de parciales, la Zona Rendir es tu mejor aliada. Y el Café Parcial, uno por persona.",
  "En el descanso de la noche pide por la app y recoge sin fila.",
];
function ejecutar(a) {
  if (!a) return;
  if (a.tipo === "app") { speechSynthesis?.cancel(); abrirTelefono(a.pantalla, () => { if (modo === "guiado") irPaso(pasoActual, { voz: false }); }); }
  else if (a.tipo === "tv") abrirTV();
  else if (a.tipo === "logro") abrirFicha(a.i);
  else if (a.tipo === "logros") abrirListaLogros();
  else if (a.tipo === "info") decir(a.titulo, a.texto);
  else if (a.tipo === "tino") decir("PolGreco", FRASES_TINO[Math.floor(Math.random() * FRASES_TINO.length)]);
  else if (a.tipo === "inicio") irPaso(0);
  else if (a.tipo === "libre") ponerModo("libre");
}

// la app del celular: PolGreco narra cada pantalla
alNarrar((titulo, texto) => {
  ui.guia.classList.add("sobre-tel");
  decir(titulo, texto);
});

// ------------------------------------------------------------------ pantalla de cumpleaños
function abrirTV() {
  $("tv").classList.remove("oculto");
  decir("La pantalla de cumpleaños", "Así se ve tu saludo de cumpleaños. Sales solo si nos das permiso, y con tu compra de ese día la galleta del colibrí va por nuestra cuenta.");
}
$("tv-cerrar").addEventListener("click", () => $("tv").classList.add("oculto"));

// ------------------------------------------------------------------ fichas de logros reales
let fichaActual = 0;
function abrirFicha(i) {
  fichaActual = (i + LOGROS.length) % LOGROS.length;
  const l = LOGROS[fichaActual];
  $("ficha-cat").textContent = l.categoria;
  $("ficha-anio").textContent = l.anio;
  $("ficha-titulo").textContent = l.titulo;
  $("ficha-texto").textContent = l.descripcion;
  $("ficha-fuente").href = l.fuente;
  $("ficha-fuente").textContent = new URL(l.fuente).hostname.replace("www.", "");
  $("ficha-num").textContent = `${fichaActual + 1} de ${LOGROS.length}`;
  $("lista-logros").classList.add("oculto");
  $("ficha").classList.remove("oculto");
  hablar(`${l.titulo}. ${l.descripcion}`);
}
$("ficha-ant").addEventListener("click", () => abrirFicha(fichaActual - 1));
$("ficha-sig").addEventListener("click", () => abrirFicha(fichaActual + 1));
$("ficha-cerrar").addEventListener("click", () => { $("ficha").classList.add("oculto"); speechSynthesis?.cancel(); boca(false); });
function abrirListaLogros() {
  const caja = $("lista-grid");
  caja.innerHTML = LOGROS.map((l, i) => `<button class="tarjeta-logro" data-i="${i}"><span class="cat">${l.categoria}</span><b>${l.titulo}</b><span class="anio">${l.anio}</span></button>`).join("");
  caja.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => abrirFicha(Number(b.dataset.i))));
  $("lista-logros").classList.remove("oculto");
}
$("lista-cerrar").addEventListener("click", () => $("lista-logros").classList.add("oculto"));
function cerrarModales() { ["ficha", "lista-logros", "tv"].forEach((id) => $(id).classList.add("oculto")); }

// ------------------------------------------------------------------ plano
const ESC = 16.5, OX = 18, OY = 18 + 8.9 * 16.5;
const px = (x) => OX + x * ESC, pz = (z) => OY + z * ESC;
function pintarMapa() {
  const svg = $("mapa-svg");
  if ($("mapa").classList.contains("oculto")) return;
  const r = (x0, z0, x1, z1, f, extra = "") => `<rect x="${px(x0)}" y="${pz(z0)}" width="${(x1 - x0) * ESC}" height="${(z1 - z0) * ESC}" fill="${f}" ${extra}/>`;
  const t = (x, z, s, f = "#0F385A", size = 12) => `<text x="${px(x)}" y="${pz(z)}" font-size="${size}" font-weight="800" fill="${f}" text-anchor="middle" font-family="Nunito, sans-serif">${s}</text>`;
  const l = (x0, z0, x1, z1, c) => `<line x1="${px(x0)}" y1="${pz(z0)}" x2="${px(x1)}" y2="${pz(z1)}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
  let s = r(0, 0, 19.0, 8.2, "#e6f6f8") + r(19.0, 0, 27.2, 8.2, "#f6e3c9") + r(21.76, -8.9, 27.2, 0, "#f6e3c9");
  s += r(16.3, 5.5, 19.0, 15.5, "#ffffff", 'stroke="#c9ced6"') + r(10.95, 5.75, 16.2, 8.2, "#4a4f57");
  s += `<path d="M${px(0)},${pz(0)} H${px(21.76)} V${pz(-8.9)} H${px(27.2)} V${pz(8.2)} H${px(19)} V${pz(5.5)} H${px(16.3)} V${pz(8.2)} H${px(0)} Z" fill="none" stroke="#0F385A" stroke-width="2"/>`;
  s += l(0, 0, 8.16, 0, "#d0115a") + l(16.3, 0, 21.76, 0, "#d0115a") + l(21.76, -8.9, 21.76, 0, "#d0115a") + l(0, 8.2, 10.9, 8.2, "#1f6fd1");
  s += `<line x1="${px(19)}" y1="${pz(0)}" x2="${px(19)}" y2="${pz(5.5)}" stroke="#15BECE" stroke-width="4" stroke-dasharray="6 4"/>`;
  s += t(5.5, 4.0, "Modo Conexión", "#0F385A", 14) + t(24.4, -4.6, "Modo Avión", "#6B4226", 14) + t(23.5, 4.6, "Modo Avión", "#6B4226", 12) + t(13.6, 7.3, "Barra", "#fff", 12) + t(17.65, 10.5, "Entrada", "#0F385A", 11);
  for (const [nom, n] of Object.entries(NODOS)) {
    const act = nom === nodoActual;
    s += `<g class="nodo" data-nodo="${nom}"><circle cx="${px(n.pos[0])}" cy="${pz(n.pos[2])}" r="${act ? 11 : 8}" fill="${act ? "#E0006E" : "#FBAF17"}" stroke="#fff" stroke-width="2"/></g>`;
    if (act) {
      const ang = THREE.MathUtils.radToDeg(vista.yaw);
      s += `<g transform="translate(${px(n.pos[0])},${pz(n.pos[2])}) rotate(${ang})"><path d="M0,0 L-20,-40 A45,45 0 0 1 20,-40 Z" fill="rgba(224,0,110,.25)"/></g>`;
    }
  }
  s += `<g font-family="Nunito, sans-serif" font-size="10" font-weight="700"><line x1="${px(0)}" y1="${pz(14.6)}" x2="${px(1.5)}" y2="${pz(14.6)}" stroke="#d0115a" stroke-width="4"/><text x="${px(1.8)}" y="${pz(14.6) + 4}" fill="#0F385A">Ventanas al exterior</text><line x1="${px(8.2)}" y1="${pz(14.6)}" x2="${px(9.7)}" y2="${pz(14.6)}" stroke="#1f6fd1" stroke-width="4"/><text x="${px(10)}" y="${pz(14.6) + 4}" fill="#0F385A">Ventanas al pasillo</text></g>`;
  svg.innerHTML = s;
  svg.querySelectorAll(".nodo").forEach((g) => g.addEventListener("click", () => { if (modo === "guiado") ponerModo("libre", false); irANodo(g.dataset.nodo); }));
}
$("btn-mapa").addEventListener("click", () => { $("mapa").classList.toggle("oculto"); pintarMapa(); });
$("mapa-cerrar").addEventListener("click", () => $("mapa").classList.add("oculto"));
$("btn-app").addEventListener("click", () => ejecutar({ tipo: "app", pantalla: "inicio" }));
$("btn-pantalla").addEventListener("click", () => (!document.fullscreenElement ? document.documentElement.requestFullscreen?.() : document.exitFullscreen?.()));

let avisoT = null;
function aviso(t, ms = 3200) { const a = $("toast"); a.textContent = t; a.classList.remove("oculto"); clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.add("oculto"), ms); }

// ------------------------------------------------------------------ ciclo
let ultimoMapa = 0;
function cuadro(ahora) {
  if (anim) {
    const k = Math.min(1, (ahora - anim.t0) / anim.ms), e = suave(k);
    vista.yaw = anim.y0 + anim.dy * e;
    vista.pitch = anim.p0 + (anim.p1 - anim.p0) * e;
    vista.fov = anim.f0 + (anim.f1 - anim.f0) * e;
    if (k >= 1) anim = null;
  } else if (!arrastre) {
    vista.yaw += vista.vy; vista.pitch += vista.vp;
    vista.vy *= 0.9; vista.vp *= 0.9;
  }
  vista.pitch = THREE.MathUtils.clamp(vista.pitch, -1.45, 1.45);
  camera.fov = vista.fov;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  camera.lookAt(dirDe(vista.yaw, vista.pitch));
  renderer.render(scene, camera);
  ubicarPuntos();
  if (!$("mapa").classList.contains("oculto") && ahora - ultimoMapa > 200) { ultimoMapa = ahora; pintarMapa(); }
  requestAnimationFrame(cuadro);
}
addEventListener("resize", () => renderer.setSize(innerWidth, innerHeight));

// ------------------------------------------------------------------ arranque
async function iniciar() {
  const barra = $("carga-progreso"), txt = $("carga-texto");
  barra.style.width = "20%"; txt.textContent = "Preparando la primera vista…";
  await textura(PASOS[0].nodo);
  barra.style.width = "70%"; txt.textContent = "Llamando a PolGreco…";
  await Promise.all(["assets/polgreco_a.png", "assets/polgreco_b.png"].map((s) => new Promise((ok) => { const im = new Image(); im.onload = im.onerror = ok; im.src = s; })));
  barra.style.width = "100%"; txt.textContent = "¡Listo!";
  $("btn-entrar").disabled = false;
  pintarVoz();
  requestAnimationFrame(cuadro);
  const pu = params.get("paso");
  if (pu !== null) entrar(Number(pu) - 1);
}
function entrar(i = 0) {
  $("carga").classList.add("oculto");
  $("barra-sup").classList.remove("oculto");
  irPaso(i, { rapido: true, voz: !params.has("captura") });
}
$("btn-entrar").addEventListener("click", () => {
  let g = 0;
  try { g = Number(localStorage.getItem("cafepoli.paso360") || 0); } catch {}
  if (g > 0 && g < PASOS.length) {
    $("carga").classList.add("oculto");
    $("reanudar-texto").textContent = `¿Seguimos donde ibas? Paso ${g + 1} de ${PASOS.length}: ${PASOS[g].titulo}.`;
    $("reanudar").classList.remove("oculto");
  } else entrar(0);
});
$("btn-seguir").addEventListener("click", () => { $("reanudar").classList.add("oculto"); let g = 0; try { g = Number(localStorage.getItem("cafepoli.paso360") || 0); } catch {} entrar(g); });
$("btn-reiniciar").addEventListener("click", () => { $("reanudar").classList.add("oculto"); entrar(0); });
iniciar().catch((e) => { console.error(e); $("carga-texto").textContent = "No se pudo cargar el recorrido. Prueba con Chrome, Edge o Safari actualizados."; });
