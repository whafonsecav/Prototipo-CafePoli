// Simulación de la app de Café Poli dentro de un celular.
import { CARTA, DESCUENTO_TERMO, DETALLE_REGALO, fmt } from "./datos.js";

const capa = document.getElementById("telefono-capa");
const pant = document.getElementById("telefono-pantalla");
const btnCerrar = document.getElementById("telefono-cerrar");

const TODOS = CARTA.flatMap((c) => c.items);
const porId = (id) => TODOS.find((p) => p.id === id);

const estado = {
  usuario: "Andrés",
  puntos: 86,
  carrito: {},
  conTermo: false,
  hora: "En el descanso (7:30 p. m.)",
  pago: "Nequi",
  regalo: {
    para: "Alguien especial", producto: "latte", tarjeta: true, nombre: "Mary",
    cel: "Mary ❤ · de tus contactos", mensaje: "Para que mañana arranques con todo. Esta pausa va por mí. ¿Nos vemos en Modo Conexión?", firma: "Andrés",
  },
  historial: [["La pausa", 3], ["Capuchino", 4], ["Tinto", 2], ["Combo Parcial", 6]],
  ultimoCodigo: null,
};

let alCerrar = null;
let narrador = null;
export function alNarrar(fn) { narrador = fn; }
const NARRA = {
  inicio: ["La app de Café Poli", "Desde aquí pides y recoges sin fila, regalas un Café Poli, ves tus Puntos Colibrí y lo que te ahorras con tu termo."],
  menu: ["La carta en tu celular", "Son los mismos precios de la barra. Si la bebida aplica, ves cuánto vale con tu termo. Toca el más para agregar."],
  pedido: ["Elige la hora y paga", "Escoges cuándo recoger, por ejemplo en el descanso, y pagas con Nequi, Daviplata, Bre-B o tarjeta. El pedido entra directo a la caja y al inventario."],
  pagado: ["¡Listo!", "La barra prepara tu pedido a tiempo y te lo entregan por tu nombre. Además sumaste Puntos Colibrí."],
  regalo: ["Regala un Café Poli", "Eliges para quién es, qué le das y escribes tu mensaje. Lo firmas tú: aquí no hay regalos anónimos."],
  regaloListo: ["El código del regalo", "Se crea un código único que vale treinta días. Ahora lo mandas por WhatsApp."],
  whatsapp: ["Así le llega", "Le llega por WhatsApp con tu mensaje, tu firma y el código para reclamarlo."],
  reclamar: ["Así lo reclama", "Muestra el código en la barra, el barista lo valida y se lo entrega por su nombre, con la tarjeta impresa de tu mensaje."],
  puntos: ["Tus Puntos Colibrí", "Un punto por cada mil pesos; con cien, el tinto es tuyo. Y el día de tu cumpleaños, con tu compra, la galleta del colibrí va por nuestra cuenta."],
  termo: ["Vale menos con tu termo", "Si traes tu termo o tu vaso, la bebida vale trescientos pesos menos, y una de cada diez veces te ganas un tinto."],
};
export function abrirTelefono(pantalla = "inicio", cerrarCb) {
  alCerrar = cerrarCb || null;
  capa.classList.remove("oculto");
  actualizarHora();
  if (pantalla === "demo") { demoRegalo(); return; }
  ir(pantalla);
}
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
// historia animada: alguien le regala un café a Mary ❤ desde la app
let demoActiva = 0;
let demoInicio = 0;
const pausa = (ms, id) => new Promise((ok, mal) => setTimeout(() => (id === demoActiva && telefonoAbierto() ? ok() : mal(new Error("cancelada"))), ms));
function tocar(sel) {
  const el = pant.querySelector(sel);
  if (el) { el.classList.add("toque"); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
  return el;
}
async function escribir(sel, texto, id, vel = 38) {
  const el = pant.querySelector(sel);
  if (!el) return;
  el.value = "";
  el.focus({ preventScroll: true });
  for (const c of texto) { el.value += c; el.dispatchEvent(new Event("input")); await pausa(vel, id); }
}
function enDemo() { return performance.now() - demoInicio < 30000 && demoInicio > 0; }
async function demoRegalo() {
  const id = ++demoActiva;
  demoInicio = performance.now();
  const r = estado.regalo;
  const contar = (t, x) => narrador && narrador(t, x);
  try {
    r.para = "Alguien especial"; r.producto = "latte"; r.tarjeta = true; r.nombre = "Mary"; r.cel = "Mary ❤ · de tus contactos"; r.firma = "Andrés";
    ir("inicio");
    contar("Un regalo para Mary ❤", "Andrés quiere sorprender a Mary antes de su parcial. Abre la app de Café Poli y toca Regalar.");
    await pausa(2600, id); tocar('[data-ir="regalo"]'); await pausa(700, id);
    ir("regalo");
    contar("Escoge y escribe", "Elige un latte de arequipe con la tarjeta impresa y la chocolatina, busca a Mary en sus contactos y escribe su propio mensaje.");
    await pausa(1500, id);
    await escribir("#reg-msj", "Para que mañana arranques con todo. Esta pausa va por mí. ¿Nos vemos en Modo Conexión?", id);
    await pausa(900, id);
    tocar("#btn-regalar"); await pausa(600, id);
    pant.querySelector("#btn-regalar")?.click();
    contar("Paga en segundos", "Paga con Nequi y la app crea un código único que vale treinta días.");
    await pausa(2200, id);
    contar("La tarjeta personalizada", "Así queda la tarjeta: para Mary, con el mensaje y la firma de Andrés, el producto y el código para reclamarlo.");
    await pausa(4200, id);
    tocar("#btn-wa"); await pausa(600, id);
    ir("whatsapp");
    contar("Llega por WhatsApp", "Mary recibe la tarjeta y el código por WhatsApp. Mira cómo responde.");
    await pausa(7000, id);
    tocar("#btn-reclamar"); await pausa(600, id);
    ir("reclamar");
    contar("Y lo reclama en la barra", "Al día siguiente Mary muestra el código, el barista lo valida y le entrega su latte por su nombre, con la tarjeta impresa del mensaje.");
  } catch (e) { /* demostración interrumpida */ }
  demoInicio = 0;
}
export function telefonoAbierto() { return !capa.classList.contains("oculto"); }
function cerrar() {
  capa.classList.add("oculto");
  if (alCerrar) alCerrar();
}
btnCerrar.addEventListener("click", cerrar);
capa.addEventListener("click", (e) => { if (e.target === capa) cerrar(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && telefonoAbierto()) cerrar(); });

function actualizarHora() {
  const d = new Date();
  document.getElementById("tel-hora").textContent = d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

function ir(nombre) {
  const p = PANTALLAS[nombre] || PANTALLAS.inicio;
  pant.innerHTML = p();
  pant.scrollTop = 0;
  pant.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => ir(b.dataset.ir)));
  if (narrador && NARRA[nombre] && !enDemo()) narrador(NARRA[nombre][0], NARRA[nombre][1]);
  const demo = pant.querySelector("#btn-demo");
  if (demo) demo.addEventListener("click", () => demoRegalo());
  const enlazar = ENLACES[nombre];
  if (enlazar) enlazar();
}

const FOTO = { tinto: "☕", leche: "☕", capu: "☕", latte: "🥛", parcial: "⚡", choco: "🍫", aroma: "🍵", panela: "🍋", frio: "🧊", jugo: "🥤", pan: "🥖", arepa: "🫓", empanada: "🥟", sandwich: "🥪", croissant: "🥐", brownie: "🍪", fruta: "🍓", pausa: "☕", desayuno: "🍳", cparcial: "⚡", vaso: "🥤", termo: "🧉" };
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

const cantidadCarrito = () => Object.values(estado.carrito).reduce((a, b) => a + b, 0);
function totalCarrito() {
  let total = 0, bebidas = 0;
  for (const [id, n] of Object.entries(estado.carrito)) {
    const p = porId(id);
    total += p.precio * n;
    if (p.termo) bebidas += n;
  }
  const desc = estado.conTermo ? Math.min(bebidas, 1) * DESCUENTO_TERMO : 0;
  return { subtotal: total, desc, total: total - desc, bebidas };
}

const PANTALLAS = {
  inicio: () => `
    <div class="app">
      ${cab(`Hola, ${estado.usuario}`, "Sabor colombiano, experiencia del mundo", null)}
      <div class="app-cuerpo">
        <div class="tarjeta">
          <h4>⭐ ${estado.puntos} Puntos Colibrí</h4>
          <div class="puntos-barra"><span style="width:${Math.min(100, estado.puntos)}%"></span></div>
          <p>${estado.puntos >= 100 ? "¡Ya tienes un tinto gratis para canjear!" : `Te faltan ${100 - estado.puntos} puntos para tu próximo tinto.`}</p>
        </div>
        <div class="botones-inicio">
          <button class="boton-grande bg-magenta" data-ir="menu"><span>☕</span>Pedir y recoger</button>
          <button class="boton-grande bg-navy" data-ir="regalo"><span>🎁</span>Regalar un Café Poli</button>
          <button class="boton-grande bg-oro" data-ir="puntos"><span>⭐</span>Mis puntos</button>
          <button class="boton-grande bg-cian" data-ir="termo"><span>♻️</span>Vale menos con tu termo</button>
        </div>
        <button class="btn btn-principal btn-demo" id="btn-demo">▶ Ver la historia: un regalo para Mary ❤</button>
        <div class="tarjeta"><h4>Semana de parciales</h4><p>Llegó el Café Parcial: doble carga de café de origen con panela y canela. Unos 125 mg de cafeína, uno por persona.</p></div>
        <div class="tarjeta"><h4>🎂 ¿Cumples años?</h4><p>Si nos das permiso, sales en la pantalla de Modo Conexión y con tu compra te damos la galleta del colibrí.</p></div>
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
          <div class="categoria">${c.cat}</div>
          ${c.items.map((p) => `
            <div class="producto">
              <div class="foto">${FOTO[p.id] || "☕"}</div>
              <div style="flex:1">
                <div class="nombre">${p.nombre}</div>
                <div class="precio">${fmt(p.precio)}</div>
                ${p.termo ? `<div class="termo">Con tu termo: ${fmt(p.precio - DESCUENTO_TERMO)}</div>` : ""}
                ${p.nota ? `<div class="termo">${p.nota}</div>` : ""}
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                ${estado.carrito[p.id] ? `<span class="cant">${estado.carrito[p.id]}</span>` : ""}
                <button class="mas" data-add="${p.id}" aria-label="Agregar ${p.nombre}">+</button>
              </div>
            </div>`).join("")}`).join("")}
      </div>
      <div class="carrito-flotante">
        <button class="btn btn-principal" data-ir="pedido" ${n ? "" : "disabled"}>Ver pedido (${n}) · ${fmt(t.total)}</button>
      </div>
    </div>`;
  },

  pedido: () => {
    const t = totalCarrito();
    const lineas = Object.entries(estado.carrito).map(([id, n]) => {
      const p = porId(id);
      return `<div class="linea"><span>${n} × ${p.nombre}</span><span>${fmt(p.precio * n)}</span></div>`;
    }).join("");
    const opt = (grupo, valor, actual) => `<button class="opcion ${valor === actual ? "activa" : ""}" data-${grupo}="${valor}">${valor}</button>`;
    return `
    <div class="app">
      ${cab("Tu pedido", "Revisa, elige la hora y paga", "menu")}
      <div class="app-cuerpo">
        <div class="tarjeta">${lineas || "<p>Tu pedido está vacío.</p>"}
          ${t.desc ? `<div class="linea"><span>Descuento por tu termo</span><span>−${fmt(t.desc)}</span></div>` : ""}
          <div class="linea total"><span>Total</span><span>${fmt(t.total)}</span></div>
        </div>
        ${t.bebidas ? `<label class="interruptor"><span>♻️ Traigo mi termo (−${fmt(DESCUENTO_TERMO)})</span><input type="checkbox" id="chk-termo" ${estado.conTermo ? "checked" : ""}></label>` : ""}
        <div class="categoria">¿Cuándo lo recoges?</div>
        <div class="opciones">${["Ahora (10 min)", "En el descanso (7:30 p. m.)", "Al salir (9:30 p. m.)"].map((v) => opt("hora", v, estado.hora)).join("")}</div>
        <div class="categoria">¿Cómo pagas?</div>
        <div class="opciones">${["Nequi", "Daviplata", "Bre-B", "Tarjeta"].map((v) => opt("pago", v, estado.pago)).join("")}</div>
        <button class="btn btn-principal" id="btn-pagar" style="width:100%" ${t.total ? "" : "disabled"}>Pagar ${fmt(t.total)}</button>
        <p style="font-size:.74rem;color:#5c6b7a;text-align:center;margin-top:8px">Simulación: no se cobra nada.</p>
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
        <div class="tarjeta"><h4>Pedido ${p.codigo}</h4><p>Recógelo ${p.hora.toLowerCase()} en la barra. La pantalla te avisa y el barista te llama: “¡${estado.usuario}!”.</p></div>
        <div class="tarjeta"><h4>+${p.puntos} Puntos Colibrí</h4><p>Ahora tienes ${estado.puntos} puntos. ${estado.puntos >= 100 ? "¡Ya puedes canjear un tinto!" : `Te faltan ${100 - estado.puntos} para un tinto.`}</p></div>
        <button class="btn btn-principal" data-ir="inicio" style="width:100%">Volver al inicio</button>
      </div>
    </div>`;
  },

  regalo: () => {
    const r = estado.regalo;
    const opciones = ["capu", "latte", "cparcial", "desayuno", "pausa"].map((id) => porId(id));
    const prod = porId(r.producto);
    const total = prod.precio + (r.tarjeta ? DETALLE_REGALO.precio : 0);
    return `
    <div class="app">
      ${cab("Regala un Café Poli", "Tú escribes y firmas el mensaje")}
      <div class="app-cuerpo">
        <div class="categoria">¿Para quién es?</div>
        <div class="opciones">${["Alguien especial", "Un amigo", "Mi hijo o hija"].map((v) => `<button class="opcion ${v === r.para ? "activa" : ""}" data-para="${v}">${v}</button>`).join("")}</div>
        <label class="campo"><span>¿Qué le regalas?</span>
          <select id="reg-prod">${opciones.map((p) => `<option value="${p.id}" ${p.id === r.producto ? "selected" : ""}>${p.nombre} · ${fmt(p.precio)}</option>`).join("")}</select>
        </label>
        <label class="interruptor"><span>💌 ${DETALLE_REGALO.nombre} (+${fmt(DETALLE_REGALO.precio)})</span><input type="checkbox" id="reg-tarjeta" ${r.tarjeta ? "checked" : ""}></label>
        <label class="campo"><span>Nombre de quien recibe</span><input id="reg-nombre" value="${r.nombre}" maxlength="30"></label>
        <label class="campo"><span>Enviar por WhatsApp a</span><input id="reg-cel" value="${r.cel}" maxlength="40"></label>
        <label class="campo"><span>Tu mensaje (máximo 120 caracteres)</span><textarea id="reg-msj" maxlength="120">${r.mensaje}</textarea><div class="contador" id="reg-cont">${r.mensaje.length}/120</div></label>
        <label class="campo"><span>Firma</span><input id="reg-firma" value="${r.firma}" maxlength="24"></label>
        <div class="tarjeta"><div class="linea total" style="border:0;margin:0;padding:0"><span>Total</span><span id="reg-total">${fmt(total)}</span></div></div>
        <button class="btn btn-principal" id="btn-regalar" style="width:100%">Pagar y crear el código</button>
        <p style="font-size:.74rem;color:#5c6b7a;text-align:center;margin-top:8px">Simulación: no se cobra ni se envía nada.</p>
      </div>
    </div>`;
  },

  regaloListo: () => {
    const r = estado.regalo;
    const prod = porId(r.producto).nombre.split(":")[0].split(" (")[0];
    return `
    <div class="app">
      ${cab("¡Tu regalo está listo!", "Así lo verá " + r.nombre, "regalo")}
      <div class="app-cuerpo">
        <div class="tarjeta-regalo">
          <div class="tr-cab"><img src="assets/logo-blanco.svg" alt="Café Poli" onerror="this.outerHTML='<b>Café Poli</b>'"><span>Regalo</span></div>
          <div class="tr-para">Para <b>${r.nombre}${r.para === "Alguien especial" ? " ❤" : ""}</b></div>
          <div class="tr-prod">${FOTO[r.producto] || "☕"} ${prod}${r.tarjeta ? " + chocolatina" : ""}</div>
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
    const prod = porId(r.producto).nombre.split(":")[0].split(" (")[0];
    const contacto = r.nombre + (r.para === "Alguien especial" ? " ❤" : "");
    const hora = new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
    return `
    <div class="wa">
      <div class="wa-cab"><button class="app-volver" data-ir="regaloListo">←</button><div class="ava">${r.para === "Alguien especial" ? "❤" : r.nombre.charAt(0)}</div><div><strong>${contacto}</strong><small id="wa-estado">en línea</small></div></div>
      <div class="wa-chat" id="wa-chat">
        <div class="wa-nota">Simulación del mensaje que llega por WhatsApp</div>
        <div class="wa-msg con-tarjeta">
          <div class="wa-tarjeta"><b>🎁 Café Poli · Regalo</b><span>${FOTO[r.producto] || "☕"} ${prod}</span><em>Para ${contacto}</em></div>
${r.firma} te regaló un ${prod} en Café Poli (City Campus, piso 2).
“${r.mensaje}”
Código: *${estado.ultimoCodigo}* · muéstralo en la barra. Vale 30 días.<time>${hora} ✓✓</time></div>
      </div>
      <div class="app-cuerpo" style="flex:0"><button class="btn btn-principal" id="btn-reclamar" data-ir="reclamar" style="width:100%">Ver cómo lo reclama</button></div>
    </div>`;
  },

  reclamar: () => {
    const r = estado.regalo;
    const prod = porId(r.producto).nombre.split(":")[0];
    return `
    <div class="app">
      ${cab("Así lo reclama", "En la barra, con una persona", "whatsapp")}
      <div class="app-cuerpo">
        <div class="tarjeta"><h4>1. Muestra el código</h4><p>${r.nombre} llega a la barra y muestra <b>${estado.ultimoCodigo}</b> en su celular.</p></div>
        <div class="tarjeta"><h4>2. El barista lo valida</h4><p>Lo lee en la caja; el sistema descuenta el ${prod} del inventario.</p></div>
        <div class="tarjeta"><h4>3. Se lo entregan por su nombre</h4><p>“¡${r.nombre}, esto te lo mandó ${r.firma}!”${r.tarjeta ? " Con la tarjeta impresa de tu mensaje." : ""}</p></div>
        <button class="btn btn-principal" data-ir="inicio" style="width:100%">Volver al inicio</button>
      </div>
    </div>`;
  },

  puntos: () => `
    <div class="app">
      ${cab("Club Colibrí", "Te inscribes con tu correo del Poli")}
      <div class="app-cuerpo">
        <div class="tarjeta" style="text-align:center">
          <div style="font-family:var(--f-titulo);font-size:2.6rem;color:var(--navy);line-height:1">${estado.puntos}</div>
          <p>Puntos Colibrí</p>
          <div class="puntos-barra"><span style="width:${Math.min(100, estado.puntos)}%"></span></div>
          <p>1 punto por cada $1.000 · 100 puntos = 1 tinto</p>
        </div>
        <button class="btn btn-principal" id="btn-canjear" style="width:100%" ${estado.puntos >= 100 ? "" : "disabled"}>${estado.puntos >= 100 ? "Canjear un tinto" : `Te faltan ${100 - estado.puntos} puntos`}</button>
        <div id="canje"></div>
        <div class="categoria">Tus últimas compras</div>
        ${estado.historial.slice(-5).reverse().map(([n, p]) => `<div class="linea"><span>${n}</span><span>${p > 0 ? "+" : ""}${p}</span></div>`).join("")}
        <div class="tarjeta" style="margin-top:12px"><h4>🎂 Tu cumpleaños</h4><p>Con tu permiso sales en la pantalla, y con tu compra de ese día te damos la galleta del colibrí.</p></div>
      </div>
    </div>`,

  termo: () => {
    const ejemplos = ["tinto", "leche", "capu", "latte", "parcial", "aroma"].map(porId);
    return `
    <div class="app">
      ${cab("Vale menos con tu termo", "Menos vasos desechables")}
      <div class="app-cuerpo">
        <div class="tarjeta">
          ${ejemplos.map((p) => `<div class="linea"><span>${p.nombre.split(":")[0]}</span><span><s style="color:#9aa">${fmt(p.precio)}</s> <b style="color:var(--magenta)">${fmt(p.precio - DESCUENTO_TERMO)}</b></span></div>`).join("")}
        </div>
        <div class="tarjeta"><h4>🍀 1 de cada 10</h4><p>Cada vez que traes tu termo participas: una de cada diez veces te ganas un tinto.</p></div>
        <div class="tarjeta"><h4>Termo Café Poli · ${fmt(28000)}</h4><p>Acero, 350 ml. También hay vaso reutilizable a ${fmt(12000)}.</p></div>
        <button class="btn btn-principal" data-ir="menu" style="width:100%">Pedir con mi termo</button>
      </div>
    </div>`;
  },
};

const ENLACES = {
  menu: () => {
    pant.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.add;
      estado.carrito[id] = (estado.carrito[id] || 0) + 1;
      const top = pant.scrollTop;
      ir("menu");
      pant.scrollTop = top;
    }));
  },
  pedido: () => {
    const chk = document.getElementById("chk-termo");
    if (chk) chk.addEventListener("change", () => { estado.conTermo = chk.checked; ir("pedido"); });
    pant.querySelectorAll("[data-hora]").forEach((b) => b.addEventListener("click", () => { estado.hora = b.dataset.hora; ir("pedido"); }));
    pant.querySelectorAll("[data-pago]").forEach((b) => b.addEventListener("click", () => { estado.pago = b.dataset.pago; ir("pedido"); }));
    const pagar = document.getElementById("btn-pagar");
    if (pagar) pagar.addEventListener("click", () => {
      pagar.disabled = true;
      pagar.innerHTML = `<span class="cargando"></span> Pagando con ${estado.pago}…`;
      setTimeout(() => {
        const t = totalCarrito();
        const puntos = Math.floor(t.total / 1000);
        estado.puntos += puntos;
        estado.historial.push([Object.keys(estado.carrito).map((id) => porId(id).nombre.split(":")[0].split(" (")[0]).join(", "), puntos]);
        estado.ultimoPedido = { codigo: "A" + Math.floor(20 + Math.random() * 70), hora: estado.hora, puntos };
        estado.carrito = {};
        estado.conTermo = false;
        ir("pagado");
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
      else { r.producto = "latte"; r.nombre = "Mary"; r.cel = "Mary ❤ · de tus contactos"; r.mensaje = "Para que mañana arranques con todo. Esta pausa va por mí. ¿Nos vemos en Modo Conexión?"; r.firma = "Andrés"; }
      ir("regalo");
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
        const L = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        estado.ultimoCodigo = "CP-" + Array.from({ length: 4 }, () => L[Math.floor(Math.random() * L.length)]).join("");
        const pts = Math.floor((porId(r.producto).precio + (r.tarjeta ? DETALLE_REGALO.precio : 0)) / 1000);
        estado.puntos += pts;
        estado.historial.push([`Regalo para ${r.nombre}`, pts]);
        ir("regaloListo");
      }, 1300);
    });
  },
  whatsapp: () => {
    const r = estado.regalo;
    const chat = document.getElementById("wa-chat");
    const est = document.getElementById("wa-estado");
    const hora = () => new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
    const respuestas = r.para === "Alguien especial"
      ? [["recibido", "¡Ayyy, qué lindo! 😍 Me encantó el mensaje."], ["recibido", "Mañana lo reclamo en el descanso. ¿Me acompañas?"], ["enviado", "¡Claro! Nos vemos en Modo Conexión ☕"], ["recibido", "¡De una! 💛"]]
      : [["recibido", "¡Gracias! 🙌 Mañana lo reclamo."]];
    let t = 900;
    respuestas.forEach(([tipo, texto]) => {
      if (tipo === "recibido") setTimeout(() => { if (est) est.textContent = "escribiendo…"; if (chat && chat.isConnected) chat.insertAdjacentHTML("beforeend", '<div class="wa-msg recibido escribiendo" id="wa-esc"><i></i><i></i><i></i></div>'); }, t);
      t += tipo === "recibido" ? 1500 : 900;
      setTimeout(() => {
        if (!chat || !chat.isConnected) return;
        document.getElementById("wa-esc")?.remove();
        if (est) est.textContent = "en línea";
        chat.insertAdjacentHTML("beforeend", `<div class="wa-msg ${tipo === "recibido" ? "recibido" : ""}">${texto}<time>${hora()}${tipo === "enviado" ? " ✓✓" : ""}</time></div>`);
        chat.parentElement.scrollTop = chat.parentElement.scrollHeight;
      }, t);
      t += 500;
    });
  },
  puntos: () => {
    const b = document.getElementById("btn-canjear");
    if (b && estado.puntos >= 100) b.addEventListener("click", () => {
      estado.puntos -= 100;
      estado.historial.push(["Canje: tinto gratis", -100]);
      document.getElementById("canje").innerHTML = `<div class="tarjeta exito"><h4>¡Tinto canjeado!</h4><p>Muestra este código en la barra:</p><div class="codigo">TINTO-${Math.floor(100 + Math.random() * 900)}</div></div>`;
      b.disabled = true;
      b.textContent = `Te quedan ${estado.puntos} puntos`;
    });
  },
};
