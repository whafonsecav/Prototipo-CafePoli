// Café Poli · recorrido 360° fotorrealista con Poligreca como guía.
// El recorrido guiado es una lista de pasos (recorrido.js). Cada paso mueve la cámara y puede abrir una «escena»
// (la app, la carta, un televisor, un producto, un logro, la marca o la maqueta) sin tapar nunca Siguiente y Atrás.
import * as THREE from "three";
import { PASOS, NODOS, CAPITULOS, TVS } from "./recorrido.js";
import { CONEXIONES, PUNTOS } from "./puntos.js";
import { LOGROS } from "./logros.js";
import { abrirTelefono, cerrarTelefono, telefonoAbierto, telefonoGuiado, alNarrar, guionApp } from "./telefono.js";
import { VOZ, claveVoz } from "./voz.js";

const $ = (id) => document.getElementById(id);
const MOVIL = matchMedia("(max-width: 760px)").matches || /Mobi|Android|iPhone/i.test(navigator.userAgent);
const CARPETA = MOVIL ? "panos/m/" : "panos/";
const params = new URLSearchParams(location.search);
const raiz = document.documentElement;

// ------------------------------------------------------------------ visor 360°
const canvas = $("escena");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: params.has("captura") });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene();
const FOV_BASE = MOVIL ? 80 : 72;
const camera = new THREE.PerspectiveCamera(FOV_BASE, innerWidth / innerHeight, 0.1, 200);
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
  p.catch(() => cache.delete(nombre));
  cache.set(nombre, p);
  return p;
}

// mirada: yaw desde -z hacia +x, pitch hacia arriba
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
// en celular la vista es angosta: el acercamiento necesita más ángulo vertical
const fovPaso = (f) => (f ? (MOVIL ? Math.min(95, f * 1.3) : f) : FOV_BASE);

let arrastre = null;
canvas.addEventListener("pointerdown", (e) => { arrastre = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); anim = null; });
canvas.addEventListener("pointermove", (e) => {
  if (!arrastre) return;
  const s = THREE.MathUtils.degToRad(vista.fov) / innerHeight;
  const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
  vista.yaw -= dx * s; vista.pitch += dy * s;
  vista.vy = -dx * s; vista.vp = dy * s;
  arrastre.x = e.clientX; arrastre.y = e.clientY;
});
canvas.addEventListener("pointerup", () => { arrastre = null; });
canvas.addEventListener("wheel", (e) => { e.preventDefault(); vista.fov = THREE.MathUtils.clamp(vista.fov + e.deltaY * 0.04, 25, 95); anim = null; }, { passive: false });
let pinza = null;
canvas.addEventListener("touchstart", (e) => { if (e.touches.length === 2) pinza = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), f: vista.fov }; });
canvas.addEventListener("touchmove", (e) => { if (pinza && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); vista.fov = THREE.MathUtils.clamp(pinza.f * pinza.d / d, 25, 95); } });
canvas.addEventListener("touchend", () => { pinza = null; });

// ------------------------------------------------------------------ nodos y transiciones (con turno: un clic rápido no mezcla vistas)
let nodoActual = null, nodoTurno = 0;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function irANodo(nombre, { mira = null, fov = null, rapido = false } = {}) {
  const turno = ++nodoTurno;
  const n = NODOS[nombre];
  if (!n) return;
  const objetivo = mira ? angulosHacia(n.pos, mira) : null;
  if (nombre === nodoActual) {
    if (objetivo) mirarA(objetivo.yaw, objetivo.pitch, fovPaso(fov));
    return;
  }
  $("cargando").classList.remove("oculto");
  let tex;
  try { tex = await textura(nombre); } catch (e) { if (turno === nodoTurno) { $("cargando").classList.add("oculto"); aviso("No se pudo cargar esta vista. Revisa tu conexión."); } return; }
  if (turno !== nodoTurno) return;
  $("cargando").classList.add("oculto");
  if (!uni.tA.value || rapido) {
    uni.tA.value = tex; uni.tB.value = tex; uni.mezcla.value = 0;
  } else {
    if (nodoActual && NODOS[nodoActual]) {
      // antes de «caminar», la cámara vuelve a su zoom normal y gira con calma (más tiempo si el giro es grande)
      const hacia = angulosHacia(NODOS[nodoActual].pos, n.pos);
      const giro = Math.abs(difAng(vista.yaw, hacia.yaw)) + Math.abs(vista.pitch + 0.05) + Math.abs(vista.fov - FOV_BASE) / 60;
      const ms = Math.round(Math.min(1500, 420 + giro * 520));
      mirarA(hacia.yaw, -0.05, FOV_BASE, ms);
      await espera(ms + 20);
      if (turno !== nodoTurno) return;
    }
    uni.tB.value = tex;
    const f0 = vista.fov, t0 = performance.now();
    await new Promise((ok) => {
      const paso = () => {
        if (turno !== nodoTurno) return ok();
        const k = Math.min(1, (performance.now() - t0) / 750);
        uni.mezcla.value = suave(k);
        vista.fov = f0 - Math.sin(k * Math.PI) * 9;
        k < 1 ? requestAnimationFrame(paso) : ok();
      };
      paso();
    });
    if (turno !== nodoTurno) return;
    uni.tA.value = tex; uni.mezcla.value = 0; vista.fov = f0;
  }
  nodoActual = nombre;
  if (objetivo) {
    if (rapido) { vista.yaw = objetivo.yaw; vista.pitch = objetivo.pitch; vista.fov = fovPaso(fov); anim = null; }
    else mirarA(objetivo.yaw, objetivo.pitch, fovPaso(fov));
  }
  armarPuntos();
  pintarMapa();
  for (const v of CONEXIONES[nombre] || []) textura(v).catch(() => {});
}

// ------------------------------------------------------------------ puntos interactivos (modo libre)
const capa = $("capa-puntos");
let elementos = [];
function armarPuntos() {
  capa.innerHTML = "";
  elementos = [];
  const n = NODOS[nodoActual];
  if (!n) return;
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
    if (!d) continue;
    crear([d.pos[0], 0.15, d.pos[2]], "ir", `<span class="flecha">➜</span><span class="txt">${d.nombre}</span>`, `Ir a ${d.nombre}`, () => {
      if (modo === "guiado") ponerModo("libre", false);
      irANodo(v);
    });
  }
  for (const p of PUNTOS.filter((q) => (q.nodos || []).includes(nodoActual))) {
    crear(p.pos, p.mini ? "mini" : "info", `<span class="ico">${p.icono}</span>${p.mini ? "" : `<span class="txt">${p.etiqueta}</span>`}`, p.etiqueta, () => ejecutar(p.accion));
  }
  if (n.tino) crear([n.tino.pos[0], 1.55, n.tino.pos[1]], "tino", `<span class="ico">💬</span>`, "Habla con Poligreca", () => ejecutar({ tipo: "tino" }));
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
// rectángulo en pantalla de un objeto plano del modelo (centro, ancho, alto, normal) visto desde el nodo actual
function rectEnPantalla(g) {
  const n = NODOS[nodoActual];
  if (!n || !g) return null;
  const nor = new THREE.Vector3(...g.n).normalize();
  const arriba = new THREE.Vector3(0, 1, 0);
  const der = new THREE.Vector3().crossVectors(arriba, nor).normalize();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const p = new THREE.Vector3(...g.c).addScaledVector(der, sx * g.w / 2).addScaledVector(arriba, sy * g.h / 2);
    const v = p.sub(new THREE.Vector3(...n.pos)).normalize().multiplyScalar(10).project(camera);
    if (v.z > 1) return null;
    const x = (v.x * 0.5 + 0.5) * innerWidth, y = (-v.y * 0.5 + 0.5) * innerHeight;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
}

// ------------------------------------------------------------------ voz de Poligreca
const ui = { guia: $("guia"), titulo: $("paso-titulo"), texto: $("paso-texto"), num: $("paso-num"), accion: $("paso-accion"), atras: $("btn-atras"), sig: $("btn-siguiente"), progreso: $("progreso-barra"), cap: $("btn-capitulos"), avatar: $("avatar-img"), voz: $("btn-voz"), repetir: $("btn-repetir") };
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
    if (/paulina|sabina|dalia|salome|helena|laura|elvira|female|mujer/i.test(v.name)) s += 8;
    return s;
  };
  vozElegida = speechSynthesis.getVoices().filter((v) => punt(v) >= 0).sort((a, b) => punt(b) - punt(a))[0] || null;
}
if ("speechSynthesis" in window) { elegirVoz(); speechSynthesis.onvoiceschanged = elegirVoz; }

const vozAudio = new Audio();
vozAudio.preload = "auto";
vozAudio.setAttribute("playsinline", "");
let vozGen = 0, ctxAudio = null, analizador = null, datosAmp = null, rafBoca = 0, bocaT = 0, bocaAbierta = null;
const IMG_A = "assets/poligreca_a.png", IMG_B = "assets/poligreca_b.png";
function pintarBoca(abierta) {
  if (abierta === bocaAbierta) return;
  bocaAbierta = abierta;
  ui.avatar.src = abierta ? IMG_B : IMG_A;
}
function bocaQuieta() { cancelAnimationFrame(rafBoca); rafBoca = 0; clearInterval(bocaT); bocaT = 0; pintarBoca(false); }
function bocaParpadeo(ms = 0) {
  bocaQuieta();
  const t0 = performance.now();
  bocaT = setInterval(() => { pintarBoca(!bocaAbierta); if (ms && performance.now() - t0 > ms) bocaQuieta(); }, 160);
}
// calla todo (audio, voz del navegador y boca); no se llama desde temporizadores viejos, así no corta la frase siguiente
function callar() {
  vozGen++;
  try { vozAudio.pause(); } catch {}
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  bocaQuieta();
  ui.repetir.classList.remove("pide-toque");
}
function desbloquearVoz() {
  if (vozAudio.dataset.listo) return;
  vozAudio.dataset.listo = "1";
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      ctxAudio = new AC();
      const montar = () => {
        if (!ctxAudio || ctxAudio.state !== "running" || analizador) return;
        const fuente = ctxAudio.createMediaElementSource(vozAudio);
        analizador = ctxAudio.createAnalyser(); analizador.fftSize = 512;
        datosAmp = new Uint8Array(analizador.fftSize);
        fuente.connect(analizador); analizador.connect(ctxAudio.destination);
      };
      const r = ctxAudio.resume();
      if (r && r.then) r.then(montar, () => {}); else montar();
    }
  } catch { analizador = null; }
  try { vozAudio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; const p = vozAudio.play(); if (p) p.then(() => { if (vozAudio.src.startsWith("data:")) vozAudio.pause(); }, () => {}); } catch {}
}
function moverBoca(gen) {
  if (gen !== vozGen || vozAudio.paused) { if (gen === vozGen) pintarBoca(false); return; }
  analizador.getByteTimeDomainData(datosAmp);
  let s = 0;
  for (let i = 0; i < datosAmp.length; i++) { const v = (datosAmp[i] - 128) / 128; s += v * v; }
  pintarBoca(Math.sqrt(s / datosAmp.length) > 0.045);
  rafBoca = requestAnimationFrame(() => moverBoca(gen));
}
function reproducirVoz(archivo, gen, alFin) {
  // si el sistema suspendió el audio (pantalla bloqueada, llamada), se reanuda antes de cada frase
  if (ctxAudio && ctxAudio.state !== "running") { try { ctxAudio.resume(); } catch {} }
  vozAudio.onended = () => { if (gen === vozGen) { bocaQuieta(); alFin && alFin(); } };
  vozAudio.onerror = () => { if (gen === vozGen) { bocaQuieta(); hablarNavegador(ui.texto.textContent, gen, alFin); } };
  vozAudio.src = archivo;
  try { vozAudio.currentTime = 0; } catch {}
  const p = vozAudio.play();
  const alEmpezar = () => {
    if (gen !== vozGen) return;
    if (analizador && ctxAudio && ctxAudio.state === "running") moverBoca(gen);
    else { clearInterval(bocaT); bocaT = setInterval(() => { if (gen !== vozGen || vozAudio.paused) return; pintarBoca(!bocaAbierta); }, 160); }
  };
  // si el navegador no deja sonar sin un toque, se avisa en «Repetir» en vez de mover la boca en silencio
  if (p && p.then) p.then(alEmpezar, (e) => { if (gen === vozGen && e && e.name === "NotAllowedError") ui.repetir.classList.add("pide-toque"); });
  else alEmpezar();
}
function precargarVoz(texto) {
  const a = texto && VOZ[claveVoz(texto)];
  if (a) fetch(a, { priority: "low" }).catch(() => {});
}
// voz del navegador (solo si falta el audio): por oraciones, porque Chrome corta las frases de más de ~15 s
function hablarNavegador(t, gen, alFin) {
  if (!vozElegida || !("speechSynthesis" in window)) { bocaParpadeo(Math.min(9000, t.length * 55)); return; }
  const frases = t.replace(/(\d)\.(\d{3})/g, "$1$2").replace(/\$/g, "").match(/[^.!?…]+[.!?…]*\s*/g) || [t];
  frases.forEach((f, i) => {
    const u = new SpeechSynthesisUtterance(f.trim());
    u.voice = vozElegida; u.lang = vozElegida.lang; u.rate = 1.02; u.pitch = 1.08;
    if (i === 0) u.onstart = () => { if (gen === vozGen) bocaParpadeo(); };
    if (i === frases.length - 1) u.onend = () => { if (gen === vozGen) { bocaQuieta(); alFin && alFin(); } };
    u.onerror = () => { if (gen === vozGen) bocaQuieta(); };
    speechSynthesis.speak(u);
  });
}
function hablar(t, alFin) {
  if (!t) return;
  callar();
  const gen = vozGen;
  if (!vozActiva) { bocaParpadeo(Math.min(6000, t.length * 42)); return; }
  const archivo = VOZ[claveVoz(t)];
  if (archivo) reproducirVoz(archivo, gen, alFin);
  else hablarNavegador(t, gen, alFin);
}
document.addEventListener("visibilitychange", () => { if (document.hidden) callar(); });
function pintarVoz() { ui.voz.textContent = vozActiva ? "🔊" : "🔇"; ui.voz.classList.toggle("apagado", !vozActiva); }
ui.voz.addEventListener("click", () => {
  vozActiva = !vozActiva;
  try { localStorage.setItem("cafepoli.voz", vozActiva ? "si" : "no"); } catch {}
  pintarVoz();
  if (!vozActiva) callar(); else hablar(ui.texto.textContent, marcarListo);
});
ui.repetir.addEventListener("click", () => { desbloquearVoz(); hablar(ui.texto.textContent, marcarListo); });

// burbuja de Poligreca fuera del guion (modo libre)
function decir(titulo, texto, { conVoz = true } = {}) {
  ui.guia.classList.remove("oculto");
  ui.guia.classList.toggle("libre", modo === "libre");
  ui.num.textContent = modo === "libre" ? "Poligreca te cuenta" : `Paso ${pasoActual + 1} de ${PASOS.length}`;
  ui.titulo.textContent = titulo;
  ui.texto.textContent = texto;
  ui.texto.scrollTop = 0;
  if (conVoz) hablar(texto);
}

// ------------------------------------------------------------------ escenario: lo que se abre sobre la vista sin tapar la guía
const body = document.body;
let escenaActual = null;   // {tipo, ...}
function medirGuia() {
  const sup = $("barra-sup").getBoundingClientRect();
  const gui = ui.guia.getBoundingClientRect();
  raiz.style.setProperty("--sup", `${Math.round(sup.bottom)}px`);
  const g = `${Math.round(ui.guia.classList.contains("oculto") ? 0 : innerHeight - gui.top)}px`;
  raiz.style.setProperty("--gui", g);
  raiz.style.setProperty("--guia-alto", g);
}
new ResizeObserver(medirGuia).observe(ui.guia);
new ResizeObserver(medirGuia).observe($("barra-sup"));
addEventListener("resize", medirGuia);

const ESCENAS = ["tvx", "producto", "logo-escena", "maqueta", "ficha", "qrapp"];
function cerrarEscenas(salvo = null) {
  body.classList.remove("acercando");
  if (salvo !== "app" && telefonoAbierto()) cerrarTelefono();
  if (salvo !== "carta" && carta && carta.abierta()) carta.cerrar();
  if (salvo !== "tv") detenerTV();
  if (salvo !== "maqueta") detenerMaqueta();
  for (const id of ESCENAS) {
    const tipoDe = { tvx: "tv", producto: "producto", "logo-escena": "logo", maqueta: "maqueta", ficha: "logro", qrapp: "qrapp" }[id];
    if (tipoDe !== salvo) $(id).classList.add("oculto");
  }
  $("ficha").classList.remove("en-guia");
  $("lista-logros").classList.add("oculto");
}
function ponerEscena(tipo) {
  body.classList.toggle("con-escena", !!tipo);
  body.dataset.escena = tipo || "";
  escenaActual = tipo ? { tipo } : null;
  requestAnimationFrame(medirGuia);
}

// ---- carta (módulo propio con su diseño)
let carta = null, TABS_CARTA = [];
const cargaCarta = import("./carta.js").then((m) => {
  TABS_CARTA = m.TABS_CARTA || [];
  carta = m.montarCarta($("carta"), { alCerrar: () => { if (modo === "libre") { callar(); ponerEscena(null); } } });
}).catch((e) => console.warn("Carta no disponible:", e));
async function abrirCarta(tab) {
  await cargaCarta;
  if (!carta) return;
  const id = typeof tab === "number" ? TABS_CARTA[tab]?.id : tab;
  carta.abrir(id);
}

// ---- televisor: Poli TV, transmisión, pantallas de la barra; crece desde el televisor del modelo
const TV_LISTAS = {
  politv: [
    { tipo: "cumple" },
    { img: "assets/pantallas/tv-transicion.png", ms: 2600, clase: "transicion" },
    { img: "assets/pantallas/tv-agenda.png", ms: 5200 },
    { img: "assets/pantallas/tv-transicion.png", ms: 2600, clase: "transicion" },
    { img: "assets/pantallas/tv-noticias-1.png", alt: "assets/pantallas/tv-orgullo.png", ms: 4600 },
    { img: "assets/pantallas/tv-noticias-2.png", ms: 4600, opcional: true },
    { img: "assets/pantallas/tv-noticias-3.png", ms: 4600, opcional: true },
  ],
  cumple: [{ tipo: "cumple", repetir: true }],
  canal: [{ img: "assets/pantallas/tv-canal.png", ms: 99999, clase: "en-vivo" }],
  barra: [
    { img: "assets/pantallas/barra-1.png", alt: "assets/pantallas/carta-1.png", ms: 4200 },
    { img: "assets/pantallas/tv-promo.png", ms: 3800, opcional: true },
    { img: "assets/pantallas/barra-3.png", alt: "assets/pantallas/carta-3.png", ms: 4200 },
    { img: "assets/pantallas/tv-cumple-1.png", alt: "assets/pantallas/tv-cumple.png", ms: 3200 },
    { img: "assets/pantallas/barra-2.png", alt: "assets/pantallas/tv-club.png", ms: 4200 },
    { img: "assets/pantallas/tv-bolsa.png", ms: 3800, opcional: true },
  ],
};
let tvTurno = 0;
const existe = new Map();
function imagenOk(src) {
  if (!src) return Promise.resolve(false);
  if (!existe.has(src)) existe.set(src, new Promise((ok) => { const im = new Image(); im.onload = () => ok(true); im.onerror = () => ok(false); im.src = src; }));
  return existe.get(src);
}
async function cuadrosCumple() {
  const lista = [];
  for (let i = 1; i <= 6; i++) { const s = `assets/pantallas/tv-cumple-${i}.png`; if (await imagenOk(s)) lista.push(s); else break; }
  if (!lista.length && (await imagenOk("assets/pantallas/tv-cumple.png"))) lista.push("assets/pantallas/tv-cumple.png");
  return lista;
}
function detenerTV() { tvTurno++; $("tvx").classList.remove("encendido"); }
async function ponerCuadro(src, clase = "") {
  const pan = $("tvx-pantalla");
  const nuevo = document.createElement("img");
  nuevo.className = `tvx-cuadro ${clase}`;
  nuevo.alt = "";
  nuevo.src = src;
  pan.appendChild(nuevo);
  await new Promise((r) => (nuevo.complete ? r() : (nuevo.onload = nuevo.onerror = r)));
  const viejos = [...pan.querySelectorAll(".tvx-cuadro")].filter((e) => e !== nuevo);
  viejos.forEach((v) => v.classList.add("sale"));
  void nuevo.offsetWidth;
  nuevo.classList.add("visible");
  setTimeout(() => viejos.forEach((v) => v.remove()), 1100);
}
async function correrTV(lista, turno) {
  const cumple = await cuadrosCumple();
  do {
    for (const s of lista) {
      if (turno !== tvTurno) return;
      if (s.tipo === "cumple") {
        for (const c of cumple) { if (turno !== tvTurno) return; await ponerCuadro(c, "nombre"); await espera(2800); }
        if (s.repetir) continue;
        continue;
      }
      let src = s.img;
      if (!(await imagenOk(src))) { if (s.alt && (await imagenOk(s.alt))) src = s.alt; else continue; }
      if (turno !== tvTurno) return;
      await ponerCuadro(src, s.clase || "");
      await espera(s.ms || 4000);
    }
  } while (turno === tvTurno && lista.length > 0);
}
async function mostrarTV({ lista = "politv", tv = null, expandir = false, titulo = "" } = {}) {
  const turno = ++tvTurno;
  const el = $("tvx");
  $("tvx-titulo").textContent = titulo;
  el.classList.toggle("vivo", lista === "canal");
  const yaVisible = !el.classList.contains("oculto");
  el.classList.remove("oculto");
  if (expandir && !yaVisible && TVS[tv]) await crecerDesde(TVS[tv], $("tvx-marco"), turno);
  if (turno !== tvTurno) return;
  el.classList.add("encendido");
  correrTV(TV_LISTAS[lista] || TV_LISTAS.politv, turno);
}
// «entrar» al televisor: la cámara se acerca y la pantalla crece desde su lugar en el modelo hasta el escenario
async function crecerDesde(g, destino, turno) {
  const n = NODOS[nodoActual];
  if (n) {
    const a = angulosHacia(n.pos, g.c);
    mirarA(a.yaw, a.pitch, MOVIL ? 30 : 22, 1300);
    await espera(1350);
    if (turno !== tvTurno) return;
  }
  const r0 = rectEnPantalla(g);
  body.classList.remove("acercando");
  if (!r0 || r0.width < 4) return;
  const r1 = destino.getBoundingClientRect();
  if (!r1.width) return;
  const sx = r0.width / r1.width, sy = r0.height / r1.height;
  const tx = r0.left - r1.left, ty = r0.top - r1.top;
  destino.animate([
    { transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`, opacity: 0.6, filter: "brightness(1.3)" },
    { transformOrigin: "0 0", transform: "none", opacity: 1, filter: "none" },
  ], { duration: 950, easing: "cubic-bezier(.2,.7,.2,1)" });
  await espera(950);
}

// ---- producto de la Tienda Poli
function mostrarProducto(e) {
  const el = $("producto");
  const imgs = (e.imgs || []).map((s) => `<figure><img src="assets/productos/${s}.jpg" alt="" onerror="this.closest('figure').classList.add('sin-foto')"><figcaption>${(e.nombres || {})[s] || ""}</figcaption></figure>`).join("");
  el.innerHTML = `
    <div class="prod-caja">
      <div class="prod-fotos n${(e.imgs || []).length}">${imgs}</div>
      <div class="prod-info">
        <p class="prod-ceja">Tienda Poli</p>
        <h3>${e.titulo}</h3>
        ${e.datos ? `<ul>${e.datos.map((d) => `<li>${d}</li>`).join("")}</ul>` : ""}
      </div>
    </div>`;
  el.classList.remove("oculto");
}

// ---- logro de la vitrina, en tarjeta compacta (la cámara se acerca al trofeo)
let fichaActual = 0;
function pintarFicha(i) {
  fichaActual = (i + LOGROS.length) % LOGROS.length;
  const l = LOGROS[fichaActual];
  $("ficha-cat").textContent = l.categoria;
  $("ficha-anio").textContent = l.anio;
  $("ficha-titulo").textContent = l.titulo;
  $("ficha-texto").textContent = l.descripcion;
  $("ficha-fuente").href = l.fuente;
  $("ficha-fuente").textContent = new URL(l.fuente).hostname.replace("www.", "");
  $("ficha-num").textContent = `${fichaActual + 1} de ${LOGROS.length}`;
}
function abrirFicha(i, { enGuia = false } = {}) {
  pintarFicha(i);
  $("lista-logros").classList.add("oculto");
  $("ficha").classList.toggle("en-guia", enGuia);
  $("ficha").classList.remove("oculto");
  if (!enGuia) { const l = LOGROS[fichaActual]; hablar(`${l.titulo}. ${l.descripcion}`); }
}
$("ficha-ant").addEventListener("click", () => abrirFicha(fichaActual - 1));
$("ficha-sig").addEventListener("click", () => abrirFicha(fichaActual + 1));
$("ficha-cerrar").addEventListener("click", () => { $("ficha").classList.add("oculto"); callar(); });
function abrirListaLogros() {
  const caja = $("lista-grid");
  caja.innerHTML = LOGROS.map((l, i) => `<button class="tarjeta-logro" data-i="${i}"><span class="cat">${l.categoria}</span><b>${l.titulo}</b><span class="anio">${l.anio}</span></button>`).join("");
  caja.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { if (modo === "guiado") ponerModo("libre", false); abrirFicha(Number(b.dataset.i)); }));
  $("lista-logros").classList.remove("oculto");
}
$("lista-cerrar").addEventListener("click", () => $("lista-logros").classList.add("oculto"));

// ---- la marca, contada dentro del televisor
const LOGO_FASES = {
  nombre: () => `
    <div class="lg-fila">
      <img class="lg-logo" src="assets/logo-vertical.svg" alt="Logo de Café Poli">
      <div class="lg-texto">
        <p class="lg-ceja">¿Por qué Café Poli?</p>
        <div class="lg-par"><b>Café</b><span>el café de origen, comprado directo a caficultores colombianos</span></div>
        <div class="lg-par"><b>Poli</b><span>la comunidad del Poli: el café es de ella y está hecho para ella</span></div>
      </div>
    </div>`,
  colibri: () => `
    <div class="lg-fila">
      <img class="lg-iso latido" src="assets/isotipo.svg" alt="Colibrí de Café Poli">
      <div class="lg-texto">
        <p class="lg-ceja">El símbolo: un colibrí</p>
        <div class="lg-dato"><b>165</b><span>especies de colibríes viven en Colombia, de las más de 300 que hay</span></div>
        <div class="lg-dato"><b>⚡</b><span>Recarga energía a cada rato para seguir volando, como quien estudia de día o de noche</span></div>
      </div>
    </div>`,
  grano: () => `
    <div class="lg-fila">
      <img class="lg-iso" src="assets/isotipo.svg" alt="Colibrí de Café Poli">
      <div class="lg-texto">
        <p class="lg-ceja">Mira bien el colibrí</p>
        <div class="lg-par"><b>Cuerpo</b><span>un grano de café, con su pliegue en forma de S</span></div>
        <div class="lg-par"><b>Alas</b><span>los dos trazos curvos del símbolo del Poli, en cian y magenta</span></div>
        <div class="lg-par"><b>Tilde</b><span>la tilde de CAFÉ también es un grano</span></div>
      </div>
    </div>`,
  colores: () => `
    <div class="lg-colores">
      <p class="lg-ceja">Los colores del Poli</p>
      <div class="lg-paleta">
        <div style="--c:#0F385A;flex:5"><b>Azul Noche Poli</b><small>manda</small></div>
        <div style="--c:#15BECE;flex:2"><b>Cian Poli</b><small>apoya</small></div>
        <div style="--c:#E0006E;flex:1.2"><b>Magenta Colibrí</b><small>acento</small></div>
        <div style="--c:#FBAF17;flex:1.2;--t:#0F385A"><b>Oro Panela</b><small>acento</small></div>
        <div style="--c:#A6CE38;flex:.6;--t:#0F385A"><b>Verde</b><small>poquito</small></div>
      </div>
    </div>`,
  eslogan: () => `
    <div class="lg-eslogan">
      <img src="assets/logo-horizontal-blanco.svg" alt="Café Poli" class="lg-hor">
      <p><span style="--i:0">Somos origen.</span> <span style="--i:1">Somos país.</span> <span style="--i:2">Somos Poli.</span></p>
      <div class="lg-tres"><div><b>Origen</b>el café de nuestras fincas</div><div><b>País</b>gente de todas las regiones</div><div><b>Poli</b>un café que es nuestro</div></div>
    </div>`,
};
async function mostrarLogo(e) {
  const el = $("logo-escena");
  const turno = ++tvTurno;
  const yaVisible = !el.classList.contains("oculto");
  el.querySelector(".lg-cuerpo").innerHTML = (LOGO_FASES[e.fase] || LOGO_FASES.nombre)();
  el.classList.remove("oculto");
  if (e.expandir && !yaVisible && TVS[e.tv]) await crecerDesde(TVS[e.tv], el.querySelector(".lg-tv"), turno);
}

// ---- maqueta 3D en tiempo real (módulo aparte; se carga solo cuando se abre)
let maqueta3d = null;
const cargaMaqueta = () => (maqueta3d ||= import("./maqueta3d.js"));
const archivoMaqueta = MOVIL ? "maqueta/cafe-m.glb" : "maqueta/cafe.glb";
let maquetaPrecargada = false;
function precargarMaqueta() {
  if (maquetaPrecargada) return;
  maquetaPrecargada = true;
  cargaMaqueta().catch(() => {});
  fetch(archivoMaqueta, { priority: "low" }).catch(() => {});
}
function mostrarMaqueta() {
  $("maqueta").classList.remove("oculto");
  cargaMaqueta().then((m) => m.abrirMaqueta3D()).catch((e) => { console.warn(e); $("maq3d-carga").innerHTML = '<p>No se pudo abrir la maqueta 3D.</p>'; });
}
function detenerMaqueta() { if (maqueta3d) maqueta3d.then((m) => m.cerrarMaqueta3D()).catch(() => {}); }

// ------------------------------------------------------------------ recorrido guiado
let pasoActual = 0, modo = "guiado", pasoGen = 0;
function guardarPaso(i) { try { localStorage.setItem("cafepoli.paso360", String(i)); } catch {} }
function marcarListo() { if (modo === "guiado") ui.sig.classList.add("pulso"); }
const capDe = (i) => { let c = CAPITULOS[0]; for (const k of CAPITULOS) if (k.desde <= i) c = k; return c; };
function irPaso(i, { rapido = false, voz = true } = {}) {
  const gen = ++pasoGen;
  pasoActual = Math.max(0, Math.min(PASOS.length - 1, i));
  const p = PASOS[pasoActual];
  guardarPaso(pasoActual);
  ui.guia.classList.remove("oculto", "libre");
  ui.sig.classList.remove("pulso");
  const cap = capDe(pasoActual);
  ui.num.textContent = `Paso ${pasoActual + 1} de ${PASOS.length}`;
  ui.cap.textContent = `${cap.nombre} ▾`;
  ui.titulo.textContent = p.titulo;
  ui.texto.textContent = p.texto;
  ui.texto.scrollTop = 0;
  ui.atras.disabled = pasoActual === 0;
  ui.sig.textContent = pasoActual === PASOS.length - 1 ? "Volver a empezar ↺" : "Siguiente →";
  ui.progreso.style.width = `${((pasoActual + 1) / PASOS.length) * 100}%`;
  ui.accion.innerHTML = "";
  if (p.accion) {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = p.accion.texto;
    b.addEventListener("click", () => ejecutar(p.accion));
    ui.accion.appendChild(b);
  }
  $("lista-capitulos").classList.add("oculto");
  const e = p.escena || null;
  cerrarEscenas(e ? e.tipo : null);
  ponerEscena(e ? e.tipo : null);
  const llegada = p.nodo ? irANodo(p.nodo, { mira: p.mira, fov: p.fov, rapido }) : Promise.resolve();
  // si un paso anterior dejó la cámara muy cerca (televisor), vuelve con calma a su zoom normal
  if (!p.mira && (!p.nodo || p.nodo === nodoActual) && !(e && (e.tipo === "tv" || e.tipo === "logo")) && vista.fov < FOV_BASE - 6) mirarA(vista.yaw, Math.min(vista.pitch, 0.2), FOV_BASE, 1100);
  if (/^marca|^maqueta/.test(p.id)) precargarMaqueta();
  if (voz) hablar(p.texto, () => { if (gen === pasoGen) marcarListo(); });
  if (e) abrirEscenaPaso(e, gen, llegada);
  if (voz && PASOS[pasoActual + 1]) precargarVoz(PASOS[pasoActual + 1].texto);
  pintarMapa();
}
async function abrirEscenaPaso(e, gen, llegada) {
  if ((e.tipo === "tv" || e.tipo === "logo") && e.expandir) {
    // primero se llega a la vista y se mira el televisor; luego la pantalla crece hasta el escenario
    body.classList.add("acercando");
    await llegada;
    if (gen !== pasoGen) return;
  }
  if (e.tipo === "app") {
    if (!telefonoGuiado()) abrirTelefono(e.pantalla || "inicio", { guiado: true });
    if (e.espera) await espera(e.espera);
    if (gen === pasoGen) guionApp(e.guion);
  } else if (e.tipo === "carta") {
    abrirCarta(e.tab);
  } else if (e.tipo === "tv") {
    await mostrarTV(e);
  } else if (e.tipo === "producto") {
    mostrarProducto(e);
  } else if (e.tipo === "logro") {
    abrirFicha(e.i, { enGuia: true });
  } else if (e.tipo === "logo") {
    await mostrarLogo(e);
  } else if (e.tipo === "maqueta") {
    mostrarMaqueta();
  } else if (e.tipo === "qrapp") {
    $("qrapp").classList.remove("oculto");
  }
  if (gen === pasoGen) body.classList.remove("acercando");
}
ui.sig.addEventListener("click", () => { desbloquearVoz(); irPaso(pasoActual === PASOS.length - 1 ? 0 : pasoActual + 1); });
ui.atras.addEventListener("click", () => { desbloquearVoz(); irPaso(pasoActual - 1); });
addEventListener("keydown", (e) => {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (modo === "guiado" && (e.key === "ArrowRight" || e.key === "PageDown")) irPaso(pasoActual + 1);
  else if (modo === "guiado" && (e.key === "ArrowLeft" || e.key === "PageUp")) irPaso(pasoActual - 1);
  else if (modo === "libre" && e.key === "ArrowLeft") vista.yaw -= 0.15;
  else if (modo === "libre" && e.key === "ArrowRight") vista.yaw += 0.15;
  else if (e.key === "Escape" && modo === "libre") { cerrarEscenas(); ponerEscena(null); callar(); }
});
// capítulos: saltar a cualquier parte del recorrido
ui.cap.addEventListener("click", () => {
  const l = $("lista-capitulos");
  if (!l.classList.contains("oculto")) { l.classList.add("oculto"); return; }
  const actual = capDe(pasoActual);
  l.innerHTML = CAPITULOS.map((c) => `<button data-desde="${c.desde}" class="${c === actual ? "activo" : ""}">${c.nombre}</button>`).join("");
  l.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { l.classList.add("oculto"); desbloquearVoz(); if (modo !== "guiado") ponerModo("guiado", false); irPaso(Number(b.dataset.desde)); }));
  l.classList.remove("oculto");
});

function ponerModo(m, mover = true) {
  modo = m;
  $("modo-guiado").classList.toggle("activo", m === "guiado");
  $("modo-libre").classList.toggle("activo", m === "libre");
  body.classList.toggle("modo-libre", m === "libre");
  if (m === "libre") {
    pasoGen++;
    callar();
    cerrarEscenas(); ponerEscena(null);
    ui.guia.classList.add("libre");
    decir("Explora libre", "Arrastra para mirar alrededor, usa las flechas para caminar y los íconos para que te cuente cada cosa.", { conVoz: false });
    if (mover && !nodoActual) irANodo("vestibulo");
  } else irPaso(pasoActual);
}
$("modo-guiado").addEventListener("click", () => { desbloquearVoz(); ponerModo("guiado"); });
$("modo-libre").addEventListener("click", () => ponerModo("libre"));

// ------------------------------------------------------------------ acciones del modo libre (puntos, botones)
const FRASES_TINO = [
  "¡Quiubo! Soy Poligreca, la prima cafetera de Polito. Vengo del Eje Cafetero y aquí te llamamos por tu nombre.",
  "¿Un tinto? Vale 2.000 pesos, y si traes tu propio vaso, 300 menos.",
  "En semana de parciales, Modo Avión es tu mejor aliado. Y el Café Parcial, uno por persona.",
  "En el descanso de la noche pide por la app y recoge sin fila.",
  "¿No tomas café? Prueba la cata de tres tés, un Milo o un chocolate santafereño con queso.",
];
function ejecutar(a) {
  if (!a) return;
  if (a.tipo === "app") {
    callar(); cerrarEscenas("app"); ponerEscena("app");
    abrirTelefono(a.pantalla || "inicio", { guiado: false, alCerrar: () => { callar(); ponerEscena(null); if (modo === "guiado") irPaso(pasoActual, { voz: false }); } });
  } else if (a.tipo === "tv") { cerrarEscenas("tv"); ponerEscena("tv"); mostrarTV({ lista: a.lista || "politv", titulo: a.titulo || "Poli TV" }); decirLibre(a); }
  else if (a.tipo === "logro") { cerrarEscenas(); abrirFicha(a.i); }
  else if (a.tipo === "logros") abrirListaLogros();
  else if (a.tipo === "carta") { cerrarEscenas("carta"); ponerEscena("carta"); abrirCarta(a.tab ?? 0); }
  else if (a.tipo === "producto") { cerrarEscenas("producto"); ponerEscena("producto"); mostrarProducto(a); decirLibre(a); }
  else if (a.tipo === "maqueta") { cerrarEscenas("maqueta"); ponerEscena("maqueta"); mostrarMaqueta(); }
  else if (a.tipo === "info") decir(a.titulo, a.texto);
  else if (a.tipo === "tino") decir("Poligreca", FRASES_TINO[Math.floor(Math.random() * FRASES_TINO.length)]);
  else if (a.tipo === "inicio") irPaso(0);
  else if (a.tipo === "enlace") window.open(a.url, "_blank", "noopener");
  else if (a.tipo === "libre") ponerModo("libre");
}
function decirLibre(a) { if (a.texto) decir(a.titulo || "", a.texto); }
$("escena-cerrar").addEventListener("click", () => { callar(); cerrarEscenas(); ponerEscena(null); if (modo === "guiado") ponerModo("libre", false); });
alNarrar((titulo, texto) => decir(titulo, texto));

// ------------------------------------------------------------------ plano
const ESC = 16.5, OX = 18, OY = 18 + 8.9 * 16.5;
const px = (x) => OX + x * ESC, pz = (z) => OY + z * ESC;
function pintarMapa() {
  const svg = $("mapa-svg");
  if ($("mapa").classList.contains("oculto")) return;
  const r = (x0, z0, x1, z1, f, extra = "") => `<rect x="${px(x0)}" y="${pz(z0)}" width="${(x1 - x0) * ESC}" height="${(z1 - z0) * ESC}" fill="${f}" ${extra}/>`;
  const t = (x, z, s, f = "#0F385A", size = 12) => `<text x="${px(x)}" y="${pz(z)}" font-size="${size}" font-weight="800" fill="${f}" text-anchor="middle" font-family="Nunito Sans, sans-serif">${s}</text>`;
  const l = (x0, z0, x1, z1, c) => `<line x1="${px(x0)}" y1="${pz(z0)}" x2="${px(x1)}" y2="${pz(z1)}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
  let s = r(0, 0, 19.0, 8.2, "#e6f6f8") + r(19.0, 0, 27.2, 8.2, "#f6e3c9") + r(21.76, -8.9, 27.2, 0, "#f6e3c9");
  s += r(16.3, 5.5, 19.0, 15.5, "#ffffff", 'stroke="#c9ced6"') + r(10.95, 5.75, 16.2, 8.2, "#4a4f57");
  s += `<path d="M${px(0)},${pz(0)} H${px(21.76)} V${pz(-8.9)} H${px(27.2)} V${pz(8.2)} H${px(19)} V${pz(5.5)} H${px(16.3)} V${pz(8.2)} H${px(0)} Z" fill="none" stroke="#0F385A" stroke-width="2"/>`;
  s += l(0, 0, 8.16, 0, "#d0115a") + l(16.3, 0, 21.76, 0, "#d0115a") + l(21.76, -8.9, 21.76, 0, "#d0115a") + l(0, 8.2, 10.9, 8.2, "#1f6fd1");
  s += `<line x1="${px(19)}" y1="${pz(0)}" x2="${px(19)}" y2="${pz(5.5)}" stroke="#6B4226" stroke-width="5"/>`;
  s += t(5.5, 4.0, "Modo Conexión", "#0F385A", 14) + t(24.4, -4.6, "Rincón Respira", "#6B4226", 12) + t(23.5, 4.6, "Modo Avión", "#6B4226", 13) + t(13.6, 7.3, "Barra", "#fff", 12) + t(17.65, 10.5, "Entrada", "#0F385A", 11);
  for (const [nom, n] of Object.entries(NODOS)) {
    const act = nom === nodoActual;
    s += `<g class="nodo" data-nodo="${nom}"><circle cx="${px(n.pos[0])}" cy="${pz(n.pos[2])}" r="${act ? 11 : 8}" fill="${act ? "#E0006E" : "#FBAF17"}" stroke="#fff" stroke-width="2"/></g>`;
    if (act) {
      const ang = THREE.MathUtils.radToDeg(vista.yaw);
      s += `<g transform="translate(${px(n.pos[0])},${pz(n.pos[2])}) rotate(${ang})"><path d="M0,0 L-20,-40 A45,45 0 0 1 20,-40 Z" fill="rgba(224,0,110,.25)"/></g>`;
    }
  }
  s += `<g font-family="Nunito Sans, sans-serif" font-size="10" font-weight="700"><line x1="${px(0)}" y1="${pz(14.6)}" x2="${px(1.5)}" y2="${pz(14.6)}" stroke="#d0115a" stroke-width="4"/><text x="${px(1.8)}" y="${pz(14.6) + 4}" fill="#0F385A">Ventanas al exterior</text><line x1="${px(8.2)}" y1="${pz(14.6)}" x2="${px(9.7)}" y2="${pz(14.6)}" stroke="#1f6fd1" stroke-width="4"/><text x="${px(10)}" y="${pz(14.6) + 4}" fill="#0F385A">Ventanas al pasillo</text></g>`;
  svg.innerHTML = s;
  svg.querySelectorAll(".nodo").forEach((g) => g.addEventListener("click", () => { if (modo === "guiado") ponerModo("libre", false); irANodo(g.dataset.nodo); }));
}
$("btn-mapa").addEventListener("click", () => { $("mapa").classList.toggle("oculto"); pintarMapa(); });
$("mapa-cerrar").addEventListener("click", () => $("mapa").classList.add("oculto"));
$("btn-app").addEventListener("click", () => ejecutar({ tipo: "app", pantalla: "inicio" }));
$("btn-maqueta").addEventListener("click", () => { if (modo === "guiado") ponerModo("libre", false); ejecutar({ tipo: "maqueta" }); });
$("btn-pantalla").addEventListener("click", () => {
  if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
  else pantallaCompleta().then(() => { if (ES_MOVIL) girarHorizontal(); });
});

let avisoT = null;
function aviso(t, ms = 3200) { const a = $("toast"); a.textContent = t; a.classList.remove("oculto"); clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.add("oculto"), ms); }

// ------------------------------------------------------------------ ciclo de dibujo
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
  barra.style.width = "70%"; txt.textContent = "Llamando a Poligreca…";
  await Promise.all([IMG_A, IMG_B].map((s) => new Promise((ok) => { const im = new Image(); im.onload = im.onerror = ok; im.src = s; })));
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
  requestAnimationFrame(medirGuia);
}
// ------------------------------------------------------------------ celular: pantalla completa y en horizontal
// En un celular, el primer toque en «Entrar» pide pantalla completa y gira la vista a horizontal (Android/Chrome).
// Donde el navegador no deja (iPhone/Safari), aparece un aviso para girar el celular, que se puede cerrar.
const ES_MOVIL = matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 820;
function pantallaCompleta() {
  const el = document.documentElement;
  const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!pedir || document.fullscreenElement || document.webkitFullscreenElement) return Promise.resolve();
  try { return Promise.resolve(pedir.call(el, { navigationUI: "hide" })).catch(() => {}); } catch { return Promise.resolve(); }
}
function girarHorizontal() {
  try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape"); if (p && p.catch) p.catch(() => {}); } catch {}
}
function modoHorizontal() {
  if (!ES_MOVIL) return;
  document.body.classList.add("es-movil", "en-recorrido");
  pantallaCompleta().then(girarHorizontal);
}
$("btn-girar-seguir").addEventListener("click", () => document.body.classList.add("girar-visto"));
$("btn-entrar").addEventListener("click", () => {
  modoHorizontal();
  desbloquearVoz();
  let g = 0;
  try { g = Number(localStorage.getItem("cafepoli.paso360") || 0); } catch {}
  if (g > 0 && g < PASOS.length) {
    $("carga").classList.add("oculto");
    $("reanudar-texto").textContent = `¿Seguimos donde ibas? Paso ${g + 1} de ${PASOS.length}: ${PASOS[g].titulo}.`;
    $("reanudar").classList.remove("oculto");
  } else entrar(0);
});
$("btn-seguir").addEventListener("click", () => { desbloquearVoz(); $("reanudar").classList.add("oculto"); let g = 0; try { g = Number(localStorage.getItem("cafepoli.paso360") || 0); } catch {} entrar(g); });
$("btn-reiniciar").addEventListener("click", () => { desbloquearVoz(); $("reanudar").classList.add("oculto"); entrar(0); });
iniciar().catch((e) => { console.error(e); $("carga-texto").textContent = "No se pudo cargar el recorrido. Prueba con Chrome, Edge o Safari actualizados."; });
