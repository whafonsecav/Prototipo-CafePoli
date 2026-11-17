// Simulación de la app de Café Poli dentro de un celular.
// Dos modos: «libre» (la persona toca y Poligreca narra cada pantalla) y «guiado» (el recorrido maneja la app paso a paso
// con un guion por paso; Siguiente y Atrás del recorrido siempre funcionan y cada paso deja la app en un estado fijo).
import { CARTA, DESCUENTO_TERMO, DETALLE_REGALO, fmt } from "./datos.js";

const capa = document.getElementById("telefono-capa");
const pant = document.getElementById("telefono-pantalla");
const btnCerrar = document.getElementById("telefono-cerrar");
const aviso = document.getElementById("tel-aviso");

const TODOS = CARTA.flatMap((c) => c.items);
const porId = (id) => TODOS.find((p) => p.id === id) || { id, nombre: id, precio: 0 };
const tamanos = (p) => (Array.isArray(p.tamanos) && p.tamanos.length ? p.tamanos : null);
const precioDe = (p, oz) => { const t = tamanos(p); if (!t || !oz) return p.precio; const s = t.find((x) => String(x.oz) === String(oz)); return s ? s.precio : p.precio; };
const nombreCorto = (p) => p.nombre.split(":")[0].replace(/ \(.*\)/, "");

const ESTADO0 = () => ({
  usuario: "Andrés",
  puntos: 1720,
  carrito: {},
  conVaso: false,
  hora: "En el descanso (8:20 p. m.)",
  pago: "Nequi",
  regalo: {
    para: "Alguien especial", producto: "latte", tarjeta: true, nombre: "Mary",
    cel: "Mary ❤ · de tus contactos", mensaje: "Para que mañana arranques con todo. Esta pausa va por mí. ¿Nos vemos en Modo Conexión?", firma: "Andrés",
  },
  historial: [["La pausa", 60], ["Capuchino", 80], ["Tinto", 40], ["Combo Parcial", 120]],
  ultimoCodigo: "CP-7KQ4",
  ultimoPedido: { codigo: "A47", hora: "En el descanso (8:20 p. m.)", puntos: 140 },
  bolsa: { quedan: 6, codigo: "BF-218" },
  relojFijo: null,
});
let estado = ESTADO0();

let alCerrar = null;
let narrador = null;
let guiado = false;
export function alNarrar(fn) { narrador = fn; }
// Narración del modo libre (en el recorrido guiado habla el paso, no la pantalla).
const NARRA = {
  inicio: ["La app de Café Poli", "Desde aquí pides y recoges sin fila, regalas un Café Poli, ves tus Puntos Colibrí y lo que te ahorras si traes tu propio vaso."],
  menu: ["La carta en tu celular", "La misma carta de la barra, por mundos de color y por tamaño en onzas. Si la bebida aplica, ves cuánto vale con tu vaso."],
  pedido: ["Elige la hora y paga", "Escoges cuándo recoger, por ejemplo en el descanso, y pagas con Nequi, Daviplata, Bre-B o tarjeta. El pedido entra directo a la caja y al inventario."],
  pagado: ["¡Listo!", "La barra prepara tu pedido a tiempo y te lo entregan por tu nombre. Además sumaste Puntos Colibrí."],
  regalo: ["Regala un Café Poli", "Eliges para quién es, qué le das y escribes tu mensaje. Lo firmas tú: aquí no hay regalos anónimos."],
  regaloListo: ["El código del regalo", "Se crea un código único que vale treinta días. Ahora lo mandas por WhatsApp."],
  whatsapp: ["Así le llega", "Le llega por WhatsApp con tu mensaje, tu firma y el código para reclamarlo."],
  reclamar: ["Así lo reclama", "Muestra el código en la barra, el barista lo valida y se lo entrega por su nombre, con la tarjeta impresa de tu mensaje."],
  puntos: ["Tus Puntos Colibrí", "Sumas veinte puntos por cada mil pesos, y cada punto vale un peso: con ellos pagas todo o una parte de lo que quieras. Y el día de tu cumpleaños, con tu compra, la galleta del colibrí va por nuestra cuenta."],
  vaso: ["Trae tu propio vaso", "Si traes tu vaso o tu termo, la bebida preparada vale trescientos pesos menos, en cualquier tamaño."],
  cumple: ["Feliz cumpleaños", "Como te registraste con tu correo del Poli, el día de tu cumpleaños la app te felicita y te invita a pasar por la galleta del colibrí, si es día hábil."],
  bolsa: ["La bolsa del final del día", "Desde las ocho y media de la noche, la app te avisa: dos productos del día por tres mil pesos. La reservas, la pagas y la recoges con tu código antes del cierre."],
};

export function telefonoAbierto() { return !capa.classList.contains("oculto"); }
export function telefonoGuiado() { return telefonoAbierto() && guiado; }
export function abrirTelefono(pantalla = "inicio", { guiado: g = false, alCerrar: cb = null } = {}) {
  cancelarGuion();
  guiado = g;
  alCerrar = cb;
  capa.classList.toggle("guiado", guiado);
  capa.classList.remove("oculto");
  if (!guiado) { estado.relojFijo = null; }
  actualizarHora();
  ir(pantalla === "termo" ? "vaso" : pantalla, { narrar: !guiado });
}
export function cerrarTelefono({ avisar = false } = {}) {
  cancelarGuion();
  ocultarAviso();
  capa.classList.add("oculto");
  capa.classList.remove("guiado");
  guiado = false;
  const cb = alCerrar; alCerrar = null;
  if (avisar && cb) cb();
}
btnCerrar.addEventListener("click", () => cerrarTelefono({ avisar: true }));
capa.addEventListener("click", (e) => { if (e.target === capa && !guiado) cerrarTelefono({ avisar: true }); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && telefonoAbierto() && !guiado) cerrarTelefono({ avisar: true }); });

function actualizarHora() {
  const t = estado.relojFijo || new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
  document.getElementById("tel-hora").textContent = t;
}

// ------------------------------------------------------------------ guiones del recorrido guiado
let guionGen = 0;
export function cancelarGuion() { guionGen++; pant.querySelectorAll(".toque, .resalta").forEach((e) => e.classList.remove("toque", "resalta")); }
const pausa = (ms, g) => new Promise((ok, mal) => setTimeout(() => (g === guionGen && telefonoAbierto() ? ok() : mal(new Error("cancelado"))), ms));
function tocar(sel) {
  const el = typeof sel === "string" ? pant.querySelector(sel) : sel;
  if (!el) return null;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.classList.remove("toque"); void el.offsetWidth; el.classList.add("toque");
  return el;
}
function resaltar(sel, si = true) {
  const el = typeof sel === "string" ? pant.querySelector(sel) : sel;
  if (el) { el.classList.toggle("resalta", si); if (si) el.scrollIntoView({ block: "center", behavior: "smooth" }); }
  return el;
}
async function escribir(sel, texto, g, vel = 34) {
  const el = pant.querySelector(sel);
  if (!el) return;
  el.value = "";
  for (const c of texto) { el.value += c; el.dispatchEvent(new Event("input")); await pausa(vel, g); }
}
async function desplazarA(sel, g) {
  const el = pant.querySelector(sel);
  if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  await pausa(650, g);
}
function mostrarAviso(html, alTocar) {
  aviso.innerHTML = html;
  aviso.classList.remove("oculto");
  void aviso.offsetWidth;
  aviso.classList.add("visible");
  aviso.onclick = alTocar || null;
}
function ocultarAviso() { aviso.classList.remove("visible"); aviso.classList.add("oculto"); aviso.onclick = null; }

const PRESETS = {
  pedidoListo: () => { estado.carrito = { "capu@12": 1, pan: 1 }; estado.conVaso = true; estado.hora = "En el descanso (8:20 p. m.)"; estado.pago = "Nequi"; },
};

// Cada guion arranca desde un estado fijo: así Atrás y Siguiente siempre muestran lo mismo.
const GUIONES = {
  async inicio(g) {
    estado = ESTADO0(); estado.relojFijo = "8:02 p. m."; actualizarHora();
    ir("inicio");
    await pausa(5200, g);
    for (const s of ['[data-ir="menu"]', '[data-ir="regalo"]', '[data-ir="puntos"]', '[data-ir="vaso"]']) {
      resaltar(s); await pausa(1700, g); resaltar(s, false);
    }
    resaltar(".tarjeta-puntos");
  },
  async pedir(g) {
    estado = ESTADO0(); estado.relojFijo = "8:03 p. m."; actualizarHora();
    ir("inicio"); await pausa(900, g);
    tocar('[data-ir="menu"]'); await pausa(500, g);
    ir("menu"); await pausa(4200, g);
    await desplazarA('[data-prod="capu"]', g); resaltar('[data-prod="capu"]'); await pausa(2600, g);
    const chip = pant.querySelector('[data-add="capu"][data-oz="12"]') || pant.querySelector('[data-add="capu"]');
    tocar(chip); await pausa(450, g); chip?.click(); await pausa(1500, g);
    await desplazarA('[data-prod="pan"]', g); resaltar('[data-prod="pan"]'); await pausa(1800, g);
    const mas = pant.querySelector('[data-add="pan"]'); tocar(mas); await pausa(450, g); mas?.click(); await pausa(900, g);
    resaltar(".carrito-flotante .btn");
  },
  async pagar(g) {
    estado = ESTADO0(); estado.relojFijo = "8:04 p. m."; actualizarHora();
    PRESETS.pedidoListo(); estado.conVaso = false; estado.hora = "Ahora (10 min)"; estado.pago = "Tarjeta";
    ir("pedido"); await pausa(3800, g);
    tocar('[data-hora="En el descanso (8:20 p. m.)"]'); await pausa(400, g); pant.querySelector('[data-hora="En el descanso (8:20 p. m.)"]')?.click(); await pausa(2600, g);
    const chk = pant.querySelector("#chk-vaso"); if (chk) { tocar(chk.closest(".interruptor")); await pausa(400, g); chk.click(); } await pausa(3000, g);
    tocar('[data-pago="Nequi"]'); await pausa(400, g); pant.querySelector('[data-pago="Nequi"]')?.click(); await pausa(3200, g);
    tocar("#btn-pagar"); await pausa(400, g); pant.querySelector("#btn-pagar")?.click();
  },
  async listo(g) {
    estado = ESTADO0(); estado.relojFijo = "8:04 p. m."; actualizarHora();
    estado.ultimoPedido = { codigo: "A47", hora: "En el descanso (8:20 p. m.)", puntos: 140, lineas: ["1 × Capuchino 12 oz", "1 × Pan de bono"] }; estado.puntos = 1860;
    ir("pagado"); await pausa(3500, g);
    resaltar(".tarjeta-pedido"); await pausa(5000, g); resaltar(".tarjeta-pedido", false);
    resaltar(".tarjeta-sumaste");
  },
  async regalo1(g) {
    estado = ESTADO0(); estado.relojFijo = "9:12 p. m."; actualizarHora();
    ir("inicio"); await pausa(3800, g);
    resaltar('[data-ir="regalo"]'); await pausa(1800, g);
    tocar('[data-ir="regalo"]'); await pausa(500, g);
    estado.regalo.mensaje = "";
    ir("regalo");
  },
  async regalo2(g) {
    estado = ESTADO0(); estado.relojFijo = "9:13 p. m."; actualizarHora();
    estado.regalo.mensaje = "";
    ir("regalo"); await pausa(1800, g);
    tocar('[data-para="Alguien especial"]'); await pausa(2600, g);
    resaltar("#reg-prod"); await pausa(2600, g); resaltar("#reg-prod", false);
    resaltar("#reg-tarjeta-fila"); await pausa(2400, g); resaltar("#reg-tarjeta-fila", false);
    resaltar("#reg-cel"); await pausa(1800, g); resaltar("#reg-cel", false);
    await desplazarA("#reg-msj", g);
    await escribir("#reg-msj", "Para que mañana arranques con todo. Esta pausa va por mí. ¿Nos vemos en Modo Conexión?", g);
    await pausa(500, g); resaltar("#reg-firma");
  },
  async regalo3(g) {
    estado = ESTADO0(); estado.relojFijo = "9:14 p. m."; actualizarHora();
    ir("regalo"); await pausa(1200, g);
    await desplazarA("#btn-regalar", g);
    tocar("#btn-regalar"); await pausa(400, g); pant.querySelector("#btn-regalar")?.click();
    await pausa(2600, g);
    resaltar(".tarjeta-regalo");
  },
  async regalo4(g) {
    estado = ESTADO0(); estado.relojFijo = "9:15 p. m."; actualizarHora();
    ir("regaloListo"); await pausa(1800, g);
    tocar("#btn-wa"); await pausa(500, g);
    ir("whatsapp");
  },
  async regalo5(g) {
    estado = ESTADO0(); estado.relojFijo = "10:02 a. m."; actualizarHora();
    ir("reclamar"); await pausa(2200, g);
    for (const s of ["#paso-r1", "#paso-r2", "#paso-r3"]) { resaltar(s); await pausa(3600, g); resaltar(s, false); }
  },
  async puntos(g) {
    estado = ESTADO0(); estado.relojFijo = "6:40 p. m."; actualizarHora(); estado.puntos = 2080;
    ir("puntos"); await pausa(4200, g);
    resaltar(".puntos-grande"); await pausa(3600, g); resaltar(".puntos-grande", false);
    tocar("#btn-usar-puntos"); await pausa(400, g); pant.querySelector("#btn-usar-puntos")?.click(); await pausa(3200, g);
    resaltar(".tarjeta-cumple");
  },
  async cumple(g) {
    estado = ESTADO0(); estado.relojFijo = "10:05 a. m."; actualizarHora();
    ir("inicio"); await pausa(1800, g);
    mostrarAviso(`<img src="assets/isotipo.svg" alt=""><div><b>Café Poli · ahora</b><span>🎂 ¡Feliz cumpleaños, ${estado.usuario}! Hoy la galleta del colibrí va por nuestra cuenta.</span></div>`, () => { ocultarAviso(); ir("cumple"); });
    await pausa(4200, g);
    tocar(aviso); await pausa(500, g);
    ocultarAviso(); ir("cumple"); await pausa(5200, g);
    resaltar(".cumple-reglas");
  },
  async vaso(g) {
    estado = ESTADO0(); estado.relojFijo = "7:05 a. m."; actualizarHora();
    ir("vaso"); await pausa(3000, g);
    resaltar(".tabla-vaso"); await pausa(6500, g); resaltar(".tabla-vaso", false);
    resaltar(".tarjeta-suerte"); await pausa(3800, g); resaltar(".tarjeta-suerte", false);
    resaltar(".tarjeta-tienda");
  },
  async bolsa1(g) {
    estado = ESTADO0(); estado.relojFijo = "8:30 p. m."; actualizarHora();
    ir("inicio"); await pausa(2600, g);
    mostrarAviso(`<img src="assets/isotipo.svg" alt=""><div><b>Café Poli · ahora</b><span>🛍️ Ya está la bolsa del final del día: 2 productos del día por $3.000. Quedan ${estado.bolsa.quedan}.</span></div>`, () => { ocultarAviso(); ir("bolsa"); });
    await pausa(6200, g);
    tocar(aviso); await pausa(500, g);
    ocultarAviso(); ir("bolsa"); await pausa(1500, g);
    resaltar(".bolsa-contenido");
  },
  async bolsa2(g) {
    estado = ESTADO0(); estado.relojFijo = "8:31 p. m."; actualizarHora();
    ir("bolsa"); await pausa(1500, g);
    await desplazarA("#btn-bolsa", g);
    tocar("#btn-bolsa"); await pausa(400, g); pant.querySelector("#btn-bolsa")?.click();
    await pausa(2400, g);
    resaltar(".codigo"); await pausa(4200, g); resaltar(".codigo", false);
    resaltar(".tarjeta-dona");
  },
};
export async function guionApp(nombre) {
  cancelarGuion();
  ocultarAviso();
  const g = guionGen;
  const f = GUIONES[nombre];
  if (!f) { ir(nombre, { narrar: false }); return; }
  try { await f(g); } catch (e) { /* guion interrumpido por Siguiente o Atrás */ }
}

// ------------------------------------------------------------------ navegación de pantallas
function ir(nombre, { narrar = !guiado } = {}) {
  const p = PANTALLAS[nombre] || PANTALLAS.inicio;
  pant.innerHTML = p();
  pant.scrollTop = 0;
  pant.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => { if (!guiado) ir(b.dataset.ir); }));
  if (narrar && narrador && NARRA[nombre]) narrador(NARRA[nombre][0], NARRA[nombre][1]);
  const enlazar = ENLACES[nombre];
  if (enlazar) enlazar();
}

const FOTO = {
  tinto: "☕", campesino: "☕", leche: "☕", capu: "☕", latte: "🥛", frio: "🧊",
  parcial: "⚡", espresso: "☕", cparcial: "⚡",
  teNegro: "🫖", teVerde: "🍵", frutos: "🍒", chai: "🧋", cata: "🫖", milo: "🍫", miloFrio: "🧋",
  aroma: "🌿", panela: "🍋", choco: "🍫", avena: "🌾", jugo: "🍊",
  pan: "🥯", panyuca: "🥖", bunuelo: "🧆", almojabana: "🍞", arepa: "🫓", boyacense: "🌽", arepahuevo: "🥚", empanada: "🥟", sandwich: "🥪",
  tortica: "🧁", zanahoria: "🥕", cheesecake: "🍰", brownie: "🍪", galletas: "🍪", postre2: "💞", fruta: "🍓",
  pausa: "☕", desayuno: "🍳", tardecata: "🫖", vaso: "🥤", termo: "🧉",
};
const foto = (id) => FOTO[id] || (/^te|infus|tisana/i.test(id) ? "🍵" : "☕");
// foto real del producto (la misma de la app web); si faltara, queda la tarjeta de color
const fotoProducto = (id) => `<div class="foto foto-real"><img src="app/img/carta/${id}.jpg" alt="" loading="lazy" onerror="this.parentNode.classList.add('sin-foto');this.remove()"></div>`;
const nav = (activo) => `
  <nav class="nav-app">
    ${[["inicio", "🏠", "Inicio"], ["menu", "☕", "Pedir"], ["regalo", "🎁", "Regalar"], ["puntos", "⭐", "Puntos"]].map(([id, ic, t]) => `<button data-ir="${id}" class="${id === activo ? "activo" : ""}"><span>${ic}</span>${t}</button>`).join("")}
  </nav>`;
const cab = (titulo, sub, volver = "inicio") => `
  <div class="app-cab">
    <div class="fila">
      ${volver ? `<button class="app-volver" data-ir="${volver}">← Volver</button>` : `<img src="assets/logo-blanco.svg" alt="Café Poli" onerror="this.outerHTML='<strong>Café Poli</strong>'">`}
      <small>City Campus · piso 2</small>
    </div>
    <h3>${titulo}</h3>
    ${sub ? `<small>${sub}</small>` : ""}
  </div>`;

const claveItem = (id, oz) => (oz ? `${id}@${oz}` : id);
const partirClave = (k) => { const [id, oz] = k.split("@"); return { id, oz: oz || null }; };
const cantidadCarrito = () => Object.values(estado.carrito).reduce((a, b) => a + b, 0);
function totalCarrito() {
  let total = 0, bebidas = 0;
  for (const [k, n] of Object.entries(estado.carrito)) {
    const { id, oz } = partirClave(k);
    const p = porId(id);
    total += precioDe(p, oz) * n;
    if (p.termo) bebidas += n;
  }
  const desc = estado.conVaso ? Math.min(bebidas, 1) * DESCUENTO_TERMO : 0;
  return { subtotal: total, desc, total: total - desc, bebidas };
}
function lineaProducto(p) {
  const t = tamanos(p);
  const cant = (k) => (estado.carrito[k] ? `<b class="cant">${estado.carrito[k]}</b>` : "");
  if (t) {
    return `
      <div class="producto" data-prod="${p.id}">
        ${fotoProducto(p.id)}
        <div style="flex:1;min-width:0">
          <div class="nombre">${p.nombre.replace(/ \(\d+\s?oz\)/, "")}</div>
          ${p.nota ? `<div class="termo">${p.nota}</div>` : ""}
          <div class="tamanos">${t.map((s) => `<button class="tam" data-add="${p.id}" data-oz="${s.oz}"><span>${s.oz} oz</span><b>${fmt(s.precio)}</b>${cant(claveItem(p.id, s.oz))}</button>`).join("")}</div>
          ${p.termo ? `<div class="termo">Con tu vaso: −${fmt(DESCUENTO_TERMO)} en cualquier tamaño</div>` : ""}
        </div>
      </div>`;
  }
  return `
    <div class="producto" data-prod="${p.id}">
      ${fotoProducto(p.id)}
      <div style="flex:1;min-width:0">
        <div class="nombre">${p.nombre}</div>
        <div class="precio">${fmt(p.precio)}</div>
        ${p.termo ? `<div class="termo">Con tu vaso: ${fmt(p.precio - DESCUENTO_TERMO)}</div>` : ""}
        ${p.nota ? `<div class="termo">${p.nota}</div>` : ""}
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        ${cant(p.id)}
        <button class="mas" data-add="${p.id}" aria-label="Agregar ${p.nombre}">+</button>
      </div>
    </div>`;
}

const PANTALLAS = {
  inicio: () => `
    <div class="app">
      ${cab(`Hola, ${estado.usuario}`, "Somos origen. Somos país. Somos Poli.", null)}
      <div class="app-cuerpo">
        <div class="tarjeta tarjeta-puntos">
          <h4>⭐ ${estado.puntos} Puntos Colibrí</h4>
          <p>Valen ${fmt(estado.puntos)}: úsalos para pagar todo o parte de lo que pidas.</p>
        </div>
        <div class="botones-inicio">
          <button class="boton-grande bg-magenta" data-ir="menu"><span>☕</span>Pedir y recoger sin fila</button>
          <button class="boton-grande bg-navy" data-ir="regalo"><span>🎁</span>Regalar un Café Poli</button>
          <button class="boton-grande bg-oro" data-ir="puntos"><span>⭐</span>Mis Puntos Colibrí</button>
          <button class="boton-grande bg-cian" data-ir="vaso"><span>♻️</span>Trae tu vaso: −${fmt(DESCUENTO_TERMO)}</button>
        </div>
        <div class="tarjeta"><h4>Semana de parciales</h4><p>Llegó el Café Parcial: doble carga de café de origen con panela y canela. Unos 125 mg de cafeína, uno por persona.</p></div>
        <div class="tarjeta"><h4>🛍️ Bolsa del final del día</h4><p>Desde las 8:30 p. m. te avisamos si hay bolsa: dos productos del día por ${fmt(3000)}.</p></div>
      </div>
      ${nav("inicio")}
    </div>`,

  menu: () => {
    const n = cantidadCarrito();
    const t = totalCarrito();
    return `
    <div class="app">
      ${cab("Pide y recoge", "Paga aquí y recoge sin hacer fila")}
      <div class="app-cuerpo">
        ${CARTA.map((c) => `
          <div class="categoria categoria-color" style="--cat:${c.color || "#0F385A"}">${c.cat}${c.lema ? `<small>${c.lema}</small>` : ""}</div>
          ${c.items.map(lineaProducto).join("")}
          ${c.nota ? `<p class="nota-cat">${c.nota}</p>` : ""}`).join("")}
      </div>
      <div class="carrito-flotante">
        <button class="btn btn-principal" data-ir="pedido" ${n ? "" : "disabled"}>Ver pedido (${n}) · ${fmt(t.total)}</button>
      </div>
    </div>`;
  },

  pedido: () => {
    const t = totalCarrito();
    const lineas = Object.entries(estado.carrito).map(([k, n]) => {
      const { id, oz } = partirClave(k);
      const p = porId(id);
      return `<div class="linea"><span>${n} × ${nombreCorto(p)}${oz ? ` ${oz} oz` : ""}</span><span>${fmt(precioDe(p, oz) * n)}</span></div>`;
    }).join("");
    const opt = (grupo, valor, actual) => `<button class="opcion ${valor === actual ? "activa" : ""}" data-${grupo}="${valor}">${valor}</button>`;
    return `
    <div class="app">
      ${cab("Tu pedido", "Revisa, elige la hora y paga", "menu")}
      <div class="app-cuerpo">
        <div class="tarjeta">${lineas || "<p>Tu pedido está vacío.</p>"}
          ${t.desc ? `<div class="linea"><span>Descuento por traer tu vaso</span><span>−${fmt(t.desc)}</span></div>` : ""}
          <div class="linea total"><span>Total</span><span>${fmt(t.total)}</span></div>
        </div>
        <div class="categoria">¿Cuándo lo recoges?</div>
        <div class="opciones">${["Ahora (10 min)", "En el descanso (8:20 p. m.)", "Al salir (9:30 p. m.)"].map((v) => opt("hora", v, estado.hora)).join("")}</div>
        ${t.bebidas ? `<label class="interruptor"><span>♻️ Traigo mi vaso (−${fmt(DESCUENTO_TERMO)})</span><input type="checkbox" id="chk-vaso" ${estado.conVaso ? "checked" : ""}></label>` : ""}
        <div class="categoria">¿Cómo pagas?</div>
        <div class="opciones">${["Nequi", "Daviplata", "Bre-B", "Tarjeta"].map((v) => opt("pago", v, estado.pago)).join("")}</div>
        <button class="btn btn-principal" id="btn-pagar" style="width:100%" ${t.total ? "" : "disabled"}>Pagar ${fmt(t.total)}</button>
        <p class="nota-sim">Simulación: no se cobra nada.</p>
      </div>
    </div>`;
  },

  pagado: () => {
    const p = estado.ultimoPedido;
    return `
    <div class="app">
      ${cab("¡Pedido pagado!", "", null)}
      <div class="app-cuerpo exito">
        <div class="grande">✅</div>
        <div class="tarjeta tarjeta-pedido"><h4>Pedido ${p.codigo}</h4>${(p.lineas || []).map((l) => `<p>${l}</p>`).join("")}<p>Recógelo ${p.hora.toLowerCase()} en la barra. La pantalla de pedidos te avisa y el barista te llama: «¡${estado.usuario}!».</p></div>
        <div class="tarjeta tarjeta-sumaste"><h4>+${p.puntos} Puntos Colibrí</h4><p>Ahora tienes ${estado.puntos} puntos, que valen ${fmt(estado.puntos)} para tu próxima compra.</p></div>
        <button class="btn btn-principal" data-ir="inicio" style="width:100%">Volver al inicio</button>
      </div>
    </div>`;
  },

  regalo: () => {
    const r = estado.regalo;
    const opciones = ["capu", "latte", "cparcial", "desayuno", "pausa"].map(porId);
    const prod = porId(r.producto);
    const total = prod.precio + (r.tarjeta ? DETALLE_REGALO.precio : 0);
    return `
    <div class="app">
      ${cab("Regala un Café Poli", "Tú escribes y firmas el mensaje")}
      <div class="app-cuerpo">
        <div class="categoria">¿Para quién es?</div>
        <div class="opciones">${["Alguien especial", "Un amigo", "Mi hijo o hija"].map((v) => `<button class="opcion ${v === r.para ? "activa" : ""}" data-para="${v}">${v}</button>`).join("")}</div>
        <label class="campo"><span>¿Qué le regalas?</span>
          <select id="reg-prod">${opciones.map((p) => `<option value="${p.id}" ${p.id === r.producto ? "selected" : ""}>${nombreCorto(p)} · ${fmt(p.precio)}</option>`).join("")}</select>
        </label>
        <label class="interruptor" id="reg-tarjeta-fila"><span>💌 ${DETALLE_REGALO.nombre} (+${fmt(DETALLE_REGALO.precio)})</span><input type="checkbox" id="reg-tarjeta" ${r.tarjeta ? "checked" : ""}></label>
        <label class="campo"><span>Nombre de quien recibe</span><input id="reg-nombre" value="${r.nombre}" maxlength="30"></label>
        <label class="campo"><span>Enviar por WhatsApp a</span><input id="reg-cel" value="${r.cel}" maxlength="40"></label>
        <label class="campo"><span>Tu mensaje (máximo 120 caracteres)</span><textarea id="reg-msj" maxlength="120">${r.mensaje}</textarea><div class="contador" id="reg-cont">${r.mensaje.length}/120</div></label>
        <label class="campo"><span>Firma</span><input id="reg-firma" value="${r.firma}" maxlength="24"></label>
        <div class="tarjeta"><div class="linea total" style="border:0;margin:0;padding:0"><span>Total</span><span id="reg-total">${fmt(total)}</span></div></div>
        <button class="btn btn-principal" id="btn-regalar" style="width:100%">Pagar y crear el código</button>
        <p class="nota-sim">Simulación: no se cobra ni se envía nada.</p>
      </div>
    </div>`;
  },

  regaloListo: () => {
    const r = estado.regalo;
    const prod = nombreCorto(porId(r.producto));
    return `
    <div class="app">
      ${cab("¡Tu regalo está listo!", "Así lo verá " + r.nombre, "regalo")}
      <div class="app-cuerpo">
        <div class="tarjeta-regalo">
          <div class="tr-cab"><img src="assets/logo-blanco.svg" alt="Café Poli" onerror="this.outerHTML='<b>Café Poli</b>'"><span>Regalo</span></div>
          <div class="tr-para">Para <b>${r.nombre}${r.para === "Alguien especial" ? " ❤" : ""}</b></div>
          <div class="tr-prod">${foto(r.producto)} ${prod}${r.tarjeta ? " + chocolatina" : ""}</div>
          <p class="tr-msj">“${r.mensaje}”</p>
          <div class="tr-firma">— ${r.firma}</div>
          <div class="tr-pie"><div><small>Código</small><div class="tr-codigo">${estado.ultimoCodigo}</div><small>Vale 30 días · City Campus, piso 2</small></div>${qrMini(estado.ultimoCodigo)}</div>
        </div>
        <button class="btn btn-principal" id="btn-wa" data-ir="whatsapp" style="width:100%;background:#25D366;box-shadow:none;margin-top:12px">Enviar por WhatsApp a ${r.nombre}${r.para === "Alguien especial" ? " ❤" : ""}</button>
      </div>
    </div>`;
  },

  whatsapp: () => {
    const r = estado.regalo;
    const prod = nombreCorto(porId(r.producto));
    const contacto = r.nombre + (r.para === "Alguien especial" ? " ❤" : "");
    const hora = estado.relojFijo || new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
    return `
    <div class="wa">
      <div class="wa-cab"><button class="app-volver" data-ir="regaloListo">←</button><div class="ava">${r.para === "Alguien especial" ? "❤" : r.nombre.charAt(0)}</div><div><strong>${contacto}</strong><small id="wa-estado">en línea</small></div></div>
      <div class="wa-chat" id="wa-chat">
        <div class="wa-nota">Simulación del mensaje que llega por WhatsApp</div>
        <div class="wa-msg con-tarjeta">
          <div class="wa-tarjeta"><b>🎁 Café Poli · Regalo</b><span>${foto(r.producto)} ${prod}</span><em>Para ${contacto}</em></div>
${r.firma} te regaló un ${prod} en Café Poli (City Campus, piso 2).
“${r.mensaje}”
Código: *${estado.ultimoCodigo}* · muéstralo en la barra. Vale 30 días.<time>${hora} ✓✓</time></div>
      </div>
      <div class="app-cuerpo" style="flex:0"><button class="btn btn-principal" id="btn-reclamar" data-ir="reclamar" style="width:100%">Ver cómo lo reclama</button></div>
    </div>`;
  },

  reclamar: () => {
    const r = estado.regalo;
    const prod = nombreCorto(porId(r.producto));
    return `
    <div class="app">
      ${cab("Así lo reclama", "En la barra, con una persona", "whatsapp")}
      <div class="app-cuerpo">
        <div class="tarjeta" id="paso-r1"><h4>1. Muestra el código</h4><p>${r.nombre} llega a la barra y muestra <b>${estado.ultimoCodigo}</b> en su celular.</p></div>
        <div class="tarjeta" id="paso-r2"><h4>2. El barista lo valida</h4><p>Lo lee en la caja; el sistema descuenta el ${prod} del inventario.</p></div>
        <div class="tarjeta" id="paso-r3"><h4>3. Se lo entregan por su nombre</h4><p>«¡${r.nombre}, esto te lo mandó ${r.firma}!»${r.tarjeta ? " Con la tarjeta impresa del mensaje." : ""}</p></div>
        <button class="btn btn-principal" data-ir="inicio" style="width:100%">Volver al inicio</button>
      </div>
    </div>`;
  },

  puntos: () => `
    <div class="app">
      ${cab("Club Colibrí", "Te inscribes con tu correo del Poli")}
      <div class="app-cuerpo">
        <div class="tarjeta puntos-grande" style="text-align:center">
          <div class="num-puntos">${estado.puntos}</div>
          <p>Puntos Colibrí</p>
          <p>Valen <b>${fmt(estado.puntos)}</b> · 1 punto = $1 · 20 puntos por cada $1.000</p>
        </div>
        <button class="btn btn-principal" id="btn-usar-puntos" style="width:100%" ${estado.puntos > 0 ? "" : "disabled"}>Usar mis puntos en el próximo pedido</button>
        <div id="canje"></div>
        <div class="categoria">Tus últimas compras</div>
        ${estado.historial.slice(-5).reverse().map(([n, p]) => `<div class="linea"><span>${n}</span><span>${p > 0 ? "+" : ""}${p}</span></div>`).join("")}
        <div class="tarjeta tarjeta-cumple" style="margin-top:12px"><h4>🎂 Tu cumpleaños</h4><p>Con tu permiso sales en la pantalla, y con tu compra de ese día te damos la galleta del colibrí.</p></div>
      </div>
    </div>`,

  vaso: () => {
    const ej = ["tinto", "capu", "latte", "chai", "milo"].map(porId).filter((p) => p.precio);
    const tams = (p) => tamanos(p) || [{ oz: (p.nombre.match(/(\d+)\s?oz/) || [])[1] || "", precio: p.precio }];
    return `
    <div class="app">
      ${cab("Trae tu propio vaso", "Tu vaso o tu termo, del tamaño que quieras")}
      <div class="app-cuerpo">
        <div class="tarjeta tabla-vaso">
          <h4>Pagas por onzas y ${fmt(DESCUENTO_TERMO)} menos</h4>
          ${ej.map((p) => `<div class="fila-vaso"><span>${nombreCorto(p)}</span><span class="tams-vaso">${tams(p).map((s) => `<i>${s.oz ? s.oz + " oz " : ""}<s>${fmt(s.precio)}</s> <b>${fmt(s.precio - DESCUENTO_TERMO)}</b></i>`).join("")}</span></div>`).join("")}
        </div>
        <div class="tarjeta tarjeta-tienda"><h4>¿No tienes vaso?</h4><p>En la Tienda Poli está el vaso reutilizable Café Poli en 8, 12 y 16 onzas, y el termo de acero. Se paga solo con el ahorro.</p></div>
        <button class="btn btn-principal" data-ir="menu" style="width:100%">Pedir con mi vaso</button>
      </div>
    </div>`;
  },

  cumple: () => `
    <div class="app">
      ${cab("¡Feliz cumpleaños!", "Hoy es tu día, " + estado.usuario)}
      <div class="app-cuerpo exito">
        <img src="assets/poligreca-celebra.svg" alt="Poligreca celebra" class="cumple-img">
        <div class="tarjeta"><h4>🎂 La galleta del colibrí va por nuestra cuenta</h4><p>Con tu compra de hoy, pásate por la barra y te la entregamos por tu nombre. Y si nos diste permiso, hoy sales en Poli TV.</p></div>
        <div class="tarjeta cumple-reglas"><h4>¿Cómo sabemos?</h4><p>Te registraste con tu correo del Poli y tu fecha de cumpleaños. Te felicitamos en días hábiles, de lunes a sábado; si cae domingo o festivo, ese día no abrimos.</p></div>
        <button class="btn btn-principal" data-ir="menu" style="width:100%">Pedir y reclamar mi galleta</button>
      </div>
    </div>`,

  bolsa: () => `
    <div class="app">
      ${cab("Bolsa del final del día", "Hoy, desde las 8:30 p. m.")}
      <div class="app-cuerpo">
        <div class="tarjeta bolsa-contenido">
          <h4>🛍️ 2 productos del día · ${fmt(3000)}</h4>
          <p>Lo que quedó hoy en la vitrina, recién horneado en la mañana: por ejemplo, un pan de bono y una porción de torta. En la carta valen más de ${fmt(6000)}.</p>
          <div class="bolsa-quedan"><b>${estado.bolsa.quedan}</b> bolsas disponibles hoy</div>
        </div>
        <div class="tarjeta"><h4>¿Cómo funciona?</h4><p>1. A las 8:30 p. m. la caja sabe qué sobró y la app avisa al Club Colibrí.<br>2. La reservas y la pagas aquí.<br>3. La recoges en la barra con tu código antes de las 9:30 p. m.</p></div>
        <button class="btn btn-principal" id="btn-bolsa" style="width:100%">Reservar y pagar ${fmt(3000)}</button>
        <div id="bolsa-ok"></div>
        <div class="tarjeta tarjeta-dona" style="margin-top:10px"><h4>💛 Lo que no se vende se dona</h4><p>Lo que nadie reserva antes del cierre se dona esa misma noche. Menos comida a la basura.</p></div>
        <p class="nota-sim">Simulación: no se cobra nada.</p>
      </div>
    </div>`,
};

const ENLACES = {
  menu: () => {
    pant.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
      const k = claveItem(b.dataset.add, b.dataset.oz);
      estado.carrito[k] = (estado.carrito[k] || 0) + 1;
      const top = pant.scrollTop;
      ir("menu", { narrar: false });
      pant.scrollTop = top;
      pant.querySelector(`[data-prod="${b.dataset.add}"]`)?.classList.add("resalta");
    }));
  },
  pedido: () => {
    const chk = document.getElementById("chk-vaso");
    if (chk) chk.addEventListener("change", () => { estado.conVaso = chk.checked; refrescar("pedido"); });
    pant.querySelectorAll("[data-hora]").forEach((b) => b.addEventListener("click", () => { estado.hora = b.dataset.hora; refrescar("pedido"); }));
    pant.querySelectorAll("[data-pago]").forEach((b) => b.addEventListener("click", () => { estado.pago = b.dataset.pago; refrescar("pedido"); }));
    const pagar = document.getElementById("btn-pagar");
    if (pagar) pagar.addEventListener("click", () => {
      pagar.disabled = true;
      pagar.innerHTML = `<span class="cargando"></span> Pagando con ${estado.pago}…`;
      setTimeout(() => {
        if (!telefonoAbierto()) return;
        const t = totalCarrito();
        const puntos = Math.floor(t.total / 1000) * 20;
        estado.puntos += puntos;
        const lineas = Object.entries(estado.carrito).map(([k, n]) => { const { id, oz } = partirClave(k); return `${n} × ${nombreCorto(porId(id))}${oz ? ` ${oz} oz` : ""}`; });
        estado.historial.push([lineas.map((l) => l.replace(/^\d+ × /, "")).join(", "), puntos]);
        estado.ultimoPedido = { codigo: "A" + (40 + Object.keys(estado.carrito).length * 7), hora: estado.hora, puntos, lineas };
        estado.carrito = {};
        estado.conVaso = false;
        ir("pagado", { narrar: !guiado });
      }, 1300);
    });
  },
  regalo: () => {
    const r = estado.regalo;
    const total = () => fmt(porId(r.producto).precio + (r.tarjeta ? DETALLE_REGALO.precio : 0));
    pant.querySelectorAll("[data-para]").forEach((b) => b.addEventListener("click", () => {
      r.para = b.dataset.para;
      if (r.para === "Mi hijo o hija") { r.producto = "desayuno"; r.nombre = "Sofía"; r.cel = "Sofía 🌻 · de tus contactos"; r.mensaje = "Para que desayunes rico antes de clase. Te queremos."; r.firma = "Mamá y papá"; }
      else if (r.para === "Un amigo") { r.producto = "pausa"; r.nombre = "Camilo"; r.cel = "Camilo · de tus contactos"; r.mensaje = "Gracias por pasarme los apuntes. Te debo una."; r.firma = "Andrés"; }
      else { const m = r.mensaje; Object.assign(r, ESTADO0().regalo); r.mensaje = guiado ? m : r.mensaje; }
      refrescar("regalo");
    }));
    const sel = document.getElementById("reg-prod");
    sel.addEventListener("change", () => { r.producto = sel.value; document.getElementById("reg-total").textContent = total(); });
    const tar = document.getElementById("reg-tarjeta");
    tar.addEventListener("change", () => { r.tarjeta = tar.checked; document.getElementById("reg-total").textContent = total(); });
    const msj = document.getElementById("reg-msj");
    msj.addEventListener("input", () => { r.mensaje = msj.value; document.getElementById("reg-cont").textContent = `${msj.value.length}/120`; });
    document.getElementById("reg-nombre").addEventListener("input", (e) => { r.nombre = e.target.value || "Valentina"; });
    document.getElementById("reg-cel").addEventListener("input", (e) => { r.cel = e.target.value; });
    document.getElementById("reg-firma").addEventListener("input", (e) => { r.firma = e.target.value || estado.usuario; });
    const btn = document.getElementById("btn-regalar");
    btn.addEventListener("click", () => {
      btn.disabled = true;
      btn.innerHTML = `<span class="cargando"></span> Pagando…`;
      setTimeout(() => {
        if (!telefonoAbierto()) return;
        const pts = Math.floor((porId(r.producto).precio + (r.tarjeta ? DETALLE_REGALO.precio : 0)) / 1000) * 20;
        estado.puntos += pts;
        estado.historial.push([`Regalo para ${r.nombre}`, pts]);
        ir("regaloListo", { narrar: !guiado });
      }, 1300);
    });
  },
  whatsapp: () => {
    const r = estado.regalo;
    const chat = document.getElementById("wa-chat");
    const est = document.getElementById("wa-estado");
    const hora = estado.relojFijo || new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
    const respuestas = r.para === "Alguien especial"
      ? [["recibido", "¡Ayyy, qué lindo! 😍 Me encantó el mensaje."], ["recibido", "Mañana lo reclamo en el descanso. ¿Me acompañas?"], ["enviado", "¡Claro! Nos vemos en Modo Conexión ☕"], ["recibido", "¡De una! 💛"]]
      : [["recibido", "¡Gracias! 🙌 Mañana lo reclamo."]];
    const g = guionGen;
    let t = 1600;
    respuestas.forEach(([tipo, texto]) => {
      if (tipo === "recibido") setTimeout(() => { if (g !== guionGen || !chat.isConnected) return; if (est) est.textContent = "escribiendo…"; chat.insertAdjacentHTML("beforeend", '<div class="wa-msg recibido escribiendo" id="wa-esc"><i></i><i></i><i></i></div>'); chat.parentElement.scrollTop = chat.parentElement.scrollHeight; }, t);
      t += tipo === "recibido" ? 1700 : 1100;
      setTimeout(() => {
        if (g !== guionGen || !chat.isConnected) return;
        document.getElementById("wa-esc")?.remove();
        if (est) est.textContent = "en línea";
        chat.insertAdjacentHTML("beforeend", `<div class="wa-msg ${tipo === "recibido" ? "recibido" : ""}">${texto}<time>${hora}${tipo === "enviado" ? " ✓✓" : ""}</time></div>`);
        chat.parentElement.scrollTop = chat.parentElement.scrollHeight;
      }, t);
      t += 700;
    });
  },
  puntos: () => {
    const b = document.getElementById("btn-usar-puntos");
    if (b && estado.puntos > 0) b.addEventListener("click", () => {
      document.getElementById("canje").innerHTML = `<div class="tarjeta exito"><h4>¡Listo!</h4><p>Tus ${estado.puntos} puntos (${fmt(estado.puntos)}) se descuentan al pagar tu próximo pedido: lo pagan todo o una parte.</p></div>`;
      b.disabled = true;
      b.textContent = "Puntos listos para tu pedido";
    });
  },
  bolsa: () => {
    const b = document.getElementById("btn-bolsa");
    b?.addEventListener("click", () => {
      b.disabled = true;
      b.innerHTML = `<span class="cargando"></span> Pagando con Nequi…`;
      setTimeout(() => {
        if (!telefonoAbierto()) return;
        estado.bolsa.quedan = Math.max(0, estado.bolsa.quedan - 1);
        b.textContent = "Bolsa reservada ✓";
        document.getElementById("bolsa-ok").innerHTML = `<div class="tarjeta exito"><h4>¡Es tuya!</h4><p>Recógela en la barra antes de las 9:30 p. m. con este código:</p><div class="codigo">${estado.bolsa.codigo}</div></div>`;
        const q = pant.querySelector(".bolsa-quedan b"); if (q) q.textContent = estado.bolsa.quedan;
      }, 1200);
    });
  },
};
function refrescar(nombre) { const top = pant.scrollTop; ir(nombre, { narrar: false }); pant.scrollTop = top; }

function qrMini(texto) {
  let h = 0; for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let celdas = "";
  for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) {
    const enOjo = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8);
    h = (h * 1103515245 + 12345) >>> 0;
    if (!enOjo && ((h >>> 16) & 1)) celdas += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  const ojo = (x, y) => `<rect x="${x}" y="${y}" width="4" height="4"/><rect x="${x + 0.6}" y="${y + 0.6}" width="2.8" height="2.8" fill="#fff"/><rect x="${x + 1.2}" y="${y + 1.2}" width="1.6" height="1.6"/>`;
  return `<svg class="tr-qr" viewBox="-1 -1 15 15"><rect x="-1" y="-1" width="15" height="15" fill="#fff"/><g fill="#0F385A">${celdas}${ojo(0, 0)}${ojo(9, 0)}${ojo(0, 9)}</g></svg>`;
}
