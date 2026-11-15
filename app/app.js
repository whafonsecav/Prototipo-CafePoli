// Café Poli · app (prototipo funcional). Todo corre en el celular: la carta sale de ../js/datos.js (la misma del
// recorrido y del Excel), el inventario se simula por día y hora, los pagos son simulaciones y nada sale del aparato.
import { CARTA, DESCUENTO_TERMO, DETALLE_REGALO, VASOS, fmt } from "../js/datos.js";
import { tipoDeDia } from "./festivos.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ datos guardados (solo en este celular)
const CLAVE = "cafepoli.app.v1";
const base = () => ({
  perfil: null, puntos: 40, historial: [["Bienvenida al Club Colibrí", 40]], carrito: {}, conVaso: false, recogida: { tipo: "ahora", hora: "" },
  pedidos: [], regalos: [], canjes: [], bolsas: [], compras: {}, demo: null, saludo: null, pago: "Nequi", borrador: null,
});
let memoria = null;
function leer() { try { const t = localStorage.getItem(CLAVE); return t ? JSON.parse(t) : null; } catch { return memoria; } }
let D = Object.assign(base(), leer() || {});
function guardar() { memoria = D; try { localStorage.setItem(CLAVE, JSON.stringify(D)); } catch { /* sin almacenamiento: queda en memoria */ } }

// ------------------------------------------------------------------ reloj de Bogotá (o la fecha del modo demo)
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fmtBogota = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
function ahora() {
  let a, m, d, min;
  if (D.demo) {
    [a, m, d] = D.demo.fecha.split("-").map(Number);
    const [hh, mm] = D.demo.hora.split(":").map(Number);
    min = hh * 60 + mm + Math.floor((Date.now() - D.demo.desde) / 60000);
    if (min >= 1440) min = 1439;
  } else {
    const p = Object.fromEntries(fmtBogota.formatToParts(new Date()).map((x) => [x.type, x.value]));
    a = +p.year; m = +p.month; d = +p.day; min = (+p.hour % 24) * 60 + +p.minute;
  }
  const fecha = `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const dia = tipoDeDia(a, m, d);
  const ds = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return { a, m, d, min, fecha, dia, ds };
}
const hhmm = (min) => { const h = Math.floor(min / 60) % 24, mm = min % 60, h12 = ((h + 11) % 12) + 1; return `${h12}:${String(mm).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`; };
const fechaLarga = (t) => `${DIAS[t.ds]} ${t.d} de ${MESES[t.m - 1]} de ${t.a}`;
const ABRE = 6 * 60, CIERRA = 21 * 60 + 45, BOLSA_DESDE = 20 * 60 + 30, BOLSA_HASTA = 21 * 60 + 30;
function abierto(t = ahora()) { return t.dia.habil && t.min >= ABRE && t.min < CIERRA; }

// ------------------------------------------------------------------ carta e inventario simulado
const PRODUCTOS = CARTA.flatMap((c) => c.items.map((p) => ({ ...p, mundo: c.cat, color: c.color, tipo: c.tipo })));
const porId = (id) => PRODUCTOS.find((p) => p.id === id);
const tamanosDe = (p) => (p.id === "vaso" ? VASOS : p.tamanos || null);
const precio = (id, oz) => { const p = porId(id); const t = tamanosDe(p); if (t && oz) { const s = t.find((x) => String(x.oz) === String(oz)); if (s) return s.precio; } return t ? t[0].precio : p.precio; };
const nombreCorto = (p) => p.nombre.split(":")[0].replace(/ \(.*\)/, "");
const conOz = (id, oz) => `${nombreCorto(porId(id))}${oz ? ` · ${oz} oz` : ""}`;
// unidades que hornea o recibe la barra cada día; las bebidas se preparan al momento
const STOCK = { pan: 60, panyuca: 45, bunuelo: 50, almojabana: 40, arepa: 35, boyacense: 18, arepahuevo: 24, empanada: 40, sandwich: 16,
  tortica: 16, zanahoria: 14, cheesecake: 12, brownie: 26, galletas: 40, postre2: 8, fruta: 14, vaso: 20, termo: 9, pocillo: 12 };
const COMBO = { pausa: "pan", desayuno: "arepahuevo", cparcial: "brownie", tardecata: "postre2" };
const TIENDA = new Set(["vaso", "termo", "pocillo"]);
// parte de lo horneado que ya se vendió a cada hora (picos entre clases y antes de las 6:40 p. m.)
const CURVA = [[360, 0], [540, .24], [720, .45], [840, .58], [1020, .7], [1120, .86], [1230, .93], [1305, .97]];
function curva(min) {
  if (min <= CURVA[0][0]) return 0;
  for (let i = 1; i < CURVA.length; i++) if (min <= CURVA[i][0]) { const [m0, v0] = CURVA[i - 1], [m1, v1] = CURVA[i]; return v0 + (v1 - v0) * (min - m0) / (m1 - m0); }
  return CURVA[CURVA.length - 1][1];
}
function azar(semilla) { let h = 2166136261; for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; }
function stock(id, t = ahora()) {
  if (COMBO[id]) return stock(COMBO[id], t);
  if (!(id in STOCK)) return Infinity;
  const compradas = (D.compras[t.fecha] || {})[id] || 0;
  if (TIENDA.has(id) || !t.dia.habil) return Math.max(0, STOCK[id] - compradas); // día no hábil: se hornea para el próximo día hábil
  const factor = 0.9 + azar(id + t.fecha) * 0.2;
  const vendidas = Math.round(STOCK[id] * Math.min(1, curva(t.min) * factor));
  return Math.max(0, STOCK[id] - vendidas - compradas);
}
function descontar(id, n, t = ahora()) {
  const real = COMBO[id] || id;
  if (!(real in STOCK)) return;
  D.compras[t.fecha] = D.compras[t.fecha] || {};
  D.compras[t.fecha][real] = (D.compras[t.fecha][real] || 0) + n;
}
function etiquetaStock(id) {
  const t = ahora();
  const s = stock(id, t);
  if (s === Infinity) return abierto(t) ? ["Disponible", ""] : ["Se prepara al abrir", "pocos"];
  if (!t.dia.habil && !TIENDA.has(COMBO[id] || id)) return ["Para el próximo día hábil", "pocos"];
  if (s <= 0) return ["Agotado", "no"];
  if (s <= 8) return [`Quedan ${s}`, "pocos"];
  return ["Disponible", ""];
}

// ------------------------------------------------------------------ utilidades de interfaz
let avisoT = 0;
function aviso(t, ms = 2400) { const el = $("#toast"); el.textContent = t; el.classList.remove("oculto"); clearTimeout(avisoT); avisoT = setTimeout(() => el.classList.add("oculto"), ms); }
const hoja = $("#hoja"), hojaCaja = $("#hoja-caja");
let alCerrarHoja = null;
function abrirHoja(html, { alCerrar = null, cerrable = true } = {}) {
  hojaCaja.innerHTML = html;
  hoja.classList.remove("oculto");
  hoja.dataset.cerrable = cerrable ? "1" : "";
  alCerrarHoja = alCerrar;
  setTimeout(() => hojaCaja.querySelector("button, input, select")?.focus({ preventScroll: true }), 50);
}
function cerrarHoja(valor) { hoja.classList.add("oculto"); hojaCaja.innerHTML = ""; const cb = alCerrarHoja; alCerrarHoja = null; if (cb) cb(valor); }
hoja.addEventListener("click", (e) => { if (e.target === hoja && hoja.dataset.cerrable) cerrarHoja(null); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !hoja.classList.contains("oculto") && hoja.dataset.cerrable) cerrarHoja(null); });
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const codigo = (pref, n = 4) => `${pref}-${Array.from({ length: n }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join("")}`;
function sumarPuntos(total, concepto) { const p = Math.floor(total / 1000); if (p > 0) { D.puntos += p; D.historial.push([concepto, p]); } return p; }
function qrSVG(texto, tam = 170) {
  if (typeof window.qrcode !== "function") return `<svg viewBox="0 0 10 10" width="${tam}" height="${tam}"><rect width="10" height="10" fill="#fff"/><text x="5" y="5.6" font-size="1.2" text-anchor="middle" fill="#0F385A">QR</text></svg>`;
  const q = window.qrcode(0, "M"); q.addData(texto); q.make();
  const n = q.getModuleCount();
  let r = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) r += `M${x},${y}h1v1h-1z`;
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" width="${tam}" height="${tam}" shape-rendering="crispEdges" role="img" aria-label="Código QR"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${r}" fill="#0F385A"/></svg>`;
}

// ------------------------------------------------------------------ pagos simulados (nunca se piden datos reales)
const METODOS = {
  Nequi: { color: "#4b1b6e", ini: "N", tipo: "app" },
  Daviplata: { color: "#c8102e", ini: "D", tipo: "app" },
  "Bre-B": { color: "#0F385A", ini: "B", tipo: "llave" },
  Tarjeta: { color: "#174B76", ini: "💳", tipo: "tarjeta" },
};
const logoPago = (m, tam = "") => `<span class="logo-pago ${tam}" style="background:${METODOS[m].color}">${METODOS[m].ini}</span>`;
function pagar(monto, concepto) {
  return new Promise((resolver) => {
    let fin = false, reloj = 0;
    const terminar = (ok) => { if (fin) return; fin = true; clearInterval(reloj); cerrarHoja(); resolver(ok); };
    const elegir = () => {
      abrirHoja(`
        <span class="sello-sim">Simulación: no se cobra nada</span>
        <h2 style="margin-top:4px">¿Cómo pagas ${fmt(monto)}?</h2>
        <p class="sub">${esc(concepto)}</p>
        <div class="metodos">${Object.keys(METODOS).map((m) => `<button class="metodo ${m === D.pago ? "activa" : ""}" data-m="${m}">${logoPago(m)}${m === "Tarjeta" ? "Tarjeta crédito o débito" : m}</button>`).join("")}</div>
        <button class="btn ancho" id="pg-seguir">Continuar</button>
        <button class="btn sec ancho" id="pg-cancelar" style="margin-top:8px">Cancelar</button>`, { alCerrar: (v) => { if (v === null) terminar(false); } });
      $$(".metodo", hojaCaja).forEach((b) => b.addEventListener("click", () => { D.pago = b.dataset.m; guardar(); $$(".metodo", hojaCaja).forEach((x) => x.classList.toggle("activa", x === b)); }));
      $("#pg-seguir").addEventListener("click", () => flujo(D.pago));
      $("#pg-cancelar").addEventListener("click", () => terminar(false));
    };
    const aprobado = async (txt = "¡Pago aprobado!") => {
      clearInterval(reloj);
      hojaCaja.innerHTML = `<div class="pago-app listo-grande"><div class="ico">✅</div><h2>${txt}</h2><p class="sub">${fmt(monto)} · ${esc(concepto)}</p><span class="sello-sim">Simulación: no se cobró nada</span></div>`;
      await espera(1100);
      terminar(true);
    };
    const flujo = (m) => {
      const M = METODOS[m];
      if (M.tipo === "app") {
        let s = 60;
        abrirHoja(`
          <div class="pago-app">
            <span class="sello-sim">Simulación: no se cobra nada</span>
            ${logoPago(m)}
            <h2>Aprueba el pago en tu app ${m}</h2>
            <p class="sub">Te llegó una solicitud de <b>${fmt(monto)}</b> de Café Poli. Ábrela en ${m} y apruébala.</p>
            <div class="cuenta-atras" id="pg-reloj">1:00</div>
            <button class="btn ancho" id="pg-aprobar">Aprobar (simulado)</button>
            <button class="btn sec ancho" id="pg-cancelar" style="margin-top:8px">Cancelar</button>
          </div>`, { cerrable: false });
        reloj = setInterval(() => { s--; const r = $("#pg-reloj"); if (r) r.textContent = `0:${String(Math.max(0, s)).padStart(2, "0")}`; if (s <= 0) { clearInterval(reloj); hojaCaja.innerHTML = `<div class="pago-app"><h2>Se venció la solicitud</h2><p class="sub">No se cobró nada. Puedes intentarlo otra vez.</p><button class="btn ancho" id="pg-otra">Volver</button></div>`; $("#pg-otra").addEventListener("click", elegir); } }, 1000);
        $("#pg-aprobar").addEventListener("click", () => aprobado());
        $("#pg-cancelar").addEventListener("click", () => terminar(false));
      } else if (M.tipo === "llave") {
        abrirHoja(`
          <div class="pago-app">
            <span class="sello-sim">Simulación: no se cobra nada</span>
            <h2>Paga con Bre-B</h2>
            <p class="sub">Desde la app de tu banco, envía <b>${fmt(monto)}</b> a la llave de Café Poli <b>@cafepoli</b> o escanea este QR.</p>
            <div class="qr-pago">${qrSVG(`BREB|@cafepoli|${monto}|${concepto}`, 154)}</div>
            <p class="sub" id="pg-estado"><span class="cargando oscuro"></span> Esperando la transferencia…</p>
            <button class="btn sec ancho" id="pg-cancelar">Cancelar</button>
          </div>`, { cerrable: false });
        $("#pg-cancelar").addEventListener("click", () => terminar(false));
        setTimeout(() => { if (!fin && $("#pg-estado")) aprobado("¡Transferencia recibida!"); }, 3800);
      } else {
        abrirHoja(`
          <div class="pago-app">
            <span class="sello-sim">Simulación: no se cobra nada</span>
            <h2>Paga con tarjeta</h2>
            <div class="tarjeta-prueba"><div class="fila entre"><span class="chip-t"></span><small>Tarjeta de prueba</small></div><div class="num">•••• •••• •••• 4242</div><div class="fila entre"><small>${esc(D.perfil?.nombre || "Estudiante Poli")}</small><small>12/29</small></div></div>
            <p class="sub">Es una tarjeta de demostración ya guardada. Aquí nunca se escriben datos de tarjetas reales.</p>
            <button class="btn ancho" id="pg-tarjeta">Pagar ${fmt(monto)}</button>
            <button class="btn sec ancho" id="pg-cancelar" style="margin-top:8px">Cancelar</button>
          </div>`, { cerrable: false });
        $("#pg-cancelar").addEventListener("click", () => terminar(false));
        $("#pg-tarjeta").addEventListener("click", async (e) => { e.target.disabled = true; e.target.innerHTML = `<span class="cargando"></span> Procesando…`; await espera(1600); if (!fin) aprobado("¡Tarjeta aprobada!"); });
      }
    };
    elegir();
  });
}

// ------------------------------------------------------------------ navegación
const vista = $("#vista");
let actual = "inicio", param = null;
function ir(nombre, p = null, { historia = true } = {}) {
  if (!D.perfil && !["perfil", "reclamar", "recibido"].includes(nombre)) nombre = "bienvenida";
  actual = nombre; param = p;
  const fn = VISTAS[nombre] || VISTAS.inicio;
  vista.innerHTML = fn(p);
  vista.scrollTop = 0;
  (ENLACES[nombre] || (() => {}))(p);
  $$(".tab").forEach((t) => t.classList.toggle("activo", t.dataset.ir === nombre || (nombre === "pedido" && t.dataset.ir === "pedir") || (nombre === "regaloListo" && t.dataset.ir === "regalar")));
  if (historia) { const h = `#${nombre}${p ? "=" + encodeURIComponent(p) : ""}`; if (location.hash !== h) history.replaceState(null, "", h); }
  pintarCabecera();
}
document.addEventListener("click", (e) => { const b = e.target.closest("[data-ir]"); if (b && !b.disabled) { e.preventDefault(); ir(b.dataset.ir, b.dataset.p || null); } });
function pintarCabecera() {
  const t = ahora();
  const el = $("#estado-local");
  const ab = abierto(t);
  el.textContent = ab ? `Abierto · ${hhmm(t.min)}` : (t.dia.habil ? `Cerrado · ${hhmm(t.min)}` : `Cerrado · ${t.dia.motivo.split(" (")[0]}`);
  el.classList.toggle("cerrado", !ab);
  const n = Object.values(D.carrito).reduce((a, b) => a + b, 0);
  const b = $("#badge-carrito");
  b.textContent = n; b.classList.toggle("oculto", !n);
  const av = $("#aviso-demo");
  if (D.demo) { av.innerHTML = `<span>Modo demo: ${fechaLarga(t)} · ${hhmm(t.min)}</span><button id="salir-demo">Salir</button>`; av.classList.remove("oculto"); $("#salir-demo").onclick = () => { D.demo = null; guardar(); revisarCumple(); ir(actual, param); }; }
  else av.classList.add("oculto");
}

// ------------------------------------------------------------------ cumpleaños (solo días hábiles)
const esCumple = (t = ahora()) => D.perfil && +D.perfil.cumpleDia === t.d && +D.perfil.cumpleMes === t.m;
function revisarCumple() {
  const t = ahora();
  if (!esCumple(t) || !t.dia.habil || D.saludo === t.fecha) return;
  D.saludo = t.fecha; guardar();
  abrirHoja(`
    <div class="cumple">
      <img src="img/poligreca-celebra.svg" alt="Poligreca celebra tu cumpleaños">
      <h2>¡Feliz cumpleaños, ${esc(D.perfil.nombre.split(" ")[0])}!</h2>
      <p class="sub">De parte de todo Café Poli: con tu compra de hoy, <b>la galleta del colibrí va por nuestra cuenta</b>. Pásate por la barra y te la entregamos por tu nombre.</p>
      ${D.perfil.permisoTV ? `<p class="sub">Y como nos diste permiso, hoy sales en Poli TV. 🎉</p>` : ""}
      <button class="btn ancho" id="cumple-ok">¡Gracias! Voy para allá</button>
    </div>`);
  $("#cumple-ok").addEventListener("click", () => cerrarHoja());
  confeti();
}
function confeti() {
  const c = $("#confeti"), g = c.getContext("2d");
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
  const col = ["#E0006E", "#FBAF17", "#15BECE", "#FFFFFF", "#A6CE38"];
  const p = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -Math.random() * c.height * 0.6, r: (4 + Math.random() * 6) * devicePixelRatio, v: (2 + Math.random() * 3) * devicePixelRatio, a: Math.random() * 6, c: col[Math.floor(Math.random() * col.length)] }));
  const t0 = performance.now();
  const paso = (t) => {
    g.clearRect(0, 0, c.width, c.height);
    for (const q of p) { q.y += q.v; q.x += Math.sin((t / 300) + q.a) * 1.5; g.save(); g.translate(q.x, q.y); g.rotate(q.a + t / 400); g.fillStyle = q.c; g.fillRect(-q.r / 2, -q.r / 4, q.r, q.r / 2); g.restore(); }
    if (t - t0 < 4200) requestAnimationFrame(paso); else g.clearRect(0, 0, c.width, c.height);
  };
  requestAnimationFrame(paso);
}

// ------------------------------------------------------------------ pedidos: estado en vivo
function estadoPedido(p) {
  const n = Date.now();
  if (p.entregado) return "entregado";
  if (n >= p.listoEn) return "listo";
  if (n >= p.preparaEn) return "preparando";
  return p.programado ? "programado" : "recibido";
}
function avisarListo(p) {
  if (p.avisado) return;
  p.avisado = true; guardar();
  aviso(`¡Tu pedido ${p.codigo} está listo! Pasa por la barra.`, 4200);
  try { if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.([200, 100, 200]); } catch {}
  try { if ("Notification" in window && Notification.permission === "granted") new Notification("Café Poli", { body: `¡${D.perfil?.nombre?.split(" ")[0] || "Hola"}, tu pedido ${p.codigo} está listo! Pasa por la barra.`, icon: "img/icono-192.png" }); } catch {}
}
let firmaPrevia = "";
setInterval(() => {
  for (const p of D.pedidos) if (estadoPedido(p) === "listo") avisarListo(p);
  const t = ahora();
  const b = D.perfil ? bolsaHoy(t) : { activa: false, quedan: 0 };
  if (b.activa && b.quedan > 0 && D.bolsaAvisada !== t.fecha) {
    D.bolsaAvisada = t.fecha; guardar();
    aviso("🛍️ ¡Ya está la bolsa del final del día! 2 productos por $3.000", 4200);
    try { if ("Notification" in window && Notification.permission === "granted") new Notification("Café Poli", { body: "Ya está la bolsa del final del día: 2 productos del día por $3.000. ¡Resérvala!", icon: "img/icono-192.png" }); } catch {}
  }
  const firma = `${t.fecha}|${t.min}|${b.activa}|${b.quedan}|${D.pedidos.map(estadoPedido).join(",")}`;
  if (firma !== firmaPrevia && (actual === "pedido" || actual === "inicio" || actual === "bolsa")) { const y = vista.scrollTop; ir(actual, param, { historia: false }); vista.scrollTop = y; }
  firmaPrevia = firma;
  pintarCabecera();
}, 1000);

// ------------------------------------------------------------------ vistas
const lema = `<p class="lema">Somos origen. Somos país. Somos Poli.</p>`;
const tarjetaPuntos = () => `
  <button class="tarjeta navy puntos-mini" data-ir="puntos" style="width:100%;text-align:left;border:0">
    <div class="fila entre"><h3>⭐ ${D.puntos} Puntos Colibrí</h3><small style="color:var(--oro);font-weight:800">Ver</small></div>
    <div class="barra"><span style="width:${Math.min(100, D.puntos % 100 || (D.puntos >= 100 ? 100 : 0))}%"></span></div>
    <p>${D.puntos >= 100 ? "¡Ya tienes un tinto gratis para canjear!" : `Te faltan ${100 - D.puntos} puntos para tu próximo tinto.`}</p>
  </button>`;

const VISTAS = {
  bienvenida: () => `
    <div class="bienvenida">
      <img class="poli" src="img/poligreca-saluda.svg" alt="Poligreca te saluda">
      <h1>¡Quiubo! Bienvenido a Café Poli</h1>
      <p class="sub">Soy Poligreca. Regístrate con tu correo del Poli para pedir sin fila, regalar cafés y sumar Puntos Colibrí.</p>
    </div>
    ${formPerfil(true)}
    <button class="btn sec ancho" id="ejemplo">Probar con datos de ejemplo</button>
    <p class="nota-sim">Prototipo: tus datos se guardan solo en este celular.</p>
    ${lema}`,

  inicio: () => {
    const t = ahora();
    const activo = D.pedidos.filter((p) => estadoPedido(p) !== "entregado").slice(-1)[0];
    const bolsa = bolsaHoy(t);
    const cumple = esCumple(t) && t.dia.habil;
    return `
      <div class="hola">
        <img src="img/poligreca-saluda.svg" alt="">
        <div><small>${fechaLarga(t)}</small><h1>Hola, ${esc(D.perfil.nombre.split(" ")[0])}</h1></div>
      </div>
      ${cumple ? `<div class="tarjeta" style="border-left:6px solid var(--magenta)"><h3>🎂 ¡Hoy es tu cumpleaños!</h3><p>Con tu compra de hoy, la galleta del colibrí va por nuestra cuenta. Pídela en la barra.</p></div>` : ""}
      ${!abierto(t) ? `<div class="tarjeta"><h3>${t.dia.habil ? "Ahora estamos cerrados" : `Hoy no abrimos: ${t.dia.motivo}`}</h3><p>Abrimos de lunes a sábado, de 6:00 a. m. a 9:45 p. m. Puedes ver la carta y dejar tu pedido programado.</p></div>` : ""}
      ${bolsa.activa && bolsa.quedan > 0 ? `<button class="banner-bolsa" data-ir="bolsa"><span class="ico">🛍️</span><span><b>¡Ya está la bolsa del final del día!</b><br>2 productos del día por ${fmt(3000)}. Quedan ${bolsa.quedan}.</span></button>` : ""}
      ${activo ? tarjetaPedido(activo, true) : ""}
      ${tarjetaPuntos()}
      <div class="acciones">
        <button class="accion a-magenta" data-ir="carta"><span>☕</span>Pide y pasa<small>Sin hacer fila</small></button>
        <button class="accion a-navy" data-ir="regalar"><span>🎁</span>Regala un Café Poli<small>Con tu mensaje</small></button>
        <button class="accion a-oro" data-ir="vaso"><span>♻️</span>Trae tu vaso<small>−${fmt(DESCUENTO_TERMO)} en cualquier tamaño</small></button>
        <button class="accion a-cian" data-ir="bolsa"><span>🛍️</span>Bolsa del día<small>Desde las 8:30 p. m.</small></button>
      </div>
      <div class="tarjeta"><h3>⚡ Semana de parciales</h3><p>Llegó el Café Parcial: doble espresso con panela y canela. Unos 125 mg de cafeína: uno por persona.</p></div>
      <div class="tarjeta"><h3>🙋 ¿Te regalaron un café?</h3><p>Muestra tu código en la barra. Si trabajas en la barra, <button class="enlace" data-ir="reclamar">valida un código aquí</button>.</p></div>
      ${lema}`;
  },

  carta: () => `
    <h1>La carta</h1>
    <p class="sub">Por tamaño en onzas. Si traes tu propio vaso, cualquier bebida vale ${fmt(DESCUENTO_TERMO)} menos.</p>
    <div class="buscar"><input id="buscar" type="search" placeholder="Busca: tinto, Milo, buñuelo…" aria-label="Buscar en la carta" value="${esc(estadoCarta.q)}"></div>
    <div class="chips" role="tablist" aria-label="Mundos de la carta">
      ${["Todo", ...CARTA.map((c) => c.cat)].map((c) => `<button class="chip ${estadoCarta.mundo === c ? "activo" : ""}" data-mundo="${esc(c)}">${esc(c)}</button>`).join("")}
    </div>
    <div id="lista-carta">${listaCarta()}</div>
    ${lema}`,

  pedir: () => {
    const t = ahora();
    const lineas = Object.entries(D.carrito);
    if (!lineas.length) {
      const prev = D.pedidos.slice(-3).reverse();
      return `<h1>Tu pedido</h1>
        <div class="vacio"><div class="grande">🛍️</div><p>Tu pedido está vacío.</p><button class="btn" data-ir="carta">Ver la carta</button></div>
        ${prev.length ? `<h2>Tus pedidos</h2>${prev.map((p) => tarjetaPedido(p, true)).join("")}` : ""}${lema}`;
    }
    const r = resumenCarrito();
    const opt = (tipo, txt) => `<button class="opcion ${D.recogida.tipo === tipo ? "activa" : ""}" data-rec="${tipo}">${txt}</button>`;
    return `
      <h1>Tu pedido</h1>
      <p class="sub">${abierto(t) ? "Pide, paga y pasa por él sin hacer fila." : "Estamos cerrados: tu pedido queda programado."}</p>
      <div class="tarjeta">
        ${lineas.map(([k, n]) => { const [id, oz] = k.split("@"); const s = stock(id, t); return `
          <div class="item-carrito"><div class="n">${esc(conOz(id, oz))}<small>${fmt(precio(id, oz))} c/u${s !== Infinity && s < n ? ` · <b style="color:#c0003c">solo quedan ${s}</b>` : ""}</small></div>
          <div class="cantidad"><button data-menos="${k}" aria-label="Quitar uno">−</button><b>${n}</b><button data-mas="${k}" aria-label="Agregar uno">+</button></div></div>`; }).join("")}
        ${r.desc ? `<div class="linea"><span>♻️ Descuento por traer tu vaso</span><span>−${fmt(r.desc)}</span></div>` : ""}
        <div class="linea total"><span>Total</span><span>${fmt(r.total)}</span></div>
      </div>
      ${r.bebidas ? `<label class="interruptor"><span>♻️ Traigo mi propio vaso (−${fmt(DESCUENTO_TERMO)})</span><input type="checkbox" id="chk-vaso" ${D.conVaso ? "checked" : ""}></label>` : ""}
      <h2>¿Cuándo pasas por él?</h2>
      <div class="opciones">
        ${abierto(t) ? opt("ahora", "Lo antes posible (≈10 min)") : ""}
        ${opt("descanso", "En el descanso de la noche (8:20 p. m.)")}
        ${opt("hora", "A una hora exacta")}
      </div>
      ${D.recogida.tipo === "hora" ? `<label class="campo"><span>Hora de recogida</span><select id="hora-rec">${horasRecogida(t).map((h) => `<option value="${h}" ${String(h) === String(D.recogida.hora) ? "selected" : ""}>${hhmm(h)}${!abierto(t) || h < t.min ? " (programado)" : ""}</option>`).join("")}</select></label>` : ""}
      <button class="btn ancho" id="btn-pagar" ${r.problema ? "disabled" : ""}>Pagar ${fmt(r.total)}</button>
      ${r.problema ? `<p class="nota-sim" style="color:#c0003c;font-weight:800">${r.problema}</p>` : ""}
      <p class="nota-sim">Simulación: no se cobra nada. Sumas ${Math.floor(r.total / 1000)} Puntos Colibrí.</p>
      ${lema}`;
  },

  pedido: (cod) => {
    const p = D.pedidos.find((x) => x.codigo === cod) || D.pedidos[D.pedidos.length - 1];
    if (!p) return VISTAS.pedir();
    return `<h1>Pedido ${p.codigo}</h1>${tarjetaPedido(p, false)}
      <button class="btn sec ancho" data-ir="carta">Pedir algo más</button>${lema}`;
  },

  regalar: () => {
    const r = borrador();
    const prods = REGALABLES.map(porId).filter(Boolean);
    const p = porId(r.producto);
    const tams = tamanosDe(p);
    const total = precio(r.producto, r.oz) + (r.tarjeta ? DETALLE_REGALO.precio : 0);
    return `
      <h1>Regala un Café Poli</h1>
      <p class="sub">Tú escribes y firmas el mensaje: aquí no hay regalos anónimos. Le llega una imagen con tu mensaje y un código para reclamarlo en la barra.</p>
      <h2>¿Para quién es?</h2>
      <div class="opciones">${["Alguien especial", "Un amigo", "Mi hijo o hija", "Un profe"].map((v) => `<button class="opcion ${r.para === v ? "activa" : ""}" data-para="${v}">${v}</button>`).join("")}</div>
      <label class="campo"><span>¿Qué le regalas?</span><select id="rg-prod">${prods.map((q) => `<option value="${q.id}" ${q.id === r.producto ? "selected" : ""}>${esc(nombreCorto(q))} · desde ${fmt(precio(q.id))}</option>`).join("")}</select></label>
      ${tams ? `<div class="opciones">${tams.map((s) => `<button class="opcion ${String(s.oz) === String(r.oz) ? "activa" : ""}" data-oz="${s.oz}">${s.oz} oz · ${fmt(s.precio)}</button>`).join("")}</div>` : ""}
      <label class="campo"><span>Nombre de quien lo recibe</span><input id="rg-nombre" maxlength="28" value="${esc(r.nombre)}" autocomplete="off"></label>
      <label class="campo"><span>Tu mensaje <b class="contador" id="rg-cont">${r.mensaje.length}/120</b></span><textarea id="rg-msj" maxlength="120" placeholder="Escribe algo bonito…">${esc(r.mensaje)}</textarea></label>
      <label class="campo"><span>Firma</span><input id="rg-firma" maxlength="24" value="${esc(r.firma)}" autocomplete="off"></label>
      <label class="interruptor"><span>💌 ${DETALLE_REGALO.nombre} (+${fmt(DETALLE_REGALO.precio)})</span><input type="checkbox" id="rg-tarjeta" ${r.tarjeta ? "checked" : ""}></label>
      <div class="tarjeta"><div class="linea total" style="border:0;margin:0;padding:0"><span>Total</span><span id="rg-total">${fmt(total)}</span></div></div>
      <button class="btn ancho" id="rg-pagar">Pagar y crear el código</button>
      <p class="nota-sim">Simulación: no se cobra nada. El código vale 30 días.</p>
      ${D.regalos.length ? `<h2>Tus regalos</h2>${D.regalos.slice(-4).reverse().map((g) => `<button class="tarjeta" data-ir="regaloListo" data-p="${g.codigo}" style="width:100%;text-align:left;border:0"><div class="fila entre"><h3>Para ${esc(g.nombre)}</h3><b style="color:var(--magenta)">${g.codigo}</b></div><p>${esc(conOz(g.producto, g.oz))} · ${g.usado ? "ya reclamado" : `vale hasta el ${g.vence}`}</p></button>`).join("")}` : ""}
      ${lema}`;
  },

  regaloListo: (cod) => {
    const g = D.regalos.find((x) => x.codigo === cod) || D.regalos[D.regalos.length - 1];
    if (!g) return VISTAS.regalar();
    return `
      <h1>¡Tu regalo está listo!</h1>
      <p class="sub">Compártelo con ${esc(g.nombre)}: le llega esta imagen con tu mensaje y el código para reclamarlo en la barra.</p>
      <div class="vista-previa"><img id="img-regalo" alt="Tarjeta del regalo para ${esc(g.nombre)} con el código ${g.codigo}"></div>
      <div class="codigo-grande">${g.codigo}</div>
      <div class="compartir">
        <button class="btn ancho" id="rg-compartir">📲 Compartir (Instagram, WhatsApp…)</button>
        <a class="btn verde-wa ancho" id="rg-wa" target="_blank" rel="noopener">Enviar por WhatsApp</a>
        <button class="btn sec ancho" id="rg-bajar">⬇️ Descargar la imagen</button>
        <button class="btn sec ancho" id="rg-copiar">Copiar el mensaje</button>
      </div>
      <p class="nota-sim">Vale hasta el ${g.vence}. Se reclama una sola vez.</p>
      ${lema}`;
  },

  recibido: (dato) => {
    const g = b64.de(dato || "");
    if (!g || !g.c) return `<div class="vacio"><div class="grande">🎁</div><p>Este enlace de regalo no está completo.</p><button class="btn" data-ir="inicio">Ir a Café Poli</button></div>`;
    const p = porId(g.p);
    return `
      <div class="tarjeta navy" style="text-align:center;padding:22px 16px">
        <p style="color:var(--cian);font-weight:800;letter-spacing:.18em;font-size:.72rem;margin:0">TE REGALARON UN CAFÉ</p>
        <h1 style="color:#fff;font-size:1.9rem;margin:8px 0">Para ${esc(g.n)}${g.e ? " ❤" : ""}</h1>
        <p style="color:var(--oro);font-weight:800">${esc(p ? conOz(g.p, g.o) : "Un Café Poli")}${g.k ? " + chocolatina" : ""}</p>
        <p style="font-style:italic;font-size:1.05rem;margin:14px 0 6px;color:#fff">“${esc(g.m)}”</p>
        <p style="color:var(--oro);font-weight:800;font-family:var(--f-titulo)">— ${esc(g.f)}</p>
      </div>
      <div class="tarjeta" style="text-align:center">
        <h3>Tu código</h3>
        <div class="codigo-grande">${esc(g.c)}</div>
        <div class="qr-pago">${qrSVG(`CAFEPOLI:${g.c}`, 154)}</div>
        <p>Muéstralo en la barra de Café Poli (City Campus, piso 2) hasta el ${esc(g.v)}. Te lo entregamos por tu nombre.</p>
      </div>
      <button class="btn ancho" data-ir="inicio">Conocer la app de Café Poli</button>
      ${lema}`;
  },

  reclamar: (cod) => `
    <h1>Reclamar un código</h1>
    <p class="sub">En la barra: el barista escribe o escanea el código del regalo, de un tinto canjeado o de la bolsa del día.</p>
    <label class="campo"><span>Código</span><input id="rc-cod" placeholder="CP-7KQ4" value="${esc(cod || "")}" autocapitalize="characters" autocomplete="off"></label>
    <button class="btn ancho" id="rc-validar">Validar</button>
    <div id="rc-res" style="margin-top:12px"></div>
    ${lema}`,

  puntos: () => `
    <div class="tarjeta navy" style="text-align:center">
      <p style="margin:0 0 6px">Club Colibrí</p>
      <div class="puntos-grande">${D.puntos}</div>
      <p>Puntos Colibrí</p>
      <div class="barra-puntos" style="background:rgba(255,255,255,.18)"><span style="width:${Math.min(100, D.puntos)}%"></span></div>
      <p>1 punto por cada $1.000 · 100 puntos = 1 tinto</p>
    </div>
    <button class="btn ancho oro" id="canjear" ${D.puntos >= 100 ? "" : "disabled"}>${D.puntos >= 100 ? "Canjear un tinto gratis" : `Te faltan ${100 - D.puntos} puntos para un tinto`}</button>
    ${D.canjes.length ? `<h2>Tus canjes</h2>${D.canjes.slice(-3).reverse().map((c) => `<div class="tarjeta fila entre"><span>☕ Tinto gratis</span><b style="color:var(--magenta)">${c.codigo}${c.usado ? " · usado" : ""}</b></div>`).join("")}` : ""}
    <div class="tarjeta" style="margin-top:12px"><h3>🎂 Tu cumpleaños</h3><p>${D.perfil?.cumpleDia ? `Lo tenemos el ${D.perfil.cumpleDia} de ${MESES[D.perfil.cumpleMes - 1]}. ` : ""}Ese día, si es hábil (lunes a sábado, no festivo), te felicitamos aquí y con tu compra la galleta del colibrí va por nuestra cuenta.</p></div>
    <div class="tarjeta"><h3>♻️ Suma con tu vaso</h3><p>Si traes tu propio vaso, pagas ${fmt(DESCUENTO_TERMO)} menos y una de cada diez veces te ganas un tinto. <button class="enlace" data-ir="vaso">Ver cómo</button></p></div>
    <h2>Tu historial</h2>
    <div class="tarjeta historial">${D.historial.slice(-8).reverse().map(([n, p]) => `<div class="linea"><span>${esc(n)}</span><b style="color:${p < 0 ? "var(--magenta)" : "var(--navy)"}">${p > 0 ? "+" : ""}${p}</b></div>`).join("")}</div>
    ${lema}`,

  vaso: () => {
    const ej = ["tinto", "capu", "latte", "milo", "chai", "panela"].map(porId).filter(Boolean);
    return `
      <h1>Trae tu propio vaso</h1>
      <p class="sub">Tu vaso o tu termo, del tamaño que quieras. Pagas por onzas y siempre ${fmt(DESCUENTO_TERMO)} menos. Menos vasos desechables, más plata en tu bolsillo.</p>
      <div class="tarjeta">
        ${ej.map((p) => `<div class="linea" style="border-bottom:1px dashed var(--linea);align-items:center"><span><b>${esc(nombreCorto(p))}</b></span><span style="text-align:right;font-size:.8rem">${(tamanosDe(p) || []).map((s) => `${s.oz} oz <s style="color:#9aa">${fmt(s.precio)}</s> <b style="color:var(--magenta)">${fmt(s.precio - DESCUENTO_TERMO)}</b>`).join("<br>")}</span></div>`).join("")}
      </div>
      <div class="tarjeta"><h3>🍀 1 de cada 10</h3><p>Cada vez que traes tu vaso participas: una de cada diez veces, el tinto va por nuestra cuenta.</p></div>
      <h2>¿No tienes vaso?</h2>
      <div class="tarjeta">${VASOS.map((v) => { const [et, cl] = etiquetaStock("vaso"); return `<div class="linea" style="align-items:center"><span>Vaso Café Poli · ${v.oz} oz</span><span class="fila"><b>${fmt(v.precio)}</b><button class="tam" data-add="vaso" data-oz="${v.oz}" ${cl === "no" ? "disabled" : ""}><b>+</b></button></span></div>`; }).join("")}
        <p style="margin-top:6px">Con ${fmt(DESCUENTO_TERMO)} menos en cada bebida, el vaso se paga solo antes de que termine el semestre.</p></div>
      ${lema}`;
  },

  bolsa: () => {
    const t = ahora();
    const b = bolsaHoy(t);
    const mias = D.bolsas.filter((x) => x.fecha === t.fecha);
    let cuerpo;
    if (!t.dia.habil) cuerpo = `<div class="tarjeta"><h3>Hoy no hay bolsa</h3><p>Hoy es ${t.dia.motivo} y Café Poli no abre.</p></div>`;
    else if (t.min < BOLSA_DESDE) cuerpo = `<div class="tarjeta"><h3>Sale a las 8:30 p. m.</h3><p>A esa hora la caja ya sabe qué quedó del día. Si hay, te avisamos aquí. ${D.demo ? "" : "En el modo demo (Perfil) puedes adelantar la hora."}</p></div>`;
    else if (t.min >= BOLSA_HASTA) cuerpo = `<div class="tarjeta"><h3>La bolsa de hoy ya cerró</h3><p>Se recoge hasta las 9:30 p. m. Lo que nadie reservó se donó esta noche.</p></div>`;
    else if (b.quedan <= 0) cuerpo = `<div class="tarjeta"><h3>¡Se acabaron!</h3><p>Hoy se vendió casi todo. Lo poco que queda se dona esta noche.</p></div>`;
    else cuerpo = `
      <div class="tarjeta" style="border-left:6px solid var(--oro)">
        <h3>🛍️ 2 productos del día · ${fmt(3000)}</h3>
        <p>Hoy quedó, por ejemplo: <b>${b.ejemplo.map(esc).join("</b> y <b>")}</b>. En la carta valen más de ${fmt(b.valor)}.</p>
        <p style="margin-top:8px;font-weight:800;color:var(--navy)">Quedan ${b.quedan} bolsas</p>
      </div>
      <button class="btn ancho" id="bolsa-reservar">Reservar y pagar ${fmt(3000)}</button>`;
    return `
      <h1>Bolsa del final del día</h1>
      <p class="sub">Lo que no se vendió, recién horneado en la mañana, a ${fmt(3000)} por dos productos. Menos comida a la basura.</p>
      ${cuerpo}
      ${mias.map((x) => `<div class="tarjeta"><h3>Tu bolsa</h3><p>Recógela en la barra antes de las 9:30 p. m. con este código:</p><div class="codigo-grande">${x.codigo}</div><p>Trae: ${x.items.map(esc).join(" y ")}.</p></div>`).join("")}
      <div class="tarjeta"><h3>¿Cómo funciona?</h3><p>1. A las 8:30 p. m. la caja revisa el inventario y la app avisa al Club Colibrí.<br>2. La reservas y la pagas aquí.<br>3. La recoges con tu código antes de las 9:30 p. m.<br>4. Lo que nadie reserva se dona esa misma noche.</p></div>
      ${lema}`;
  },

  perfil: () => `
    <h1>Mi perfil</h1>
    ${formPerfil(false)}
    <div class="tarjeta"><h3>Mis datos</h3><p>En este prototipo todo se guarda solo en este celular. <button class="enlace" id="borrar">Borrar mis datos</button></p></div>
    <p style="text-align:center"><button class="enlace" id="ver-demo" style="color:var(--suave)">${D.demo ? "Modo demo (activo)" : "Modo demo"}</button></p>
    <div id="panel-demo" class="${D.demo || estadoCarta.demoAbierto ? "" : "oculto"}">${panelDemo()}</div>
    ${lema}`,
};

// ------------------------------------------------------------------ piezas de las vistas
function formPerfil(nuevo) {
  const p = D.perfil || { nombre: "", correo: "", cumpleDia: "", cumpleMes: "", permisoTV: false };
  return `
    <div class="tarjeta">
      <label class="campo"><span>Nombre</span><input id="pf-nombre" value="${esc(p.nombre)}" autocomplete="name" maxlength="40"></label>
      <label class="campo"><span>Correo del Poli</span><input id="pf-correo" type="email" value="${esc(p.correo)}" placeholder="tu.nombre@poligran.edu.co" autocomplete="email"><small id="pf-err" class="error"></small></label>
      <div class="campo"><span>Tu cumpleaños</span><div class="fila">
        <select id="pf-dia" aria-label="Día">${["", ...Array.from({ length: 31 }, (_, i) => i + 1)].map((d) => `<option value="${d}" ${String(d) === String(p.cumpleDia) ? "selected" : ""}>${d || "Día"}</option>`).join("")}</select>
        <select id="pf-mes" aria-label="Mes">${["", ...MESES].map((m, i) => `<option value="${i || ""}" ${String(i) === String(p.cumpleMes) ? "selected" : ""}>${m || "Mes"}</option>`).join("")}</select>
      </div><small>Te felicitamos ese día si es hábil (lunes a sábado, no festivo).</small></div>
      <label class="interruptor" style="box-shadow:none;padding:4px 0"><span>Quiero salir en Poli TV el día de mi cumpleaños</span><input type="checkbox" id="pf-tv" ${p.permisoTV ? "checked" : ""}></label>
      <button class="btn ancho" id="pf-guardar">${nuevo ? "Entrar a Café Poli" : "Guardar"}</button>
    </div>`;
}
function panelDemo() {
  const t = ahora();
  const cumple = esCumple(t);
  return `
    <div class="tarjeta demo">
      <h3>🧪 Modo demo</h3>
      <p>Cambia la fecha y la hora de la app para probar el cumpleaños, los festivos, los horarios y la bolsa del final del día.</p>
      <div class="fila" style="margin-top:8px"><label class="campo" style="flex:1;margin:0"><span>Fecha</span><input type="date" id="dm-fecha" value="${t.fecha}"></label>
      <label class="campo" style="flex:1;margin:0"><span>Hora</span><input type="time" id="dm-hora" value="${String(Math.floor(t.min / 60)).padStart(2, "0")}:${String(t.min % 60).padStart(2, "0")}"></label></div>
      <button class="btn navy ancho" id="dm-aplicar" style="margin-top:8px">Usar esta fecha y hora</button>
      <div class="botones">
        <button data-dm="cumple-habil">🎂 Mi cumpleaños en día hábil</button>
        <button data-dm="cumple-domingo">🎂 Mi cumpleaños en domingo</button>
        <button data-dm="cumple-festivo">🎂 Mi cumpleaños el 8 de diciembre (festivo)</button>
        <button data-dm="bolsa">🛍️ 8:35 p. m. (bolsa del día)</button>
        <button data-dm="pico">⏱️ 6:30 p. m. (antes del pico)</button>
        <button data-dm="cerrado">🌙 10:00 p. m. (cerrado)</button>
      </div>
      <div class="estado-dia">${fechaLarga(t)} · ${hhmm(t.min)}: ${t.dia.motivo}${cumple ? ` · es tu cumpleaños → ${t.dia.habil ? "se te felicita" : "no se felicita porque es " + t.dia.motivo}` : ""}</div>
      <button class="btn sec ancho" id="dm-real" style="margin-top:8px">Volver a la fecha y hora reales</button>
      <button class="btn sec ancho" id="dm-reiniciar" style="margin-top:8px">Reiniciar la demo (pedidos, inventario y puntos)</button>
    </div>`;
}
const estadoCarta = { mundo: "Todo", q: "", demoAbierto: false };
const normal = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function listaCarta() {
  const q = normal(estadoCarta.q.trim());
  const html = [];
  for (const c of CARTA) {
    if (!q && estadoCarta.mundo !== "Todo" && estadoCarta.mundo !== c.cat) continue; // al buscar, se busca en toda la carta
    const items = c.items.filter((p) => !q || normal(p.nombre + " " + c.cat + " " + (p.grupo || "")).includes(q));
    if (!items.length) continue;
    let grupo = null;
    const filas = items.map((p) => {
      const g = p.grupo && p.grupo !== grupo ? `<div class="grupo">${esc(p.grupo)}</div>` : "";
      grupo = p.grupo || grupo;
      return g + filaProducto(p);
    }).join("");
    html.push(`<section class="mundo" style="--cat:${c.color}"><div class="mundo-cab"><div><h2>${esc(c.cat)}</h2><p>${esc(c.lema || "")}</p></div></div>${filas}${c.nota ? `<p class="prod-nota" style="margin:4px 6px">${esc(c.nota)}</p>` : ""}</section>`);
  }
  return html.join("") || `<div class="vacio"><div class="grande">🔎</div><p>No encontramos «${esc(estadoCarta.q)}».</p></div>`;
}
function filaProducto(p) {
  const [et, cl] = etiquetaStock(p.id);
  const agotado = cl === "no";
  const tams = tamanosDe(p);
  const cant = (k) => (D.carrito[k] ? `<span class="cant">${D.carrito[k]}</span>` : "");
  const botones = tams
    ? tams.map((s) => `<button class="tam" data-add="${p.id}" data-oz="${s.oz}" ${agotado ? "disabled" : ""} aria-label="Agregar ${esc(nombreCorto(p))} de ${s.oz} onzas">${s.oz} oz<b>${fmt(s.precio)}</b>${cant(`${p.id}@${s.oz}`)}</button>`).join("")
    : `<button class="tam" data-add="${p.id}" ${agotado ? "disabled" : ""} aria-label="Agregar ${esc(nombreCorto(p))}">Agregar<b>${fmt(p.precio)}</b>${cant(p.id)}</button>`;
  return `
    <article class="prod ${agotado ? "agotado" : ""}">
      <div class="prod-cab"><div><div class="prod-nombre">${esc(p.nombre)}</div>${p.nota ? `<div class="prod-nota">${esc(p.nota)}</div>` : ""}</div><span class="disp ${cl}">${et}</span></div>
      <div class="tams">${botones}</div>
      ${p.termo ? `<div class="vaso-nota">♻️ Con tu propio vaso: −${fmt(DESCUENTO_TERMO)}</div>` : ""}
    </article>`;
}
function agregar(id, oz) {
  const k = oz ? `${id}@${oz}` : id;
  const s = stock(id);
  const ya = Object.entries(D.carrito).filter(([kk]) => (COMBO[kk.split("@")[0]] || kk.split("@")[0]) === (COMBO[id] || id)).reduce((a, [, n]) => a + n, 0);
  if (s !== Infinity && ya >= s) { aviso(s <= 0 ? "Se agotó por hoy 😕" : `Solo quedan ${s}`); return; }
  D.carrito[k] = (D.carrito[k] || 0) + 1;
  guardar();
  aviso(`Agregado: ${conOz(id, oz)}`);
  pintarCabecera();
  const b = $("#badge-carrito"); b.classList.remove("salta"); void b.offsetWidth; b.classList.add("salta");
}
function resumenCarrito() {
  let total = 0, bebidas = 0, problema = "";
  const t = ahora();
  const usados = {};
  for (const [k, n] of Object.entries(D.carrito)) {
    const [id, oz] = k.split("@");
    total += precio(id, oz) * n;
    if (porId(id).termo) bebidas += n;
    const real = COMBO[id] || id;
    usados[real] = (usados[real] || 0) + n;
  }
  for (const [id, n] of Object.entries(usados)) { const s = stock(id, t); if (s !== Infinity && n > s) problema = `${nombreCorto(porId(id))}: solo quedan ${s}. Ajusta tu pedido.`; }
  const desc = D.conVaso && bebidas ? DESCUENTO_TERMO : 0;
  return { total: total - desc, desc, bebidas, problema };
}
function horasRecogida(t) {
  const desde = abierto(t) ? Math.ceil((t.min + 15) / 15) * 15 : ABRE + 30;
  const r = [];
  for (let h = Math.max(ABRE + 15, desde); h <= CIERRA - 15; h += 15) r.push(h);
  return r.length ? r : [ABRE + 30];
}
function tarjetaPedido(p, corto) {
  const e = estadoPedido(p);
  const pasos = [["recibido", "Recibido", `Pagado con ${p.pago}`], ["preparando", "En preparación", "La barra lo está haciendo"], ["listo", "¡Listo, pasa por él!", "Te lo entregamos por tu nombre"]];
  const orden = { programado: 0, recibido: 0, preparando: 1, listo: 2, entregado: 3 };
  const i = orden[e];
  return `
    <div class="tarjeta pedido-activo">
      <div class="fila entre"><h3>Pedido ${p.codigo}</h3><b style="color:var(--magenta)">${e === "entregado" ? "Entregado" : e === "programado" ? "Programado" : ""}</b></div>
      <p>${p.lineas.map(esc).join(" · ")} · <b>${fmt(p.total)}</b></p>
      <p>Recoge: ${esc(p.recogidaTxt)}</p>
      ${corto && e !== "entregado" ? `<button class="enlace" data-ir="pedido" data-p="${p.codigo}">Ver estado</button>` : ""}
      ${!corto ? `
        <ol class="linea-tiempo">${pasos.map(([k, n, s], j) => `<li class="${j < i || e === "entregado" ? "hecho" : j === i ? "actual" : ""}">${n}<small>${s}</small></li>`).join("")}</ol>
        ${e === "programado" ? `<p>Lo empezamos 10 minutos antes de tu hora. <button class="enlace" id="pd-adelantar">Simular que ya es la hora</button></p>` : ""}
        ${e === "listo" ? `<div class="listo-grande"><div class="ico">🙋</div><h3>¡${esc(D.perfil.nombre.split(" ")[0])}, tu pedido está listo!</h3><p>Pasa por la barra de recogida y muestra el código.</p><div class="codigo-grande">${p.codigo}</div><button class="btn ancho" id="pd-recogido">Ya lo recogí</button></div>` : ""}
        <p class="nota-sim">Tiempos acelerados para la demostración.</p>` : ""}
    </div>`;
}
const REGALABLES = ["latte", "capu", "tinto", "milo", "chai", "matcha", "choco", "pausa", "desayuno", "postre2", "cheesecake", "brownie"];
function borrador() {
  if (!D.borrador) {
    const t = porId("latte");
    D.borrador = { para: "Alguien especial", producto: "latte", oz: t?.tamanos?.[0]?.oz || "", nombre: "", mensaje: "", firma: D.perfil?.nombre?.split(" ")[0] || "", tarjeta: true };
  }
  return D.borrador;
}
function bolsaHoy(t = ahora()) {
  const activa = t.dia.habil && t.min >= BOLSA_DESDE && t.min < BOLSA_HASTA;
  const pan = Object.keys(STOCK).filter((id) => !TIENDA.has(id)).map((id) => ({ id, s: stock(id, t) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  const unidades = pan.reduce((a, x) => a + x.s, 0);
  const reservadas = D.bolsas.filter((x) => x.fecha === t.fecha).length;
  const quedan = Math.max(0, Math.min(12, Math.floor(unidades / 2)) - 0);
  const ejemplo = pan.slice(0, 2).map((x) => nombreCorto(porId(x.id)));
  const valor = pan.slice(0, 2).reduce((a, x) => a + porId(x.id).precio, 0);
  return { activa, quedan, ejemplo: ejemplo.length ? ejemplo : ["pan de bono", "brownie"], valor: Math.max(valor, 4000), pan, reservadas };
}

// ------------------------------------------------------------------ imagen del regalo para compartir (1080 × 1920)
const imgCache = {};
const cargarImg = (src) => imgCache[src] || (imgCache[src] = new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; }));
function envolver(g, texto, ancho) {
  const palabras = texto.split(/\s+/); const lineas = []; let l = "";
  for (const w of palabras) { const p = l ? l + " " + w : w; if (g.measureText(p).width > ancho && l) { lineas.push(l); l = w; } else l = p; }
  if (l) lineas.push(l);
  return lineas;
}
// reduce la letra hasta que el texto quepa en el ancho
function ajustar(g, texto, ancho, tam, peso, familia) { let t = tam; g.font = `${peso} ${t}px ${familia}`; while (g.measureText(texto).width > ancho && t > 18) { t -= 2; g.font = `${peso} ${t}px ${familia}`; } return t; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
async function imagenRegalo(g0) {
  const W = 1080, H = 1920;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  try { await Promise.race([Promise.all(["800 90px Sora", "700 60px Sora", "italic 600 56px 'Nunito Sans'", "800 40px 'Nunito Sans'"].map((f) => document.fonts.load(f))), espera(2500)]); } catch {}
  const [logo, iso] = await Promise.all([cargarImg("img/logo-blanco.svg"), cargarImg("img/isotipo.svg")]);
  // fondo azul Poli con halos de acento
  const fondo = g.createLinearGradient(0, 0, W, H); fondo.addColorStop(0, "#1b5a8c"); fondo.addColorStop(0.45, "#0F385A"); fondo.addColorStop(1, "#061a2c");
  g.fillStyle = fondo; g.fillRect(0, 0, W, H);
  const halo = (x, y, r, col) => { const h = g.createRadialGradient(x, y, 0, x, y, r); h.addColorStop(0, col); h.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = h; g.fillRect(0, 0, W, H); };
  halo(1000, 1700, 700, "rgba(224,0,110,.35)"); halo(80, 260, 620, "rgba(21,190,206,.28)"); halo(900, 420, 380, "rgba(251,175,23,.14)");
  if (iso) { g.save(); g.globalAlpha = 0.07; g.drawImage(iso, 430, 520, 900, 900); g.restore(); }
  if (logo) { const w = 560, h = w / 3.637; g.drawImage(logo, (W - w) / 2, 120, w, h); }
  g.textAlign = "center"; g.fillStyle = "#15BECE"; g.font = "800 40px 'Nunito Sans', sans-serif";
  g.fillText("T E   R E G A L A R O N   U N   C A F É", W / 2, 420);
  g.fillStyle = "#FFFFFF"; g.font = "800 112px Sora, sans-serif";
  const para = `Para ${g0.nombre}${g0.para === "Alguien especial" ? " ❤" : ""}`;
  let fs = 112; while (g.measureText(para).width > 960 && fs > 60) { fs -= 4; g.font = `800 ${fs}px Sora, sans-serif`; }
  g.fillText(para, W / 2, 560);
  // producto
  const prod = `${conOz(g0.producto, g0.oz)}${g0.tarjeta ? " + chocolatina" : ""}`;
  ajustar(g, prod, 860, 44, "800", "'Nunito Sans', sans-serif");
  const pw = Math.min(980, g.measureText(prod).width + 80);
  g.fillStyle = "rgba(251,175,23,.16)"; rr(g, (W - pw) / 2, 610, pw, 86, 43); g.fill();
  g.fillStyle = "#FBAF17"; g.fillText(prod, W / 2, 667);
  // mensaje
  g.fillStyle = "#FFF4E3"; g.font = "italic 600 58px 'Nunito Sans', sans-serif";
  const lineas = envolver(g, `“${g0.mensaje || "¡Disfrútalo!"}”`, 880).slice(0, 6);
  lineas.forEach((l, i) => g.fillText(l, W / 2, 820 + i * 78));
  const yFirma = 820 + lineas.length * 78 + 30;
  g.fillStyle = "#FBAF17"; g.font = "800 54px Sora, sans-serif"; g.fillText(`— ${g0.firma}`, W / 2, yFirma);
  // tarjeta del código con QR
  const y0 = Math.max(yFirma + 70, 1250);
  g.fillStyle = "#FFFFFF"; rr(g, 90, y0, 900, 470, 44); g.fill();
  g.textAlign = "left"; g.fillStyle = "#5C6B7A"; g.font = "800 34px 'Nunito Sans', sans-serif"; g.fillText("Tu código", 150, y0 + 90);
  g.fillStyle = "#0F385A"; g.font = "800 92px Sora, sans-serif"; g.fillText(g0.codigo, 150, y0 + 200);
  const corto = g0.venceClave ? (([a, m, d]) => `${+d} ${MESES[+m - 1].slice(0, 3)} ${a}`)(g0.venceClave.split("-")) : g0.vence;
  g.fillStyle = "#E0006E"; ajustar(g, `Vale hasta el ${corto}`, 400, 34, "800", "'Nunito Sans', sans-serif"); g.fillText(`Vale hasta el ${corto}`, 150, y0 + 265);
  g.fillStyle = "#1D2733"; g.font = "600 30px 'Nunito Sans', sans-serif";
  g.fillText("Muéstralo en la barra de Café Poli", 150, y0 + 330); g.fillText("City Campus, piso 2", 150, y0 + 372);
  if (typeof window.qrcode === "function") {
    const q = window.qrcode(0, "M"); q.addData(urlReclamar(g0.codigo)); q.make();
    const n = q.getModuleCount(), tam = 300, s = tam / n, qx = 990 - 60 - tam, qy = y0 + 85;
    g.fillStyle = "#0F385A";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) g.fillRect(qx + x * s, qy + y * s, Math.ceil(s), Math.ceil(s));
  }
  g.textAlign = "center"; g.fillStyle = "rgba(255,244,227,.85)"; g.font = "700 36px 'Nunito Sans', sans-serif";
  g.fillText("Escanea el QR o muestra el código en la barra", W / 2, Math.min(1850, y0 + 560));
  return new Promise((ok) => c.toBlob((b) => ok(b), "image/png"));
}
// el enlace del regalo lleva sus datos: quien lo abre en su celular ve su tarjeta aunque no tenga la app
const b64 = { a: (o) => { const b = new TextEncoder().encode(JSON.stringify(o)); let s = ""; b.forEach((x) => (s += String.fromCharCode(x))); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
  de: (t) => { try { const s = atob(t.replace(/-/g, "+").replace(/_/g, "/")); return JSON.parse(new TextDecoder().decode(Uint8Array.from(s, (c) => c.charCodeAt(0)))); } catch { return null; } } };
const datosRegalo = (g) => ({ c: g.codigo, n: g.nombre, p: g.producto, o: g.oz, m: g.mensaje, f: g.firma, v: g.vence, k: g.tarjeta ? 1 : 0, e: g.para === "Alguien especial" ? 1 : 0 });
const urlRegalo = (g) => `${location.origin}${location.pathname}#recibido=${b64.a(datosRegalo(g))}`;
const urlReclamar = (cod) => { const g = D.regalos.find((x) => x.codigo === cod); return g ? urlRegalo(g) : `${location.origin}${location.pathname}#reclamar=${encodeURIComponent(cod)}`; };
const textoRegalo = (g) => `🎁 ${g.firma} te regaló ${conOz(g.producto, g.oz)} en Café Poli (City Campus, piso 2).\n“${g.mensaje}”\nTu código: ${g.codigo} · muéstralo en la barra. Vale hasta el ${g.vence}.\n${urlRegalo(g)}`;
function fechaMas(t, dias) { const f = new Date(Date.UTC(t.a, t.m - 1, t.d + dias)); return `${f.getUTCDate()} de ${MESES[f.getUTCMonth()]} de ${f.getUTCFullYear()}`; }

// ------------------------------------------------------------------ comportamiento de cada vista
const ENLACES = {
  bienvenida: () => { enlazarPerfil(true); $("#ejemplo").addEventListener("click", () => { D.perfil = { nombre: "Andrés Gómez", correo: "andres.gomez@poligran.edu.co", cumpleDia: 17, cumpleMes: 11, permisoTV: true }; guardar(); aviso("¡Bienvenido, Andrés!"); ir("inicio"); revisarCumple(); }); },
  perfil: () => {
    enlazarPerfil(false);
    $("#borrar").addEventListener("click", () => { if (!confirm("¿Borrar tus datos de este celular?")) return; D = base(); guardar(); ir("bienvenida"); });
    $("#ver-demo").addEventListener("click", () => { estadoCarta.demoAbierto = !estadoCarta.demoAbierto; $("#panel-demo").classList.toggle("oculto"); });
    enlazarDemo();
  },
  carta: () => {
    const lista = $("#lista-carta");
    $("#buscar").addEventListener("input", (e) => { estadoCarta.q = e.target.value; $$("[data-mundo]").forEach((x) => x.classList.toggle("activo", e.target.value.trim() ? x.dataset.mundo === "Todo" : x.dataset.mundo === estadoCarta.mundo)); lista.innerHTML = listaCarta(); });
    $$("[data-mundo]").forEach((b) => b.addEventListener("click", () => { estadoCarta.mundo = b.dataset.mundo; $$("[data-mundo]").forEach((x) => x.classList.toggle("activo", x === b)); lista.innerHTML = listaCarta(); }));
    lista.addEventListener("click", (e) => { const b = e.target.closest("[data-add]"); if (!b) return; agregar(b.dataset.add, b.dataset.oz); const y = vista.scrollTop; lista.innerHTML = listaCarta(); vista.scrollTop = y; });
  },
  vaso: () => { $$("[data-add]").forEach((b) => b.addEventListener("click", () => { agregar(b.dataset.add, b.dataset.oz); })); },
  pedir: () => {
    $$("[data-mas]").forEach((b) => b.addEventListener("click", () => { const [id, oz] = b.dataset.mas.split("@"); agregar(id, oz); ir("pedir"); }));
    $$("[data-menos]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.menos; D.carrito[k]--; if (D.carrito[k] <= 0) delete D.carrito[k]; guardar(); ir("pedir"); }));
    $("#chk-vaso")?.addEventListener("change", (e) => { D.conVaso = e.target.checked; guardar(); ir("pedir"); });
    $$("[data-rec]").forEach((b) => b.addEventListener("click", () => { D.recogida.tipo = b.dataset.rec; if (b.dataset.rec === "hora" && !D.recogida.hora) D.recogida.hora = horasRecogida(ahora())[0]; guardar(); ir("pedir"); }));
    $("#hora-rec")?.addEventListener("change", (e) => { D.recogida.hora = e.target.value; guardar(); });
    $("#btn-pagar")?.addEventListener("click", async () => {
      const t = ahora();
      const r = resumenCarrito();
      if (r.problema) return;
      try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch {}
      const lineas = Object.entries(D.carrito).map(([k, n]) => { const [id, oz] = k.split("@"); return `${n} × ${conOz(id, oz)}`; });
      const ok = await pagar(r.total, `Pedido Café Poli: ${lineas.join(", ")}`);
      if (!ok) { aviso("No se cobró nada."); return; }
      const t2 = ahora();
      let recogidaTxt, programado = false, preparaEn, listoEn;
      const now = Date.now();
      if (D.recogida.tipo === "ahora" && abierto(t2)) { recogidaTxt = "lo antes posible (≈10 min)"; preparaEn = now + 6000; listoEn = now + 22000; }
      else {
        const hora = D.recogida.tipo === "descanso" ? 20 * 60 + 20 : +D.recogida.hora || horasRecogida(t2)[0];
        recogidaTxt = D.recogida.tipo === "descanso" ? "en el descanso de la noche (8:20 p. m.)" : `a las ${hhmm(hora)}`;
        const faltan = abierto(t2) && hora > t2.min ? (hora - 10 - t2.min) : 99999;
        programado = faltan > 0.2;
        preparaEn = programado ? now + 86400000 : now + 4000; listoEn = preparaEn + 16000;
      }
      for (const [k, n] of Object.entries(D.carrito)) descontar(k.split("@")[0], n, t);
      const p = { codigo: `A${String(40 + D.pedidos.length * 7 % 60)}`, lineas, total: r.total, pago: D.pago, recogidaTxt, programado, preparaEn, listoEn, creado: now };
      D.pedidos.push(p);
      const pts = sumarPuntos(r.total, lineas.map((l) => l.replace(/^\d+ × /, "")).join(", "));
      D.carrito = {}; D.conVaso = false;
      guardar();
      aviso(`¡Pagado! Sumaste ${pts} Puntos Colibrí`);
      ir("pedido", p.codigo);
    });
  },
  pedido: (cod) => {
    const p = D.pedidos.find((x) => x.codigo === cod) || D.pedidos[D.pedidos.length - 1];
    $("#pd-adelantar")?.addEventListener("click", () => { p.programado = false; p.preparaEn = Date.now() + 3000; p.listoEn = Date.now() + 16000; guardar(); ir("pedido", p.codigo); });
    $("#pd-recogido")?.addEventListener("click", () => { p.entregado = true; guardar(); aviso("¡Que lo disfrutes!"); ir("inicio"); });
  },
  regalar: () => {
    const r = borrador();
    const total = () => fmt(precio(r.producto, r.oz) + (r.tarjeta ? DETALLE_REGALO.precio : 0));
    $$("[data-para]").forEach((b) => b.addEventListener("click", () => { r.para = b.dataset.para; guardar(); ir("regalar"); }));
    $("#rg-prod").addEventListener("change", (e) => { r.producto = e.target.value; r.oz = tamanosDe(porId(r.producto))?.[0]?.oz || ""; guardar(); ir("regalar"); });
    $$("[data-oz]").forEach((b) => b.addEventListener("click", () => { r.oz = b.dataset.oz; guardar(); ir("regalar"); }));
    $("#rg-nombre").addEventListener("input", (e) => { r.nombre = e.target.value; guardar(); });
    $("#rg-firma").addEventListener("input", (e) => { r.firma = e.target.value; guardar(); });
    $("#rg-msj").addEventListener("input", (e) => { r.mensaje = e.target.value; $("#rg-cont").textContent = `${r.mensaje.length}/120`; guardar(); });
    $("#rg-tarjeta").addEventListener("change", (e) => { r.tarjeta = e.target.checked; $("#rg-total").textContent = total(); guardar(); });
    $("#rg-pagar").addEventListener("click", async () => {
      if (!r.nombre.trim()) { aviso("Escribe el nombre de quien lo recibe"); $("#rg-nombre").focus(); return; }
      if (!r.mensaje.trim()) { aviso("Escribe tu mensaje"); $("#rg-msj").focus(); return; }
      if (!r.firma.trim()) { aviso("Firma tu regalo: aquí no hay regalos anónimos"); $("#rg-firma").focus(); return; }
      const monto = precio(r.producto, r.oz) + (r.tarjeta ? DETALLE_REGALO.precio : 0);
      const ok = await pagar(monto, `Regalo para ${r.nombre}: ${conOz(r.producto, r.oz)}`);
      if (!ok) { aviso("No se cobró nada."); return; }
      const t = ahora();
      const g = { ...r, nombre: r.nombre.trim(), mensaje: r.mensaje.trim(), firma: r.firma.trim(), codigo: codigo("CP"), creado: t.fecha, vence: fechaMas(t, 30), venceClave: new Date(Date.UTC(t.a, t.m - 1, t.d + 30)).toISOString().slice(0, 10), usado: false };
      D.regalos.push(g);
      sumarPuntos(monto, `Regalo para ${g.nombre}`);
      D.borrador = null;
      guardar();
      ir("regaloListo", g.codigo);
    });
  },
  regaloListo: async (cod) => {
    const g = D.regalos.find((x) => x.codigo === cod) || D.regalos[D.regalos.length - 1];
    if (!g) return;
    $("#rg-wa").href = `https://wa.me/?text=${encodeURIComponent(textoRegalo(g))}`;
    $("#rg-copiar").addEventListener("click", async () => { try { await navigator.clipboard.writeText(textoRegalo(g)); aviso("Mensaje copiado"); } catch { aviso("No se pudo copiar"); } });
    const blob = await imagenRegalo(g);
    if (!blob || actual !== "regaloListo") return;
    const url = URL.createObjectURL(blob);
    $("#img-regalo").src = url;
    const archivo = new File([blob], `regalo-cafe-poli-${g.codigo}.png`, { type: "image/png" });
    $("#rg-bajar").addEventListener("click", () => { const a = document.createElement("a"); a.href = url; a.download = archivo.name; document.body.appendChild(a); a.click(); a.remove(); });
    $("#rg-compartir").addEventListener("click", async () => {
      try {
        if (navigator.canShare && navigator.canShare({ files: [archivo] })) { await navigator.share({ files: [archivo], title: "Un Café Poli para ti", text: textoRegalo(g) }); return; }
        if (navigator.share) { await navigator.share({ title: "Un Café Poli para ti", text: textoRegalo(g) }); return; }
      } catch (e) { if (e && e.name === "AbortError") return; }
      aviso("Tu navegador no comparte imágenes: descárgala y súbela a tus historias.", 3600);
      $("#rg-bajar").click();
    });
  },
  reclamar: (cod) => {
    const validar = () => {
      const c = $("#rc-cod").value.trim().toUpperCase().replace(/^CAFEPOLI:/, "");
      const res = $("#rc-res");
      if (!c) { res.innerHTML = ""; return; }
      const g = D.regalos.find((x) => x.codigo === c);
      const k = D.canjes.find((x) => x.codigo === c);
      const b = D.bolsas.find((x) => x.codigo === c);
      const t = ahora();
      if (g) {
        if (g.usado) res.innerHTML = `<div class="tarjeta"><h3>⚠️ Ya se reclamó</h3><p>Este regalo para ${esc(g.nombre)} se entregó el ${esc(g.usado)}.</p></div>`;
        else if (g.venceClave && t.fecha > g.venceClave) res.innerHTML = `<div class="tarjeta"><h3>⌛ Venció</h3><p>Valía hasta el ${esc(g.vence)}.</p></div>`;
        else {
          res.innerHTML = `<div class="tarjeta" style="border-left:6px solid var(--verde)"><h3>✅ Código válido</h3><p><b>${esc(conOz(g.producto, g.oz))}${g.tarjeta ? " + tarjeta impresa y chocolatina" : ""}</b> para <b>${esc(g.nombre)}</b>, de ${esc(g.firma)}.</p><p style="margin-top:6px">«${esc(g.mensaje)}»</p></div><button class="btn ancho" id="rc-entregar">Entregar por su nombre</button>`;
          $("#rc-entregar").addEventListener("click", () => { g.usado = fechaLarga(t); descontar(g.producto, 1, t); guardar(); res.innerHTML = `<div class="tarjeta listo-grande"><div class="ico">🎉</div><h3>¡${esc(g.nombre)}, esto te lo mandó ${esc(g.firma)}!</h3><p>Entregado. El inventario ya descontó el producto.</p></div>`; });
        }
      } else if (k || b) {
        const x = k || b;
        if (x.usado) res.innerHTML = `<div class="tarjeta"><h3>⚠️ Ya se usó</h3></div>`;
        else { res.innerHTML = `<div class="tarjeta" style="border-left:6px solid var(--verde)"><h3>✅ Código válido</h3><p>${k ? "Tinto gratis del Club Colibrí." : `Bolsa del final del día: ${x.items.map(esc).join(" y ")}.`}</p></div><button class="btn ancho" id="rc-entregar">Entregar</button>`; $("#rc-entregar").addEventListener("click", () => { x.usado = true; guardar(); res.innerHTML = `<div class="tarjeta listo-grande"><div class="ico">🎉</div><h3>¡Entregado!</h3></div>`; }); }
      } else res.innerHTML = `<div class="tarjeta"><h3>No encontramos ese código</h3><p>En este prototipo los códigos viven en el celular donde se crearon. En la barra real, la caja los valida en línea.</p></div>`;
    };
    $("#rc-validar").addEventListener("click", validar);
    $("#rc-cod").addEventListener("keydown", (e) => { if (e.key === "Enter") validar(); });
    if (cod) validar();
  },
  puntos: () => {
    $("#canjear")?.addEventListener("click", () => {
      if (D.puntos < 100) return;
      D.puntos -= 100; D.historial.push(["Canje: tinto gratis", -100]);
      const c = { codigo: codigo("TINTO", 3), usado: false }; D.canjes.push(c); guardar();
      abrirHoja(`<div class="listo-grande"><div class="ico">☕</div><h2>¡Tinto canjeado!</h2><p class="sub">Muestra este código en la barra:</p><div class="codigo-grande">${c.codigo}</div><button class="btn ancho" id="ok-canje">Listo</button></div>`);
      $("#ok-canje").addEventListener("click", () => { cerrarHoja(); ir("puntos"); });
      confeti();
    });
  },
  bolsa: () => {
    $("#bolsa-reservar")?.addEventListener("click", async () => {
      const t = ahora();
      const b = bolsaHoy(t);
      if (b.quedan <= 0) return;
      const ok = await pagar(3000, "Bolsa del final del día (2 productos)");
      if (!ok) { aviso("No se cobró nada."); return; }
      const items = b.pan.slice(0, 2).map((x) => { descontar(x.id, 1, t); return nombreCorto(porId(x.id)); });
      D.bolsas.push({ fecha: t.fecha, codigo: codigo("BF", 3), items, usado: false });
      sumarPuntos(3000, "Bolsa del final del día");
      guardar();
      aviso("¡Bolsa reservada! Recógela antes de las 9:30 p. m.");
      ir("bolsa");
    });
  },
};
function enlazarPerfil(nuevo) {
  $("#pf-guardar").addEventListener("click", () => {
    const nombre = $("#pf-nombre").value.trim(), correo = $("#pf-correo").value.trim().toLowerCase();
    const dia = $("#pf-dia").value, mes = $("#pf-mes").value;
    const err = $("#pf-err");
    if (!nombre) { err.textContent = "Escribe tu nombre."; $("#pf-nombre").focus(); return; }
    if (!/^[a-z0-9._%+-]+@poligran\.edu\.co$/.test(correo)) { err.textContent = "Usa tu correo del Poli: termina en @poligran.edu.co"; $("#pf-correo").focus(); return; }
    if (!dia || !mes) { err.textContent = "Elige el día y el mes de tu cumpleaños."; return; }
    if (+dia > [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1]) { err.textContent = "Ese día no existe en ese mes."; return; }
    err.textContent = "";
    const cambioCumple = !D.perfil || +D.perfil.cumpleDia !== +dia || +D.perfil.cumpleMes !== +mes;
    D.perfil = { nombre, correo, cumpleDia: +dia, cumpleMes: +mes, permisoTV: $("#pf-tv").checked };
    if (cambioCumple) D.saludo = null;
    guardar();
    aviso(nuevo ? `¡Bienvenido, ${nombre.split(" ")[0]}!` : "Guardado");
    ir(nuevo ? "inicio" : "perfil");
    revisarCumple();
  });
}
function enlazarDemo() {
  const aplicar = (fecha, hora, cumple = false) => {
    D.demo = { fecha, hora, desde: Date.now() };
    if (cumple) { const [, m, d] = fecha.split("-").map(Number); D.perfil.cumpleDia = d; D.perfil.cumpleMes = m; }
    D.saludo = null; guardar(); estadoCarta.demoAbierto = true;
    ir("perfil"); revisarCumple();
  };
  $("#dm-aplicar")?.addEventListener("click", () => aplicar($("#dm-fecha").value, $("#dm-hora").value || "12:00"));
  $("#dm-real")?.addEventListener("click", () => { D.demo = null; guardar(); ir("perfil"); revisarCumple(); });
  $("#dm-reiniciar")?.addEventListener("click", () => { const p = D.perfil, dm = D.demo; D = base(); D.perfil = p; D.demo = dm; guardar(); aviso("Demo reiniciada"); ir("perfil"); });
  // fechas de prueba: un martes hábil, un domingo y el festivo del 8 de diciembre (cambia tu cumpleaños de prueba)
  const P = { "cumple-habil": ["2026-11-17", "09:30", true], "cumple-domingo": ["2026-11-22", "09:30", true], "cumple-festivo": ["2026-12-08", "09:30", true] };
  $$("[data-dm]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.dm, t = ahora();
    const habil = t.dia.habil ? t.fecha : "2026-11-17";
    if (P[k]) aplicar(...P[k]);
    else if (k === "bolsa") aplicar(habil, "20:35");
    else if (k === "pico") aplicar(habil, "18:30");
    else if (k === "cerrado") aplicar(habil, "22:00");
  }));
}

// ------------------------------------------------------------------ arranque
function rutaInicial() {
  const h = decodeURIComponent(location.hash.slice(1));
  const [n, p] = h.split("=");
  return { n: n || "inicio", p: p || null };
}
addEventListener("hashchange", () => { const r = rutaInicial(); if (r.n !== actual || r.p !== param) ir(r.n, r.p, { historia: false }); });
const r0 = rutaInicial();
ir(r0.n, r0.p);
if (D.perfil) setTimeout(revisarCumple, 600);
