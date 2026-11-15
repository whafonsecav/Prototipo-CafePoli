// Café Poli · la carta en pantalla (módulo independiente).
// montarCarta(contenedor, { alCerrar }) arma todo el DOM dentro del contenedor y devuelve { abrir, mostrar, cerrar, abierta }.
// Respeta la variable CSS --guia-alto (alto del panel de la guía) para dejar la tarjeta por encima de ella.
import { CARTA, DESCUENTO_TERMO, VASOS, fmt } from "./datos.js";

export const TABS_CARTA = [
  { id: "cafes", nombre: "Cafés", mundos: ["Cafés de origen", "Energía para el parcial"],
    resumen: "Cafés de origen comprados directo a caficultores, en tres tamaños: el tinto de 7 onzas vale 2.000 pesos, y para la semana de parciales está el Café Parcial, uno por persona." },
  { id: "te", nombre: "Té", mundos: ["Ritual del té"],
    resumen: "El ritual del té tiene dieciséis tés e infusiones en hoja: negros, verdes y blanco, frutales sin cafeína, lattes de té, tés helados y la cata de tres tés para compartir." },
  { id: "casa", nombre: "De la casa", mundos: ["Bebidas de la casa"],
    resumen: "Lo de la casa colombiana para los que no toman café: aromática, agua de panela, chocolate con queso, Milo caliente y Milo frío, avena y jugos naturales." },
  { id: "comidas", nombre: "Antojos", mundos: ["Antojos colombianos"],
    resumen: "Antojos recién horneados, del desayuno a la tarde: pan de bono, pan de yuca, buñuelo, almojábana, arepas, empanadas y sándwich." },
  { id: "postres", nombre: "Postres y combos", mundos: ["Postres para compartir", "Combos"],
    resumen: "Postres para compartir de la tarde a la noche, el postre para dos con dos tenedores y los combos de la casa, como la pausa: tinto con pan de bono." },
  { id: "tienda", nombre: "Tienda", mundos: ["Tienda Café Poli"],
    resumen: "En la tienda está el vaso reutilizable en 8, 12 o 16 onzas, el termo y el pocillo de porcelana. Si traes tu propio vaso, cualquier bebida vale 300 pesos menos, en cualquier tamaño." },
];

const ICONOS = {
  taza: '<path d="M5 10h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM18 11.5h1.5a2.5 2.5 0 0 1 0 5H17.5M9 3c-1 1.4 1 2.4 0 4M13 3c-1 1.4 1 2.4 0 4"/>',
  rayo: '<path d="M13 2 5 13h6l-1 9 8-11h-6z"/>',
  tetera: '<path d="M5 11h12v3a6 6 0 0 1-6 6h0a6 6 0 0 1-6-6zM17 12.5l3-2.5M8 11V9a3 3 0 0 1 6 0v2M11 4v2"/>',
  olla: '<path d="M4 10h16v3a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7zM2 10h20M9 6c-.8 1 .8 2 0 3M13 5c-.8 1 .8 2 0 3"/>',
  pan: '<path d="M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8v1.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 15.5zM9 9.5l-1 3.5M13 9l-.5 4M16.5 10l.5 3"/>',
  torta: '<path d="M4 20h16v-7H4zM4 15c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1 4 0M8 13V9M12 13V8M16 13V9M8 6.5v.5M12 5.5v.5M16 6.5v.5"/>',
  combo: '<path d="M3 11h9v3a4.5 4.5 0 0 1-4.5 4.5h0A4.5 4.5 0 0 1 3 14zM12 12h1.5a2 2 0 0 1 0 4H12M14 20c0-3 2.7-5 5-5h2v5z"/>',
  vaso: '<path d="M6 5h12l-1.6 16H7.6zM5 5h14M8 2h8l1 3H7zM6.6 11h10.8"/>',
};
const ico = (n, cls = "cp-ico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n] || ICONOS.taza}</svg>`;
const claro = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150; };

function qr() {
  let h = 2166136261, c = "";
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const ojo = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
    h = Math.imul(h ^ (x * 31 + y), 16777619) >>> 0;
    if (!ojo && (h & 8)) c += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  const o = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return `<svg viewBox="-2 -2 25 25" aria-hidden="true"><rect x="-2" y="-2" width="25" height="25" fill="#fff"/><g fill="#0F385A">${c}${o(0, 0)}${o(14, 0)}${o(0, 14)}</g></svg>`;
}

const precio = (n) => `<b class="cp-p"><i>$</i>${Math.round(n).toLocaleString("es-CO")}</b>`;

function filaItem(it) {
  const nota = it.nota ? `<small class="cp-nota">${it.nota}</small>` : "";
  let der;
  if (it.tamanos && it.tamanos.length > 1) {
    der = `<span class="cp-oz">${it.tamanos.map((t) => `<span class="cp-t"><small>${t.oz} oz</small>${precio(t.precio)}</span>`).join("")}</span>`;
  } else if (it.tamanos && it.tamanos.length === 1) {
    der = `<span class="cp-oz"><span class="cp-t"><small>${it.tamanos[0].oz} oz</small>${precio(it.precio)}</span></span>`;
  } else {
    der = `<span class="cp-oz uno">${precio(it.precio)}</span>`;
  }
  const vaso = it.termo && it.tamanos ? `<span class="cp-mini-vaso" title="Trae tu vaso: −$${DESCUENTO_TERMO}">${ico("vaso", "cp-ico-s")}</span>` : "";
  return `<li class="cp-item"><span class="cp-n">${it.nombre}${vaso}${nota}</span>${der}</li>`;
}

function seccion(c) {
  const tinta = claro(c.color) ? "#0F385A" : "#fff";
  const bloques = [];
  for (const it of c.items) {
    const g = it.grupo || "";
    if (!bloques.length || bloques[bloques.length - 1].g !== g) bloques.push({ g, items: [] });
    bloques[bloques.length - 1].items.push(it);
  }
  const html = bloques.map((b) => `<div class="cp-bloque">${b.g ? `<h5 class="cp-grupo">${b.g}</h5>` : ""}<ul class="cp-lista">${b.items.map(filaItem).join("")}</ul></div>`).join("");
  let extra = "";
  if (c.cat === "Tienda Café Poli") {
    extra = `<div class="cp-vasos">${VASOS.map((v, k) => `<div class="cp-vasito" style="--k:${k}"><span class="cp-vaso-dib"></span><b>${v.oz} oz</b>${precio(v.precio)}</div>`).join("")}</div>`;
  }
  return `<section class="cp-mundo" style="--cat:${c.color};--cat-t:${tinta}">
    <header class="cp-mundo-cab"><span class="cp-mundo-ico">${ico(c.icono)}</span><div><h4>${c.cat}</h4>${c.lema ? `<p>${c.lema}</p>` : ""}</div></header>
    ${extra}<div class="cp-bloques">${html}</div>${c.nota ? `<p class="cp-mundo-nota">${c.nota}</p>` : ""}
  </section>`;
}

export function montarCarta(contenedor, { alCerrar } = {}) {
  contenedor.classList.add("cp-capa");
  contenedor.setAttribute("role", "dialog");
  contenedor.setAttribute("aria-modal", "true");
  contenedor.setAttribute("aria-labelledby", "cp-titulo");
  contenedor.innerHTML = `
  <article class="cp-carta">
    <header class="cp-cab">
      <img src="assets/pantallas/isotipo-blanco.svg" alt="" class="cp-iso" width="46" height="46">
      <div class="cp-titulos"><p class="cp-ceja">Café Poli · City Campus</p><h3 id="cp-titulo">La carta</h3><p class="cp-sub">Precios de estudiante, impuestos incluidos</p></div>
      <button class="cp-cerrar" type="button" aria-label="Cerrar la carta"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </header>
    <div class="cp-barra">
      <nav class="cp-tabs" role="tablist" aria-label="Secciones de la carta">
        ${TABS_CARTA.map((t) => `<button class="cp-tab" role="tab" type="button" data-tab="${t.id}" aria-selected="false">${t.nombre}</button>`).join("")}
      </nav>
    </div>
    <div class="cp-cuerpo" tabindex="-1">
      <div class="cp-vaso-cinta">${ico("vaso", "cp-ico-c")}<div><b>Trae tu propio vaso: −$${DESCUENTO_TERMO}</b><span>En cualquier bebida y en cualquier tamaño. Tú eliges las onzas.</span></div></div>
      <div class="cp-grid"></div>
      <div class="cp-pie">
        <div class="cp-qr">${qr()}<span><b>Escanea el QR de tu mesa</b>Pide y paga en la app, y recoge en la barra sin hacer fila.</span></div>
        <p class="cp-estrato">Un tinto vale $2.000, el 3 % del salario mínimo de un día; en las cadenas cuesta entre $4.800 y $7.000.</p>
      </div>
    </div>
  </article>`;
  const grid = contenedor.querySelector(".cp-grid");
  const cuerpo = contenedor.querySelector(".cp-cuerpo");
  let actual = TABS_CARTA[0].id;

  function mostrar(id) {
    const tab = TABS_CARTA.find((t) => t.id === id) || TABS_CARTA[0];
    actual = tab.id;
    contenedor.querySelectorAll(".cp-tab").forEach((b) => {
      const si = b.dataset.tab === tab.id;
      b.classList.toggle("activo", si);
      b.setAttribute("aria-selected", String(si));
      if (si) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
    grid.classList.remove("cp-entra");
    grid.innerHTML = tab.mundos.map((m) => CARTA.find((c) => c.cat === m)).filter(Boolean).map(seccion).join("");
    grid.dataset.n = String(tab.mundos.length);
    void grid.offsetWidth;
    grid.classList.add("cp-entra");
    cuerpo.scrollTop = 0;
    return tab;
  }
  function abrir(id = actual) {
    contenedor.classList.remove("oculto");
    return mostrar(id);
  }
  function cerrar() { contenedor.classList.add("oculto"); }
  const abierta = () => !contenedor.classList.contains("oculto");
  const porUsuario = () => { cerrar(); if (alCerrar) alCerrar(); };

  contenedor.querySelectorAll(".cp-tab").forEach((b) => b.addEventListener("click", () => mostrar(b.dataset.tab)));
  contenedor.querySelector(".cp-cerrar").addEventListener("click", porUsuario);
  contenedor.addEventListener("click", (e) => { if (e.target === contenedor) porUsuario(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && abierta()) porUsuario(); });
  mostrar(actual);
  return { abrir, mostrar, cerrar, abierta };
}
