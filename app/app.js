// Café Poli · app (prototipo funcional). Todo corre en el celular: la carta sale de ../js/datos.js (la misma del
// recorrido y del Excel), el inventario se simula por día y hora, los pagos son simulaciones y nada sale del aparato.
import { CARTA, DESCUENTO_TERMO, DETALLE_REGALO, VASOS, fmt } from "../js/datos.js";
import { tipoDeDia } from "./festivos.js";
import { ico, ICONO_MUNDO } from "./iconos.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ datos guardados (solo en este celular)
const CLAVE = "cafepoli.app.v2";
const base = () => ({
  perfil: null, puntos: 500, historial: [["Bienvenida al Club Colibrí", 500]], carrito: {}, conVaso: false, usarPuntos: false, recogida: { tipo: "ahora", hora: "" },
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
    min = Math.min(1439, hh * 60 + mm + Math.floor((Date.now() - D.demo.desde) / 60000));
  } else {
    const p = Object.fromEntries(fmtBogota.formatToParts(new Date()).map((x) => [x.type, x.value]));
    a = +p.year; m = +p.month; d = +p.day; min = (+p.hour % 24) * 60 + +p.minute;
  }
  const fecha = `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { a, m, d, min, fecha, dia: tipoDeDia(a, m, d), ds: new Date(Date.UTC(a, m - 1, d)).getUTCDay() };
}
const hhmm = (min) => { const h = Math.floor(min / 60) % 24, mm = min % 60, h12 = ((h + 11) % 12) + 1; return `${h12}:${String(mm).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`; };
const fechaLarga = (t) => `${DIAS[t.ds]} ${t.d} de ${MESES[t.m - 1]} de ${t.a}`;
const ABRE = 6 * 60, CIERRA = 21 * 60 + 45, BOLSA_DESDE = 20 * 60 + 30, BOLSA_HASTA = 21 * 60 + 30;
function abierto(t = ahora()) { return t.dia.habil && t.min >= ABRE && t.min < CIERRA; }

// ------------------------------------------------------------------ carta, descripciones e inventario simulado
const PRODUCTOS = CARTA.flatMap((c, i) => c.items.map((p) => ({ ...p, mundo: c.cat, mundoI: i, color: c.color, icono: ICONO_MUNDO[c.icono] || "pocillo" })));
const porId = (id) => PRODUCTOS.find((p) => p.id === id) || { id, nombre: id, precio: 0, icono: "pocillo", color: "#0F385A" };
const tamanosDe = (p) => (p.id === "vaso" ? VASOS : p.tamanos || null);
const precio = (id, oz) => { const p = porId(id); const t = tamanosDe(p); if (t && oz) { const s = t.find((x) => String(x.oz) === String(oz)); if (s) return s.precio; } return t ? t[0].precio : p.precio; };
const nombreCorto = (p) => p.nombre.split(":")[0].replace(/ \(.*\)/, "");
const conOz = (id, oz) => `${nombreCorto(porId(id))}${oz ? ` · ${oz} oz` : ""}`;
const CORTO = { "Cafés de origen": "Cafés", "Energía para el parcial": "Energía", "Ritual del té": "Té", "Bebidas de la casa": "De la casa", "Bebidas frías para llevar": "Frías", "Snacks de paquete": "Snacks", "Antojos colombianos": "Antojos", "Postres para compartir": "Postres", Combos: "Combos", "Tienda Café Poli": "Tienda" };
// una línea por producto, para saber qué es sin leer de más
const DESC = {
  tinto: "Café de origen en greca, como en la casa.", campesino: "Tinto endulzado con panela, receta de finca.", leche: "Café de origen con leche espumada.", capu: "Espresso doble con espuma cremosa.", latte: "Espresso con leche y arequipe o vainilla.", frio: "Café de origen frío, con panela y hielo.",
  parcial: "Doble espresso, panela y canela. Uno por persona.", espresso: "Dos cargas de café de origen.", cparcial: "Café Parcial con brownie, para la semana de parciales.",
  teNegro: "Té negro clásico, con o sin leche.", earlgrey: "Té negro con aroma de bergamota.", teVerde: "Té verde suave, en hoja.", jazmin: "Té verde perfumado con flores de jazmín.", blanco: "Té blanco delicado con pétalos.", rooibos: "Sin cafeína, con notas de vainilla.", frutos: "Infusión frutal, sin cafeína.", maracuya: "Frutal tropical, sin cafeína.", manzanilla: "Calma la tarde; con miel.", jengibre: "Para los días fríos de Bogotá.", jamaica: "Ácida y refrescante, con canela.", chai: "Té con especias y leche espumada.", matcha: "Té verde japonés con leche.", teHelado: "Té negro frío con durazno.", teMaracuya: "Té verde frío con maracuyá.", cata: "Tres tazas pequeñas para probar y conversar.",
  aroma: "Hierbabuena o limoncillo, la de siempre.", panela: "Caliente o fría, con limón.", choco: "Con queso para derretir adentro.", milo: "Caliente y espumoso, como en las onces.", miloFrio: "Frío y batido, el clásico del colegio.", avena: "Avena fría con canela.", jugo: "Fruta del día, en agua.",
  agua: "Botella sellada, fría.", aguaGas: "Burbujas, sin azúcar.", gaseosa: "Lata o botella fría.", gaseosaZero: "Sin azúcar, fría.", malta: "Malta fría, la de toda la vida.", jugoCaja: "Jugo de fruta en caja.", teBotella: "Té frío listo para llevar.", hidratante: "Para después del partido.",
  papas: "Papas fritas de paquete.", platanitos: "Plátano verde frito y crocante.", inflados: "Inflados con sabor a queso.", galletasPaq: "Galletas de paquete para la maleta.", mani: "Maní salado, energía rápida.", chocolatina: "Chocolatina para el antojo.", barraCereal: "Avena y miel, para la clase.", gomitas: "Gomitas de fruta.",
  pan: "Recién horneado en la mañana.", panyuca: "Crujiente por fuera, suave por dentro.", bunuelo: "Redondo y dorado, de queso.", almojabana: "Esponjosa, de cuajada.", arepa: "Asada con queso derretido.", boyacense: "Dulce, rellena de cuajada.", arepahuevo: "Frita, con huevo adentro.", empanada: "De carne o pollo, con ají.", sandwich: "Pan, jamón y queso calientes.",
  tortica: "La torta que horneamos hoy.", zanahoria: "Con nueces y cubierta de queso crema.", cheesecake: "Cremoso, con salsa de frutos rojos.", brownie: "De chocolate, denso y húmedo.", galletas: "Horneadas en casa.", postre2: "Dos porciones y dos tenedores.", fruta: "Fruta fresca picada.",
  pausa: "Tinto con pan de bono: la pausa perfecta.", desayuno: "Café con leche y arepa con huevo.", tardecata: "Cata de tres tés y postre para dos.", duo: "Para dos: 2 cafés con leche y 2 pan de bono, más barato que por separado.", noche: "Para el descanso de las 8:20 p. m.: chocolate caliente con queso y una empanada.", bandeja: "Para el grupo: 6 antojos por el precio de 5.",
  vaso: "Reutilizable: 8, 12 o 16 oz.", termo: "Acero; mantiene el tinto caliente por horas.", pocillo: "Porcelana con el logo de Café Poli.",
};
// unidades del día (lo horneado, lo empacado y la tienda); las bebidas preparadas se hacen al momento
const STOCK = { pan: 60, panyuca: 45, bunuelo: 50, almojabana: 40, arepa: 35, boyacense: 18, arepahuevo: 24, empanada: 40, sandwich: 16,
  tortica: 16, zanahoria: 14, cheesecake: 12, brownie: 26, galletas: 40, postre2: 8, fruta: 14,
  agua: 48, aguaGas: 24, gaseosa: 48, gaseosaZero: 30, malta: 24, jugoCaja: 36, teBotella: 20, hidratante: 20,
  papas: 30, platanitos: 24, inflados: 24, galletasPaq: 30, mani: 20, chocolatina: 40, barraCereal: 24, gomitas: 20,
  vaso: 20, termo: 9, pocillo: 12 };
const COMBO = { pausa: "pan", desayuno: "arepahuevo", cparcial: "brownie", tardecata: "postre2", duo: "pan", noche: "empanada", bandeja: "almojabana" };
const TIENDA = new Set(["vaso", "termo", "pocillo"]);
const EMPACADO = new Set(["agua", "aguaGas", "gaseosa", "gaseosaZero", "malta", "jugoCaja", "teBotella", "hidratante", "papas", "platanitos", "inflados", "galletasPaq", "mani", "chocolatina", "barraCereal", "gomitas"]);
const DEL_DIA = Object.keys(STOCK).filter((id) => !TIENDA.has(id) && !EMPACADO.has(id)); // solo esto va en la bolsa del final del día
// parte de lo del día que ya se vendió a cada hora (picos entre clases y antes de las 6:40 p. m.)
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
  if (TIENDA.has(id) || !t.dia.habil) return Math.max(0, STOCK[id] - compradas); // día no hábil: se prepara para el próximo día hábil
  const ritmo = EMPACADO.has(id) ? 0.55 : 1; // lo empacado se vende más despacio y no se daña
  const factor = (0.9 + azar(id + t.fecha) * 0.2) * ritmo;
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
  if (s === Infinity) return abierto(t) ? ["Al momento", ""] : ["Al abrir", "pocos"];
  if (!t.dia.habil && !TIENDA.has(COMBO[id] || id)) return ["Próximo día hábil", "pocos"];
  if (s <= 0) return ["Agotado", "no"];
  return [`Quedan ${s}`, s <= 8 ? "pocos" : ""];
}
// color de texto sobre el color de cada mundo: azul Poli sobre los claros (té, de la casa, postres), blanco sobre los oscuros
const claro = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150; };
const estiloCat = (hex) => `--cat:${hex};--tx:${claro(hex) ? "#0F385A" : "#fff"}`;
const foto = (p, clase = "", extra = "") => `<div class="foto ${clase}" style="${estiloCat(p.color)}">${ico(p.icono)}<img src="img/carta/${p.id}.jpg" alt="" loading="lazy" decoding="async" onerror="this.remove()">${extra}</div>`;

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
// 1 punto = $1. Por cada $1.000 pagados se suman 20 puntos (el 2 %).
const PUNTOS_POR_MIL = 20;
function sumarPuntos(total, concepto) { const p = Math.floor(total / 1000) * PUNTOS_POR_MIL; if (p > 0) { D.puntos += p; D.historial.push([concepto, p]); } return p; }
function qrSVG(texto, tam = 170) {
  if (typeof window.qrcode !== "function") return `<svg viewBox="0 0 10 10" width="${tam}" height="${tam}"><rect width="10" height="10" fill="#fff"/><text x="5" y="5.6" font-size="1.2" text-anchor="middle" fill="#0F385A">QR</text></svg>`;
  const q = window.qrcode(0, "M"); q.addData(texto); q.make();
  const n = q.getModuleCount();
  let r = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) r += `M${x},${y}h1v1h-1z`;
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" width="${tam}" height="${tam}" shape-rendering="crispEdges" role="img" aria-label="Código QR"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${r}" fill="#0F385A"/></svg>`;
}
const fichaIco = (nombre, tono = "navy") => `<span class="ficha-ico ${tono}">${ico(nombre)}</span>`;

// ------------------------------------------------------------------ pagos simulados (nunca se piden datos reales)
const METODOS = {
  Nequi: { color: "#5A2D82", icono: "celular", tipo: "app", txt: "Nequi" },
  Daviplata: { color: "#C8102E", icono: "celular", tipo: "app", txt: "Daviplata" },
  "Bre-B": { color: "#0F385A", icono: "transferencia", tipo: "llave", txt: "Bre-B" },
  Tarjeta: { color: "#174B76", icono: "tarjeta", tipo: "tarjeta", txt: "Tarjeta crédito o débito" },
};
const logoPago = (m) => `<span class="logo-pago" style="background:${METODOS[m].color}">${ico(METODOS[m].icono)}</span>`;
function pagar(monto, concepto) {
  return new Promise((resolver) => {
    let fin = false, reloj = 0;
    const terminar = (ok) => { if (fin) return; fin = true; clearInterval(reloj); cerrarHoja(); resolver(ok); };
    const elegir = () => {
      abrirHoja(`
        <span class="sello-sim">Simulación: no se cobra nada</span>
        <h2 style="margin-top:4px">¿Cómo pagas ${fmt(monto)}?</h2>
        <p class="sub">${esc(concepto)}</p>
        <div class="metodos">${Object.keys(METODOS).map((m) => `<button class="metodo ${m === D.pago ? "activa" : ""}" data-m="${m}">${logoPago(m)}<span>${METODOS[m].txt}</span></button>`).join("")}</div>
        <button class="btn ancho" id="pg-seguir">Continuar ${ico("flecha")}</button>
        <button class="btn sec ancho" id="pg-cancelar" style="margin-top:8px">Cancelar</button>`, { alCerrar: (v) => { if (v === null) terminar(false); } });
      $$(".metodo", hojaCaja).forEach((b) => b.addEventListener("click", () => { D.pago = b.dataset.m; guardar(); $$(".metodo", hojaCaja).forEach((x) => x.classList.toggle("activa", x === b)); }));
      $("#pg-seguir").addEventListener("click", () => flujo(D.pago));
      $("#pg-cancelar").addEventListener("click", () => terminar(false));
    };
    const aprobado = async (txt = "¡Pago aprobado!") => {
      clearInterval(reloj);
      hojaCaja.innerHTML = `<div class="pago-app listo-grande"><span class="grande-ico ok">${ico("checkCirculo")}</span><h2>${txt}</h2><p class="sub">${fmt(monto)} · ${esc(concepto)}</p><span class="sello-sim">Simulación: no se cobró nada</span></div>`;
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
            <span class="logo-pago grande" style="background:${M.color}">${ico(M.icono)}</span>
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
        $("#pg-tarjeta").addEventListener("click", async (e) => { e.currentTarget.disabled = true; e.currentTarget.innerHTML = `<span class="cargando"></span> Procesando…`; await espera(1600); if (!fin) aprobado("¡Tarjeta aprobada!"); });
      }
    };
    elegir();
  });
}

// ------------------------------------------------------------------ navegación
const vista = $("#vista");
let actual = "inicio", param = null;
$(".tabs").innerHTML = [["inicio", "casa", "Inicio"], ["carta", "pocillo", "Carta"], ["pedir", "bolsa", "Pedir"], ["regalar", "regalo", "Regalar"], ["puntos", "colibri", "Puntos"]]
  .map(([v, i, t]) => `<button data-ir="${v}" class="tab"><span class="ti">${ico(i)}${v === "pedir" ? '<b id="badge-carrito" class="badge oculto">0</b>' : ""}</span>${t}</button>`).join("");
$("#btn-perfil").innerHTML = ico("perfil");
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
      ${D.perfil.permisoTV ? `<p class="sub">Y como nos diste permiso, hoy sales en Poli TV.</p>` : ""}
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
    aviso("¡Ya está la bolsa del final del día! 2 productos por $3.000", 4200);
    try { if ("Notification" in window && Notification.permission === "granted") new Notification("Café Poli", { body: "Ya está la bolsa del final del día: 2 productos del día por $3.000. ¡Resérvala!", icon: "img/icono-192.png" }); } catch {}
  }
  const firma = `${t.fecha}|${t.min}|${b.activa}|${b.quedan}|${D.pedidos.map(estadoPedido).join(",")}`;
  if (firma !== firmaPrevia && firmaPrevia && (actual === "pedido" || actual === "inicio" || actual === "bolsa")) { const y = vista.scrollTop; ir(actual, param, { historia: false }); vista.scrollTop = y; }
  firmaPrevia = firma;
  pintarCabecera();
}, 1000);

// ------------------------------------------------------------------ vistas
const lema = `<p class="lema">${ico("colibri")} Somos origen. Somos país. Somos Poli.</p>`;
const nombre1 = () => esc((D.perfil?.nombre || "").split(" ")[0]);

const VISTAS = {
  bienvenida: () => `
    <div class="bienvenida">
      <img class="poli" src="img/poligreca_saluda.png" alt="Poligreca te saluda">
      <h1>¡Quiubo! Bienvenido a Café Poli</h1>
      <p class="sub">Soy Poligreca. Regístrate con tu correo del Poli para pedir sin fila, regalar cafés y sumar Puntos Colibrí.</p>
    </div>
    ${formPerfil(true)}
    <button class="btn sec ancho" id="ejemplo">Probar con datos de ejemplo</button>
    <p class="nota-sim">Prototipo: tus datos se guardan solo en este celular.</p>
    ${lema}`,

  inicio: () => {
    const t = ahora();
    const ab = abierto(t);
    const activo = D.pedidos.filter((p) => estadoPedido(p) !== "entregado").slice(-1)[0];
    const bolsa = bolsaHoy(t);
    const cumple = esCumple(t) && t.dia.habil;
    const estado = ab ? `Abierto ahora · cierra a las 9:45 p. m.` : t.dia.habil ? (t.min < ABRE ? "Abrimos a las 6:00 a. m." : "Cerrado · abrimos mañana a las 6:00 a. m.") : `Hoy no abrimos: ${t.dia.motivo}`;
    return `
      <section class="hero">
        <div class="hero-txt">
          <small>${fechaLarga(t)}</small>
          <h1>Hola, ${nombre1()}</h1>
          <p class="hero-estado ${ab ? "si" : "no"}">${ico(ab ? "sol" : "luna")}<span>${estado}</span></p>
          <p class="hero-lugar">${ico("ubicacion")}<span>City Campus · piso 2</span></p>
        </div>
        <img src="img/poligreca_saluda.png" alt="Poligreca">
      </section>
      ${cumple ? `<div class="tarjeta destacada magenta">${fichaIco("torta", "magenta")}<div><h3>¡Hoy es tu cumpleaños!</h3><p>Con tu compra de hoy, la galleta del colibrí va por nuestra cuenta. Pídela en la barra.</p></div></div>` : ""}
      ${bolsa.activa && bolsa.quedan > 0 ? `<button class="banner-bolsa" data-ir="bolsa">${fichaIco("bolsaDia", "oro")}<span><b>¡Ya está la bolsa del final del día!</b><br>2 productos del día por ${fmt(3000)}. Quedan ${bolsa.quedan}.</span>${ico("flecha")}</button>` : ""}
      ${activo ? tarjetaPedido(activo, true) : ""}
      <button class="tarjeta navy puntos-mini" data-ir="puntos">
        <div class="fila entre"><span class="fila">${ico("colibri", "blanco")}<b>${D.puntos} Puntos Colibrí</b></span><small>Ver ${ico("flecha")}</small></div>
        <p>Valen ${fmt(D.puntos)}: úsalos para pagar todo o parte de lo que pidas.</p>
      </button>
      <div class="acciones">
        <button class="accion a-magenta" data-ir="carta">${ico("pocillo")}<b>Pide y pasa</b><small>Sin hacer fila</small></button>
        <button class="accion a-navy" data-ir="regalar">${ico("regalo")}<b>Regala un Café Poli</b><small>Con tu mensaje</small></button>
        <button class="accion a-oro" data-ir="vaso">${ico("vaso")}<b>Trae tu vaso</b><small>−${fmt(DESCUENTO_TERMO)} en bebidas preparadas</small></button>
        <button class="accion a-cian" data-ir="bolsa">${ico("bolsaDia")}<b>Bolsa del día</b><small>Desde las 8:30 p. m.</small></button>
      </div>
      <div class="tarjeta destacada">${fichaIco("rayo", "magenta")}<div><h3>Semana de parciales</h3><p>Llegó el Café Parcial: doble espresso con panela y canela. Unos 125 mg de cafeína: uno por persona.</p></div></div>
      <div class="tarjeta destacada">${fichaIco("barista", "cian")}<div><h3>¿Te regalaron un café?</h3><p>Muestra tu código en la barra. Si atiendes la barra, <button class="enlace" data-ir="reclamar">valida un código aquí</button>.</p></div></div>
      ${lema}`;
  },

  carta: () => `
    <div class="carta-sup">
      <label class="buscar">${ico("buscar")}<input id="buscar" type="search" placeholder="Busca: tinto, Milo, agua…" aria-label="Buscar en la carta" value="${esc(estadoCarta.q)}"></label>
      <div class="mundos" role="tablist" aria-label="Categorías de la carta">
        ${CARTA.map((c, i) => `<button class="chip-mundo ${!estadoCarta.q && estadoCarta.mundo === i ? "activo" : ""}" role="tab" aria-selected="${estadoCarta.mundo === i}" data-mundo="${i}" style="${estiloCat(c.color)}">${ico(ICONO_MUNDO[c.icono] || "pocillo")}<span>${esc(CORTO[c.cat] || c.cat)}</span></button>`).join("")}
      </div>
    </div>
    <div id="lista-carta">${listaCarta()}</div>
    ${lema}`,

  pedir: () => {
    const t = ahora();
    const lineas = Object.entries(D.carrito);
    if (!lineas.length) {
      const prev = D.pedidos.slice(-3).reverse();
      return `<h1>Tu pedido</h1>
        <div class="vacio">${fichaIco("bolsa", "crema")}<p>Tu pedido está vacío.</p><button class="btn" data-ir="carta">Ver la carta</button></div>
        ${prev.length ? `<h2>Tus pedidos</h2>${prev.map((p) => tarjetaPedido(p, true)).join("")}` : ""}${lema}`;
    }
    const r = resumenCarrito();
    const opt = (tipo, txt) => `<button class="opcion ${D.recogida.tipo === tipo ? "activa" : ""}" data-rec="${tipo}">${txt}</button>`;
    return `
      <h1>Tu pedido</h1>
      <p class="sub">${abierto(t) ? "Pide, paga y pasa por él sin hacer fila." : "Estamos cerrados: tu pedido queda programado."}</p>
      <div class="tarjeta">
        ${lineas.map(([k, n]) => { const [id, oz] = k.split("@"); const p = porId(id); const s = stock(id, t); return `
          <div class="item-carrito">${foto(p, "mini")}<div class="n">${esc(conOz(id, oz))}<small>${fmt(precio(id, oz))} c/u${r.vasoEn === k ? ` · <b class="verde">−${fmt(DESCUENTO_TERMO)} con tu vaso</b>` : ""}${s !== Infinity && s < n ? ` · <b class="rojo">solo quedan ${s}</b>` : ""}</small></div>
          <div class="cantidad"><button data-menos="${k}" aria-label="Quitar uno">${ico("menos")}</button><b>${n}</b><button data-mas="${k}" aria-label="Agregar uno">${ico("mas")}</button></div></div>`; }).join("")}
        ${r.desc ? `<div class="linea"><span>Descuento por traer tu vaso</span><span>−${fmt(r.desc)}</span></div>` : ""}
        ${r.pts ? `<div class="linea"><span>Pagado con Puntos Colibrí</span><span>−${fmt(r.pts)}</span></div>` : ""}
        <div class="linea total"><span>Total</span><span>${fmt(r.total)}</span></div>
      </div>
      ${r.elegible ? `<label class="interruptor">${fichaIco("vaso", "oro")}<span>Traigo mi propio vaso<small>−${fmt(DESCUENTO_TERMO)} en ${esc(conOz(...r.elegible.split("@")))}</small></span><input type="checkbox" id="chk-vaso" ${D.conVaso ? "checked" : ""}></label>`
        : `<p class="nota-sim">${ico("vaso")} El descuento por traer tu vaso aplica a las bebidas preparadas, no a las selladas ni a la comida.</p>`}
      ${D.puntos > 0 ? `<label class="interruptor">${fichaIco("colibri", "navy")}<span>Pagar con mis Puntos Colibrí<small>Tienes ${D.puntos} puntos = ${fmt(D.puntos)}; se usan los que alcancen</small></span><input type="checkbox" id="chk-puntos" ${D.usarPuntos ? "checked" : ""}></label>` : ""}
      <h2>${ico("reloj")} ¿Cuándo pasas por él?</h2>
      <div class="opciones">
        ${abierto(t) ? opt("ahora", "Lo antes posible (≈10 min)") : ""}
        ${opt("descanso", "En el descanso de la noche (8:20 p. m.)")}
        ${opt("hora", "A una hora exacta")}
      </div>
      ${D.recogida.tipo === "hora" ? `<label class="campo"><span>Hora de recogida</span><select id="hora-rec">${horasRecogida(t).map((h) => `<option value="${h}" ${String(h) === String(D.recogida.hora) ? "selected" : ""}>${hhmm(h)}${!abierto(t) || h < t.min ? " (programado)" : ""}</option>`).join("")}</select></label>` : ""}
      <button class="btn ancho" id="btn-pagar" ${r.problema ? "disabled" : ""}>${r.total > 0 ? `Pagar ${fmt(r.total)}` : "Confirmar: pago con puntos"}</button>
      ${r.problema ? `<p class="nota-sim rojo">${r.problema}</p>` : ""}
      <p class="nota-sim">Simulación: no se cobra nada. Sumas ${Math.floor(r.total / 1000) * PUNTOS_POR_MIL} Puntos Colibrí.</p>
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
    const prods = REGALABLES.map(porId).filter((p) => p.precio);
    const p = porId(r.producto);
    const tams = tamanosDe(p);
    const total = precio(r.producto, r.oz) + (r.tarjeta ? DETALLE_REGALO.precio : 0);
    return `
      <section class="hero regalo-hero">${fichaIco("regalo", "magenta")}<div class="hero-txt"><h1>Regala un Café Poli</h1><p>Tú escribes y firmas el mensaje: aquí no hay regalos anónimos. Le llega una imagen con tu mensaje y un código para reclamarlo en la barra.</p></div></section>
      <h2>¿Para quién es?</h2>
      <div class="opciones">${["Alguien especial", "Un amigo", "Mi hijo o hija", "Un profe"].map((v) => `<button class="opcion ${r.para === v ? "activa" : ""}" data-para="${v}">${v}</button>`).join("")}</div>
      <h2>¿Qué le regalas?</h2>
      <div class="regalables">${prods.map((q) => `<button class="regalable ${q.id === r.producto ? "activa" : ""}" data-prod="${q.id}">${foto(q, "mini")}<span>${esc(nombreCorto(q))}</span></button>`).join("")}</div>
      ${tams ? `<div class="seg grande" role="radiogroup" aria-label="Tamaño">${tams.map((s) => `<button role="radio" aria-checked="${String(s.oz) === String(r.oz)}" class="${String(s.oz) === String(r.oz) ? "activo" : ""}" data-oz="${s.oz}">${s.oz} oz<small>${fmt(s.precio)}</small></button>`).join("")}</div>` : ""}
      <label class="campo"><span>Nombre de quien lo recibe</span><input id="rg-nombre" maxlength="28" value="${esc(r.nombre)}" autocomplete="off"></label>
      <label class="campo"><span>Tu mensaje <b class="contador" id="rg-cont">${r.mensaje.length}/120</b></span><textarea id="rg-msj" maxlength="120" placeholder="Escribe algo bonito…">${esc(r.mensaje)}</textarea></label>
      <label class="campo"><span>Firma</span><input id="rg-firma" maxlength="24" value="${esc(r.firma)}" autocomplete="off"></label>
      <label class="interruptor">${fichaIco("sobre", "magenta")}<span>${DETALLE_REGALO.nombre}<small>+${fmt(DETALLE_REGALO.precio)}</small></span><input type="checkbox" id="rg-tarjeta" ${r.tarjeta ? "checked" : ""}></label>
      <div class="tarjeta"><div class="linea total" style="border:0;margin:0;padding:0"><span>Total</span><span id="rg-total">${fmt(total)}</span></div></div>
      <button class="btn ancho" id="rg-pagar">Pagar y crear el código</button>
      <p class="nota-sim">Simulación: no se cobra nada. El código vale 30 días.</p>
      ${D.regalos.length ? `<h2>Tus regalos</h2>${D.regalos.slice(-4).reverse().map((g) => `<button class="tarjeta destacada" data-ir="regaloListo" data-p="${g.codigo}">${foto(porId(g.producto), "mini")}<div><h3>Para ${esc(g.nombre)} · <span class="codigo-mini">${g.codigo}</span></h3><p>${esc(conOz(g.producto, g.oz))} · ${g.usado ? "ya reclamado" : `vale hasta el ${g.vence}`}</p></div></button>`).join("")}` : ""}
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
        <button class="btn ancho" id="rg-compartir">${ico("compartir")} Compartir (Instagram, WhatsApp…)</button>
        <a class="btn verde-wa ancho" id="rg-wa" target="_blank" rel="noopener">${ico("chat")} Enviar por WhatsApp</a>
        <button class="btn sec ancho" id="rg-bajar">${ico("descargar")} Descargar la imagen</button>
        <button class="btn sec ancho" id="rg-copiar">${ico("copiar")} Copiar el mensaje</button>
      </div>
      <p class="nota-sim">Vale hasta el ${g.vence}. Se reclama una sola vez.</p>
      ${lema}`;
  },

  recibido: (dato) => {
    const g = b64.de(dato || "");
    if (!g || !g.c) return `<div class="vacio">${fichaIco("regalo", "crema")}<p>Este enlace de regalo no está completo.</p><button class="btn" data-ir="inicio">Ir a Café Poli</button></div>`;
    const p = porId(g.p);
    return `
      <div class="tarjeta navy recibido">
        <p class="ceja">Te regalaron un café</p>
        <h1>Para ${esc(g.n)}${g.e ? ` ${ico("corazon", "blanco")}` : ""}</h1>
        <p class="oro">${esc(p.precio ? conOz(g.p, g.o) : "Un Café Poli")}${g.k ? " + chocolatina" : ""}</p>
        <p class="mensaje">“${esc(g.m)}”</p>
        <p class="oro firma">— ${esc(g.f)}</p>
      </div>
      <div class="tarjeta centro">
        <h3>Tu código</h3>
        <div class="codigo-grande">${esc(g.c)}</div>
        <div class="qr-pago">${qrSVG(`CAFEPOLI:${g.c}`, 154)}</div>
        <p>Muéstralo en la barra de Café Poli (City Campus, piso 2) hasta el ${esc(g.v)}. Te lo entregamos por tu nombre.</p>
      </div>
      <button class="btn ancho" data-ir="inicio">Conocer la app de Café Poli</button>
      ${lema}`;
  },

  reclamar: (cod) => `
    <section class="hero regalo-hero">${fichaIco("barista", "cian")}<div class="hero-txt"><h1>Reclamar un código</h1><p>En la barra: el barista escribe o escanea el código del regalo, del tinto canjeado o de la bolsa del día.</p></div></section>
    <label class="campo"><span>Código</span><input id="rc-cod" placeholder="CP-7KQ4" value="${esc(cod || "")}" autocapitalize="characters" autocomplete="off"></label>
    <button class="btn ancho" id="rc-validar">${ico("qr")} Validar</button>
    <div id="rc-res" style="margin-top:12px"></div>
    ${lema}`,

  puntos: () => `
    <div class="tarjeta navy centro club">
      <span class="club-ico">${ico("colibri")}</span>
      <p>Club Colibrí</p>
      <div class="puntos-grande">${D.puntos}</div>
      <p>Puntos Colibrí</p>
      <p>Valen <b>${fmt(D.puntos)}</b> · 1 punto = $1 · por cada $1.000 sumas ${PUNTOS_POR_MIL} puntos</p>
    </div>
    <button class="btn ancho oro" id="usar-puntos" ${D.puntos > 0 ? "" : "disabled"}>${ico("pocillo")} Usar mis puntos en un pedido</button>
    <p class="nota-sim">Sirven para cualquier producto de la carta: pagas todo con puntos o solo una parte y el resto con tu medio de pago.</p>
    <div class="tarjeta destacada" style="margin-top:12px">${fichaIco("torta", "magenta")}<div><h3>Tu cumpleaños</h3><p>${D.perfil?.cumpleDia ? `Lo tenemos el ${D.perfil.cumpleDia} de ${MESES[D.perfil.cumpleMes - 1]}. ` : ""}Ese día, si es hábil (lunes a sábado, no festivo), te felicitamos aquí y con tu compra la galleta del colibrí va por nuestra cuenta.</p></div></div>
    <div class="tarjeta destacada">${fichaIco("vaso", "oro")}<div><h3>Suma con tu vaso</h3><p>Si traes tu propio vaso, las bebidas preparadas valen ${fmt(DESCUENTO_TERMO)} menos, en cualquier tamaño. <button class="enlace" data-ir="vaso">Ver cómo</button></p></div></div>
    <h2>Tu historial</h2>
    <div class="tarjeta historial">${D.historial.slice(-8).reverse().map(([n, p]) => `<div class="linea"><span>${esc(n)}</span><b class="${p < 0 ? "rojo" : ""}">${p > 0 ? "+" : ""}${p}</b></div>`).join("")}</div>
    ${lema}`,

  vaso: () => {
    const ej = ["tinto", "capu", "latte", "milo", "chai", "panela"].map(porId).filter((p) => p.precio);
    return `
      <section class="hero regalo-hero">${fichaIco("vaso", "oro")}<div class="hero-txt"><h1>Trae tu propio vaso</h1><p>Tu vaso o tu termo, del tamaño que quieras. En las bebidas preparadas pagas por onzas y siempre ${fmt(DESCUENTO_TERMO)} menos. No aplica a las bebidas selladas ni a la comida.</p></div></section>
      <div class="tarjeta">
        ${ej.map((p) => `<div class="fila-vaso">${foto(p, "mini")}<b>${esc(nombreCorto(p))}</b><span>${(tamanosDe(p) || []).map((s) => `<i>${s.oz} oz <s>${fmt(s.precio)}</s> <b>${fmt(s.precio - DESCUENTO_TERMO)}</b></i>`).join("")}</span></div>`).join("")}
      </div>
      <h2>¿No tienes vaso?</h2>
      <div class="tarjeta">${VASOS.map((v) => { const [, cl] = etiquetaStock("vaso"); return `<div class="linea centro-v"><span class="fila">${foto(porId("vaso"), "mini")}Vaso Café Poli · ${v.oz} oz</span><span class="fila"><b>${fmt(v.precio)}</b><button class="mas" data-add="vaso" data-oz="${v.oz}" ${cl === "no" ? "disabled" : ""} aria-label="Agregar vaso de ${v.oz} onzas">${ico("mas")}</button></span></div>`; }).join("")}
        <p style="margin-top:6px">Con ${fmt(DESCUENTO_TERMO)} menos en cada bebida preparada, el vaso se paga solo antes de que termine el semestre.</p></div>
      ${lema}`;
  },

  bolsa: () => {
    const t = ahora();
    const b = bolsaHoy(t);
    const mias = D.bolsas.filter((x) => x.fecha === t.fecha);
    let cuerpo;
    if (!t.dia.habil) cuerpo = `<div class="tarjeta"><h3>Hoy no hay bolsa</h3><p>Hoy es ${t.dia.motivo} y Café Poli no abre.</p></div>`;
    else if (t.min < BOLSA_DESDE) cuerpo = `<div class="tarjeta destacada">${fichaIco("reloj", "cian")}<div><h3>Sale a las 8:30 p. m.</h3><p>A esa hora la caja ya sabe qué quedó del día. Si hay, te avisamos aquí. En el modo demo (Perfil) puedes adelantar la hora.</p></div></div>`;
    else if (t.min >= BOLSA_HASTA) cuerpo = `<div class="tarjeta"><h3>La bolsa de hoy ya cerró</h3><p>Se recoge hasta las 9:30 p. m. Lo que nadie reservó se donó esta noche.</p></div>`;
    else if (b.quedan <= 0) cuerpo = `<div class="tarjeta"><h3>¡Se acabaron!</h3><p>Hoy se vendió casi todo. Lo poco que queda se dona esta noche.</p></div>`;
    else cuerpo = `
      <div class="tarjeta destacada borde-oro">
        <div class="bolsa-fotos">${b.pan.slice(0, 2).map((x) => foto(porId(x.id), "mini")).join("")}</div>
        <div><h3>2 productos del día · ${fmt(3000)}</h3><p>Hoy quedó, por ejemplo, <b>${b.ejemplo.map(esc).join("</b> y <b>")}</b>. En la carta valen ${fmt(b.valor)}.</p><p class="quedan">Quedan ${b.quedan} bolsas</p></div>
      </div>
      <button class="btn ancho" id="bolsa-reservar">Reservar y pagar ${fmt(3000)}</button>`;
    return `
      <section class="hero regalo-hero">${fichaIco("bolsaDia", "oro")}<div class="hero-txt"><h1>Bolsa del final del día</h1><p>Lo que no se vendió, horneado esta mañana, a ${fmt(3000)} por dos productos. Los empacados no entran: no se dañan.</p></div></section>
      ${cuerpo}
      ${mias.map((x) => `<div class="tarjeta centro"><h3>Tu bolsa</h3><p>Recógela en la barra antes de las 9:30 p. m. con este código:</p><div class="codigo-grande">${x.codigo}</div><p>Trae: ${x.items.map(esc).join(" y ")}.</p></div>`).join("")}
      <div class="tarjeta"><h3>¿Cómo funciona?</h3><ol class="pasos"><li>A las 8:30 p. m. la caja revisa el inventario y la app avisa al Club Colibrí.</li><li>La reservas y la pagas aquí.</li><li>La recoges con tu código antes de las 9:30 p. m.</li><li>Lo que nadie reserva se dona esa misma noche.</li></ol></div>
      ${lema}`;
  },

  perfil: () => `
    <h1>Mi perfil</h1>
    ${formPerfil(false)}
    <div class="tarjeta"><h3>Mis datos</h3><p>En este prototipo todo se guarda solo en este celular. <button class="enlace" id="borrar">Borrar mis datos</button></p></div>
    <p class="centro"><button class="enlace suave" id="ver-demo">${ico("ajustes")} ${D.demo ? "Modo demo (activo)" : "Modo demo"}</button></p>
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
      <label class="interruptor plano"><span>Quiero salir en Poli TV el día de mi cumpleaños</span><input type="checkbox" id="pf-tv" ${p.permisoTV ? "checked" : ""}></label>
      <button class="btn ancho" id="pf-guardar">${nuevo ? "Entrar a Café Poli" : "Guardar"}</button>
    </div>`;
}
function panelDemo() {
  const t = ahora();
  const cumple = esCumple(t);
  return `
    <div class="tarjeta demo">
      <h3>${ico("ajustes")} Modo demo</h3>
      <p>Cambia la fecha y la hora de la app para probar el cumpleaños, los festivos, los horarios y la bolsa del final del día.</p>
      <div class="fila" style="margin-top:8px"><label class="campo" style="flex:1;margin:0"><span>Fecha</span><input type="date" id="dm-fecha" value="${t.fecha}"></label>
      <label class="campo" style="flex:1;margin:0"><span>Hora</span><input type="time" id="dm-hora" value="${String(Math.floor(t.min / 60)).padStart(2, "0")}:${String(t.min % 60).padStart(2, "0")}"></label></div>
      <button class="btn navy ancho" id="dm-aplicar" style="margin-top:8px">Usar esta fecha y hora</button>
      <div class="botones">
        <button data-dm="cumple-habil">${ico("torta")} Mi cumpleaños en día hábil</button>
        <button data-dm="cumple-domingo">${ico("torta")} Mi cumpleaños en domingo</button>
        <button data-dm="cumple-festivo">${ico("torta")} Mi cumpleaños el 8 de diciembre (festivo)</button>
        <button data-dm="bolsa">${ico("bolsaDia")} 8:35 p. m. (bolsa del día)</button>
        <button data-dm="pico">${ico("reloj")} 6:30 p. m. (antes del pico)</button>
        <button data-dm="cerrado">${ico("luna")} 10:00 p. m. (cerrado)</button>
      </div>
      <div class="estado-dia">${fechaLarga(t)} · ${hhmm(t.min)}: ${t.dia.motivo}${cumple ? ` · es tu cumpleaños → ${t.dia.habil ? "se te felicita" : "no se felicita porque es " + t.dia.motivo}` : ""}</div>
      <button class="btn sec ancho" id="dm-real" style="margin-top:8px">Volver a la fecha y hora reales</button>
      <button class="btn sec ancho" id="dm-reiniciar" style="margin-top:8px">Reiniciar la demo (pedidos, inventario y puntos)</button>
    </div>`;
}
const estadoCarta = { mundo: 0, q: "", demoAbierto: false, tam: {} };
const normal = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function listaCarta() {
  const q = normal(estadoCarta.q.trim());
  if (q) {
    const res = PRODUCTOS.filter((p) => normal(`${p.nombre} ${p.mundo} ${p.grupo || ""} ${DESC[p.id] || ""}`).includes(q));
    if (!res.length) return `<div class="vacio">${fichaIco("buscar", "crema")}<p>No encontramos «${esc(estadoCarta.q)}».</p></div>`;
    return `<p class="resultados">${res.length} resultado${res.length === 1 ? "" : "s"}</p>${res.map(tarjetaProducto).join("")}`;
  }
  const c = CARTA[estadoCarta.mundo] || CARTA[0];
  let grupo = null;
  const filas = c.items.map((p0) => {
    const p = porId(p0.id);
    const g = p.grupo && p.grupo !== grupo ? `<p class="grupo">${esc(p.grupo)}</p>` : "";
    grupo = p.grupo || grupo;
    return g + tarjetaProducto(p);
  }).join("");
  const algunoVaso = c.items.some((p) => p.termo);
  return `
    <div class="mundo-cab" style="${estiloCat(c.color)}">
      <span class="mundo-ico">${ico(ICONO_MUNDO[c.icono] || "pocillo")}</span>
      <div><h2>${esc(c.cat)}</h2><p>${esc(c.lema || "")}</p></div>
    </div>
    ${c.nota ? `<p class="mundo-nota">${esc(c.nota)}</p>` : ""}
    ${algunoVaso ? `<p class="mundo-nota verde">${ico("vaso")} Con tu propio vaso: −${fmt(DESCUENTO_TERMO)} en las bebidas marcadas.</p>` : ""}
    <div class="productos">${filas}</div>`;
}
function tarjetaProducto(p) {
  const [et, cl] = etiquetaStock(p.id);
  const agotado = cl === "no";
  const tams = tamanosDe(p);
  const sel = estadoCarta.tam[p.id] || (tams ? String(tams[0].oz) : null);
  const clave = sel ? `${p.id}@${sel}` : p.id;
  const enCarrito = Object.entries(D.carrito).filter(([k]) => k.split("@")[0] === p.id).reduce((a, [, n]) => a + n, 0);
  return `
    <article class="prod ${agotado ? "agotado" : ""}" data-abrir="${p.id}" tabindex="0" aria-label="${esc(p.nombre)}">
      ${foto(p, "", `<span class="disp ${cl}">${et}</span>`)}
      <div class="prod-info">
        <h3>${esc(nombreCorto(p))}</h3>
        <p class="prod-desc">${esc(DESC[p.id] || p.nota || "")}</p>
        ${p.termo ? `<span class="sello-vaso">${ico("vaso")} −${fmt(DESCUENTO_TERMO)} con tu vaso</span>` : ""}
        <div class="prod-pie">
          ${tams && tams.length > 1 ? `<div class="seg" role="radiogroup" aria-label="Tamaño">${tams.map((s) => `<button role="radio" aria-checked="${String(s.oz) === sel}" class="${String(s.oz) === sel ? "activo" : ""}" data-tam="${p.id}" data-oz="${s.oz}">${s.oz}<small>oz</small></button>`).join("")}</div>` : tams ? `<span class="oz-unico">${tams[0].oz} oz</span>` : ""}
          <b class="precio">${fmt(precio(p.id, sel))}</b>
          <button class="mas" data-add="${p.id}" ${sel ? `data-oz="${sel}"` : ""} ${agotado ? "disabled" : ""} aria-label="Agregar ${esc(nombreCorto(p))}${sel ? ` de ${sel} onzas` : ""}">${ico("mas")}${enCarrito ? `<span class="cant">${enCarrito}</span>` : ""}</button>
        </div>
      </div>
    </article>`;
}
function abrirProducto(id) {
  const p = porId(id);
  const tams = tamanosDe(p);
  let sel = estadoCarta.tam[id] || (tams ? String(tams[0].oz) : null), cant = 1;
  const pintar = () => {
    const [et, cl] = etiquetaStock(id);
    const agotado = cl === "no";
    hojaCaja.innerHTML = `
      <div class="hoja-prod">
        <button class="cerrar-hoja" id="hp-cerrar" aria-label="Cerrar">${ico("cerrar")}</button>
        ${foto(p, "grande")}
        <div class="prod-fila"><h2>${esc(p.nombre)}</h2><span class="disp ${cl}">${et}</span></div>
        <p class="sub">${esc(DESC[id] || "")}${p.nota ? ` ${esc(p.nota)}` : ""}</p>
        ${p.termo ? `<span class="sello-vaso">${ico("vaso")} −${fmt(DESCUENTO_TERMO)} si traes tu propio vaso</span>` : (p.mundo === "Bebidas frías para llevar" ? `<p class="mundo-nota">Viene sellada: no aplica el descuento por traer tu vaso.</p>` : "")}
        ${tams ? `<h3>Tamaño</h3><div class="seg grande" role="radiogroup" aria-label="Tamaño">${tams.map((s) => `<button role="radio" aria-checked="${String(s.oz) === sel}" class="${String(s.oz) === sel ? "activo" : ""}" data-hoz="${s.oz}">${s.oz} oz<small>${fmt(s.precio)}</small></button>`).join("")}</div>` : ""}
        <div class="fila entre" style="margin:14px 0">
          <div class="cantidad grande"><button id="hp-menos" aria-label="Quitar uno">${ico("menos")}</button><b>${cant}</b><button id="hp-mas" aria-label="Agregar uno">${ico("mas")}</button></div>
          <b class="precio grande">${fmt(precio(id, sel) * cant)}</b>
        </div>
        <button class="btn ancho" id="hp-agregar" ${agotado ? "disabled" : ""}>${agotado ? "Agotado por hoy" : `Agregar al pedido · ${fmt(precio(id, sel) * cant)}`}</button>
      </div>`;
    $("#hp-cerrar").addEventListener("click", () => cerrarHoja());
    $$("[data-hoz]", hojaCaja).forEach((b) => b.addEventListener("click", () => { sel = b.dataset.hoz; estadoCarta.tam[id] = sel; pintar(); }));
    $("#hp-menos").addEventListener("click", () => { cant = Math.max(1, cant - 1); pintar(); });
    $("#hp-mas").addEventListener("click", () => { cant = Math.min(9, cant + 1); pintar(); });
    $("#hp-agregar").addEventListener("click", () => { let ok = 0; for (let i = 0; i < cant; i++) if (agregar(id, sel, i < cant - 1)) ok++; if (ok) { cerrarHoja(); refrescarCarta(); } });
  };
  abrirHoja("");
  pintar();
}
function refrescarCarta() { if (actual !== "carta") return; const y = vista.scrollTop; $("#lista-carta").innerHTML = listaCarta(); vista.scrollTop = y; }
function agregar(id, oz, silencio = false) {
  const k = oz ? `${id}@${oz}` : id;
  const s = stock(id);
  const ya = Object.entries(D.carrito).filter(([kk]) => (COMBO[kk.split("@")[0]] || kk.split("@")[0]) === (COMBO[id] || id)).reduce((a, [, n]) => a + n, 0);
  if (s !== Infinity && ya >= s) { aviso(s <= 0 ? "Se agotó por hoy" : `Solo quedan ${s}`); return false; }
  D.carrito[k] = (D.carrito[k] || 0) + 1;
  guardar();
  if (!silencio) aviso(`Agregado: ${conOz(id, oz)}`);
  pintarCabecera();
  const b = $("#badge-carrito"); b.classList.remove("salta"); void b.offsetWidth; b.classList.add("salta");
  return true;
}
function resumenCarrito() {
  let total = 0, problema = "", elegible = null, mejor = 0;
  const t = ahora();
  const usados = {};
  for (const [k, n] of Object.entries(D.carrito)) {
    const [id, oz] = k.split("@");
    const pr = precio(id, oz);
    total += pr * n;
    if (porId(id).termo && pr > mejor) { mejor = pr; elegible = k; } // el vaso se aplica a una bebida preparada del pedido
    const real = COMBO[id] || id;
    usados[real] = (usados[real] || 0) + n;
  }
  for (const [id, n] of Object.entries(usados)) { const s = stock(id, t); if (s !== Infinity && n > s) problema = `${nombreCorto(porId(id))}: solo quedan ${s}. Ajusta tu pedido.`; }
  const desc = D.conVaso && elegible ? DESCUENTO_TERMO : 0;
  const pts = D.usarPuntos ? Math.max(0, Math.min(D.puntos, total - desc)) : 0; // 1 punto = $1: pago total o parcial
  return { total: total - desc - pts, desc, pts, elegible, vasoEn: desc ? elegible : null, problema };
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
      <div class="fila entre"><h3>${ico("bolsa")} Pedido ${p.codigo}</h3><b class="estado-pedido ${e}">${{ entregado: "Entregado", programado: "Programado", recibido: "Recibido", preparando: "En preparación", listo: "¡Listo!" }[e]}</b></div>
      <p>${p.lineas.map(esc).join(" · ")} · <b>${fmt(p.total)}</b></p>
      <p>${ico("reloj")} Recoge: ${esc(p.recogidaTxt)}</p>
      ${corto && e !== "entregado" ? `<button class="enlace" data-ir="pedido" data-p="${p.codigo}">Ver estado</button>` : ""}
      ${!corto ? `
        <ol class="linea-tiempo">${pasos.map(([k, n, s], j) => `<li class="${j < i || e === "entregado" ? "hecho" : j === i ? "actual" : ""}">${n}<small>${s}</small></li>`).join("")}</ol>
        ${e === "programado" ? `<p>Lo empezamos 10 minutos antes de tu hora. <button class="enlace" id="pd-adelantar">Simular que ya es la hora</button></p>` : ""}
        ${e === "listo" ? `<div class="listo-grande"><span class="grande-ico ok">${ico("barista")}</span><h3>¡${nombre1()}, tu pedido está listo!</h3><p>Pasa por la barra de recogida y muestra el código.</p><div class="codigo-grande">${p.codigo}</div><button class="btn ancho" id="pd-recogido">Ya lo recogí</button></div>` : ""}
        <p class="nota-sim">Tiempos acelerados para la demostración.</p>` : ""}
    </div>`;
}
const REGALABLES = ["latte", "capu", "tinto", "milo", "chai", "matcha", "choco", "pausa", "desayuno", "postre2", "cheesecake", "brownie"];
function borrador() {
  if (!D.borrador) {
    const t = porId("latte");
    D.borrador = { para: "Alguien especial", producto: "latte", oz: t?.tamanos?.[0]?.oz || "", nombre: "", mensaje: "", firma: (D.perfil?.nombre || "").split(" ")[0], tarjeta: true };
  }
  return D.borrador;
}
function bolsaHoy(t = ahora()) {
  const activa = t.dia.habil && t.min >= BOLSA_DESDE && t.min < BOLSA_HASTA;
  const pan = DEL_DIA.map((id) => ({ id, s: stock(id, t) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  const unidades = pan.reduce((a, x) => a + x.s, 0);
  const quedan = Math.min(12, Math.floor(unidades / 2));
  const ejemplo = pan.slice(0, 2).map((x) => nombreCorto(porId(x.id)));
  const valor = pan.slice(0, 2).reduce((a, x) => a + porId(x.id).precio, 0);
  return { activa, quedan, ejemplo: ejemplo.length ? ejemplo : ["pan de bono", "brownie"], valor: Math.max(valor, 4000), pan };
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
  const [logo, iso, fotoP] = await Promise.all([cargarImg("img/logo-blanco.svg"), cargarImg("img/isotipo.svg"), cargarImg(`img/carta/${g0.producto}.jpg`)]);
  const fondo = g.createLinearGradient(0, 0, W, H); fondo.addColorStop(0, "#1b5a8c"); fondo.addColorStop(0.45, "#0F385A"); fondo.addColorStop(1, "#061a2c");
  g.fillStyle = fondo; g.fillRect(0, 0, W, H);
  const halo = (x, y, r, col) => { const h = g.createRadialGradient(x, y, 0, x, y, r); h.addColorStop(0, col); h.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = h; g.fillRect(0, 0, W, H); };
  halo(1000, 1700, 700, "rgba(224,0,110,.35)"); halo(80, 260, 620, "rgba(21,190,206,.28)"); halo(900, 420, 380, "rgba(251,175,23,.14)");
  if (iso) { g.save(); g.globalAlpha = 0.07; g.drawImage(iso, 430, 520, 900, 900); g.restore(); }
  if (logo) { const w = 560, h = w / 3.637; g.drawImage(logo, (W - w) / 2, 110, w, h); }
  g.textAlign = "center"; g.fillStyle = "#15BECE"; g.font = "800 40px 'Nunito Sans', sans-serif";
  g.fillText("T E   R E G A L A R O N   U N   C A F É", W / 2, 400);
  const para = `Para ${g0.nombre}${g0.para === "Alguien especial" ? " ❤" : ""}`;
  g.fillStyle = "#FFFFFF"; ajustar(g, para, 960, 112, "800", "Sora, sans-serif"); g.fillText(para, W / 2, 530);
  // foto del producto (si ya está renderizada) en un círculo
  let y = 590;
  if (fotoP) { g.save(); g.beginPath(); g.arc(W / 2, y + 120, 120, 0, Math.PI * 2); g.closePath(); g.clip(); g.drawImage(fotoP, W / 2 - 120, y, 240, 240); g.restore(); g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 8; g.beginPath(); g.arc(W / 2, y + 120, 120, 0, Math.PI * 2); g.stroke(); y += 270; }
  const prod = `${conOz(g0.producto, g0.oz)}${g0.tarjeta ? " + chocolatina" : ""}`;
  ajustar(g, prod, 860, 44, "800", "'Nunito Sans', sans-serif");
  const pw = Math.min(980, g.measureText(prod).width + 80);
  g.fillStyle = "rgba(251,175,23,.16)"; rr(g, (W - pw) / 2, y, pw, 86, 43); g.fill();
  g.fillStyle = "#FBAF17"; g.fillText(prod, W / 2, y + 57);
  g.fillStyle = "#FFF4E3"; g.font = "italic 600 56px 'Nunito Sans', sans-serif";
  const lineas = envolver(g, `“${g0.mensaje || "¡Disfrútalo!"}”`, 880).slice(0, fotoP ? 4 : 6);
  const yM = y + 190;
  lineas.forEach((l, i) => g.fillText(l, W / 2, yM + i * 74));
  const yFirma = yM + lineas.length * 74 + 24;
  g.fillStyle = "#FBAF17"; g.font = "800 52px Sora, sans-serif"; g.fillText(`— ${g0.firma}`, W / 2, yFirma);
  const y0 = Math.min(Math.max(yFirma + 60, 1250), 1360);
  g.fillStyle = "#FFFFFF"; rr(g, 90, y0, 900, 440, 44); g.fill();
  g.textAlign = "left"; g.fillStyle = "#5C6B7A"; g.font = "800 34px 'Nunito Sans', sans-serif"; g.fillText("Tu código", 150, y0 + 85);
  g.fillStyle = "#0F385A"; g.font = "800 92px Sora, sans-serif"; g.fillText(g0.codigo, 150, y0 + 190);
  const corto = g0.venceClave ? (([a, m, d]) => `${+d} ${MESES[+m - 1].slice(0, 3)} ${a}`)(g0.venceClave.split("-")) : g0.vence;
  g.fillStyle = "#E0006E"; ajustar(g, `Vale hasta el ${corto}`, 400, 34, "800", "'Nunito Sans', sans-serif"); g.fillText(`Vale hasta el ${corto}`, 150, y0 + 252);
  g.fillStyle = "#1D2733"; g.font = "600 30px 'Nunito Sans', sans-serif";
  g.fillText("Muéstralo en la barra de Café Poli", 150, y0 + 318); g.fillText("City Campus, piso 2", 150, y0 + 360);
  if (typeof window.qrcode === "function") {
    const q = window.qrcode(0, "M"); q.addData(urlReclamar(g0.codigo)); q.make();
    const n = q.getModuleCount(), tam = 300, s = tam / n, qx = 990 - 60 - tam, qy = y0 + 70;
    g.fillStyle = "#0F385A";
    for (let yy = 0; yy < n; yy++) for (let x = 0; x < n; x++) if (q.isDark(yy, x)) g.fillRect(qx + x * s, qy + yy * s, Math.ceil(s), Math.ceil(s));
  }
  g.textAlign = "center"; g.fillStyle = "rgba(255,244,227,.85)"; g.font = "700 36px 'Nunito Sans', sans-serif";
  g.fillText("Escanea el QR o muestra el código en la barra", W / 2, Math.min(1860, y0 + 520));
  return new Promise((ok) => c.toBlob((b) => ok(b), "image/png"));
}
// el enlace del regalo lleva sus datos: quien lo abre en su celular ve su tarjeta aunque no tenga la app
const b64 = { a: (o) => { const b = new TextEncoder().encode(JSON.stringify(o)); let s = ""; b.forEach((x) => (s += String.fromCharCode(x))); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
  de: (t) => { try { const s = atob(t.replace(/-/g, "+").replace(/_/g, "/")); return JSON.parse(new TextDecoder().decode(Uint8Array.from(s, (c) => c.charCodeAt(0)))); } catch { return null; } } };
const datosRegalo = (g) => ({ c: g.codigo, n: g.nombre, p: g.producto, o: g.oz, m: g.mensaje, f: g.firma, v: g.vence, k: g.tarjeta ? 1 : 0, e: g.para === "Alguien especial" ? 1 : 0 });
const urlRegalo = (g) => `${location.origin}${location.pathname}#recibido=${b64.a(datosRegalo(g))}`;
const urlReclamar = (cod) => { const g = D.regalos.find((x) => x.codigo === cod); return g ? urlRegalo(g) : `${location.origin}${location.pathname}#reclamar=${encodeURIComponent(cod)}`; };
const textoRegalo = (g) => `${g.firma} te regaló ${conOz(g.producto, g.oz)} en Café Poli (City Campus, piso 2).\n“${g.mensaje}”\nTu código: ${g.codigo} · muéstralo en la barra. Vale hasta el ${g.vence}.\n${urlRegalo(g)}`;
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
    const marcar = () => $$(".chip-mundo").forEach((x) => { const si = !estadoCarta.q.trim() && +x.dataset.mundo === estadoCarta.mundo; x.classList.toggle("activo", si); x.setAttribute("aria-selected", String(si)); if (si) x.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); });
    $("#buscar").addEventListener("input", (e) => { estadoCarta.q = e.target.value; marcar(); lista.innerHTML = listaCarta(); });
    $$(".chip-mundo").forEach((b) => b.addEventListener("click", () => { estadoCarta.mundo = +b.dataset.mundo; estadoCarta.q = ""; $("#buscar").value = ""; marcar(); lista.innerHTML = listaCarta(); vista.scrollTo({ top: 0, behavior: "smooth" }); }));
    lista.addEventListener("click", (e) => {
      const t = e.target.closest("[data-tam]");
      if (t) { estadoCarta.tam[t.dataset.tam] = t.dataset.oz; refrescarCarta(); return; }
      const b = e.target.closest("[data-add]");
      if (b) { if (agregar(b.dataset.add, b.dataset.oz)) refrescarCarta(); return; }
      const a = e.target.closest("[data-abrir]");
      if (a) abrirProducto(a.dataset.abrir);
    });
    lista.addEventListener("keydown", (e) => { const a = e.target.closest?.("[data-abrir]"); if (a && e.target === a && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); abrirProducto(a.dataset.abrir); } });
    // deslizar a los lados cambia de categoría
    let x0 = null;
    lista.addEventListener("touchstart", (e) => { x0 = e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive: true });
    lista.addEventListener("touchend", (e) => { if (!x0 || estadoCarta.q) return; const dx = e.changedTouches[0].clientX - x0[0], dy = e.changedTouches[0].clientY - x0[1]; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) { estadoCarta.mundo = (estadoCarta.mundo + (dx < 0 ? 1 : -1) + CARTA.length) % CARTA.length; marcar(); lista.innerHTML = listaCarta(); vista.scrollTo({ top: 0 }); } x0 = null; }, { passive: true });
    setTimeout(marcar, 30);
  },
  vaso: () => { $$("[data-add]").forEach((b) => b.addEventListener("click", () => { agregar(b.dataset.add, b.dataset.oz); })); },
  pedir: () => {
    $$("[data-mas]").forEach((b) => b.addEventListener("click", () => { const [id, oz] = b.dataset.mas.split("@"); agregar(id, oz, true); ir("pedir"); }));
    $$("[data-menos]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.menos; D.carrito[k]--; if (D.carrito[k] <= 0) delete D.carrito[k]; guardar(); ir("pedir"); }));
    $("#chk-vaso")?.addEventListener("change", (e) => { D.conVaso = e.target.checked; guardar(); ir("pedir"); });
    $("#chk-puntos")?.addEventListener("change", (e) => { D.usarPuntos = e.target.checked; guardar(); ir("pedir"); });
    $$("[data-rec]").forEach((b) => b.addEventListener("click", () => { D.recogida.tipo = b.dataset.rec; if (b.dataset.rec === "hora" && !D.recogida.hora) D.recogida.hora = horasRecogida(ahora())[0]; guardar(); ir("pedir"); }));
    $("#hora-rec")?.addEventListener("change", (e) => { D.recogida.hora = e.target.value; guardar(); });
    $("#btn-pagar")?.addEventListener("click", async () => {
      const t = ahora();
      const r = resumenCarrito();
      if (r.problema) return;
      try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch {}
      const lineas = Object.entries(D.carrito).map(([k, n]) => { const [id, oz] = k.split("@"); return `${n} × ${conOz(id, oz)}`; });
      const ok = r.total > 0 ? await pagar(r.total, `Pedido Café Poli: ${lineas.join(", ")}`) : true;
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
      const p = { codigo: `A${40 + (D.pedidos.length * 7) % 60}`, lineas, total: r.total, pago: D.pago, recogidaTxt, programado, preparaEn, listoEn, creado: now };
      D.pedidos.push(p);
      if (r.pts) { D.puntos -= r.pts; D.historial.push(["Pagaste con puntos", -r.pts]); }
      const pts = sumarPuntos(r.total, lineas.map((l) => l.replace(/^\d+ × /, "")).join(", "));
      D.carrito = {}; D.conVaso = false; D.usarPuntos = false;
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
    $$("[data-prod]").forEach((b) => b.addEventListener("click", () => { r.producto = b.dataset.prod; r.oz = tamanosDe(porId(r.producto))?.[0]?.oz || ""; guardar(); const y = vista.scrollTop; ir("regalar"); vista.scrollTop = y; }));
    $$("[data-oz]").forEach((b) => b.addEventListener("click", () => { r.oz = b.dataset.oz; guardar(); const y = vista.scrollTop; ir("regalar"); vista.scrollTop = y; }));
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
      const caja = (icono, tono, titulo, html) => `<div class="tarjeta destacada borde-${tono}">${fichaIco(icono, tono)}<div><h3>${titulo}</h3>${html}</div></div>`;
      if (g) {
        if (g.usado) res.innerHTML = caja("alerta", "oro", "Ya se reclamó", `<p>Este regalo para ${esc(g.nombre)} se entregó el ${esc(g.usado)}.</p>`);
        else if (g.venceClave && t.fecha > g.venceClave) res.innerHTML = caja("reloj", "oro", "Venció", `<p>Valía hasta el ${esc(g.vence)}.</p>`);
        else {
          res.innerHTML = caja("checkCirculo", "verde", "Código válido", `<p><b>${esc(conOz(g.producto, g.oz))}${g.tarjeta ? " + tarjeta impresa y chocolatina" : ""}</b> para <b>${esc(g.nombre)}</b>, de ${esc(g.firma)}.</p><p style="margin-top:6px">«${esc(g.mensaje)}»</p>`) + `<button class="btn ancho" id="rc-entregar">Entregar por su nombre</button>`;
          $("#rc-entregar").addEventListener("click", () => { g.usado = fechaLarga(t); descontar(g.producto, 1, t); guardar(); res.innerHTML = caja("confeti", "magenta", `¡${esc(g.nombre)}, esto te lo mandó ${esc(g.firma)}!`, "<p>Entregado. El inventario ya descontó el producto.</p>"); });
        }
      } else if (k || b) {
        const x = k || b;
        if (x.usado) res.innerHTML = caja("alerta", "oro", "Ya se usó", "");
        else { res.innerHTML = caja("checkCirculo", "verde", "Código válido", `<p>${k ? "Tinto gratis del Club Colibrí." : `Bolsa del final del día: ${x.items.map(esc).join(" y ")}.`}</p>`) + `<button class="btn ancho" id="rc-entregar">Entregar</button>`; $("#rc-entregar").addEventListener("click", () => { x.usado = true; guardar(); res.innerHTML = caja("confeti", "magenta", "¡Entregado!", ""); }); }
      } else res.innerHTML = caja("info", "cian", "No encontramos ese código", "<p>En este prototipo los códigos viven en el celular donde se crearon. En la barra real, la caja los valida en línea.</p>");
    };
    $("#rc-validar").addEventListener("click", validar);
    $("#rc-cod").addEventListener("keydown", (e) => { if (e.key === "Enter") validar(); });
    if (cod) validar();
  },
  puntos: () => {
    $("#usar-puntos")?.addEventListener("click", () => {
      D.usarPuntos = true; guardar();
      aviso(`Tus ${D.puntos} puntos (${fmt(D.puntos)}) se descuentan al pagar tu pedido`);
      ir(Object.keys(D.carrito).length ? "pedir" : "carta");
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
  // fechas de prueba: un martes hábil, un domingo y el festivo del 8 de diciembre (cambian tu cumpleaños de prueba)
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
  const i = h.indexOf("=");
  return i < 0 ? { n: h || "inicio", p: null } : { n: h.slice(0, i), p: h.slice(i + 1) || null };
}
addEventListener("hashchange", () => { const r = rutaInicial(); if (r.n !== actual || r.p !== param) ir(r.n, r.p, { historia: false }); });
const r0 = rutaInicial();
ir(r0.n, r0.p);
if (D.perfil) setTimeout(revisarCumple, 600);
