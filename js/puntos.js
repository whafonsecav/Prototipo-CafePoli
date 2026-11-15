// Puntos interactivos del recorrido 360° (coordenadas del plano, en metros) y conexiones entre nodos.
import { LOGROS } from "./logros.js";

export const CONEXIONES = {
  pasillo: ["vestibulo"],
  vestibulo: ["pasillo", "barra", "avionEnt"],
  barra: ["vestibulo", "recogida", "logros"],
  recogida: ["barra", "parche", "logros"],
  parche: ["recogida", "logros"],
  logros: ["barra", "recogida", "parche"],
  avionEnt: ["vestibulo", "avion"],
  avion: ["avionEnt"],
};

const info = (titulo, texto) => ({ tipo: "info", titulo, texto });

export const PUNTOS = [
  { id: "qr", pos: [15.92, 1.2, 5.95], icono: "📱", etiqueta: "Pide con el QR", accion: { tipo: "app", pantalla: "inicio" } },
  { id: "puntos", pos: [15.6, 2.55, 6.05], icono: "⭐", etiqueta: "Club Colibrí", accion: { tipo: "app", pantalla: "puntos" } },
  { id: "caja", pos: [15.35, 1.25, 6.1], icono: "🧾", etiqueta: "Caja e inventario", accion: info("Caja e inventario conectados", "Cada pedido de la app entra directo a la caja y al inventario. Así sabemos qué se vende en cada jornada, pedimos a tiempo y botamos menos comida.") },
  { id: "carta", pos: [12.27, 2.3, 8.1], icono: "☕", etiqueta: "La carta", accion: { tipo: "app", pantalla: "menu" } },
  { id: "cafes", pos: [14.23, 2.3, 8.1], icono: "🌱", etiqueta: "Nuestros cafés", accion: info("Nuestros cafés", "Tinto de greca, espresso, capuchino y latte, Café Parcial y café frío con panela. Todo con café de origen colombiano, comprado directo a caficultores.") },
  { id: "parcial", pos: [14.5, 1.3, 7.88], icono: "⚡", etiqueta: "Café Parcial", accion: info("El Café Parcial", "Doble carga de espresso con panela y canela para la semana de parciales: unos 125 mg de cafeína, por debajo de los 200 mg por dosis que se consideran seguros para un adulto. Lleva aviso y se vende uno por persona.") },
  { id: "origen", pos: [11.5, 1.3, 7.88], icono: "🌱", etiqueta: "Café de origen", accion: info("Café de origen", "Lo compramos al por mayor, directo a asociaciones de caficultores: buen café, ni comercial ni de lujo, a un precio que le sirve al estudiante y al negocio.") },
  { id: "recogida", pos: [11.55, 1.45, 6.0], icono: "🙋", etiqueta: "Recoge por tu nombre", accion: info("Recoge por tu nombre", "La pantalla te avisa cuando tu pedido está listo y el barista te lo entrega diciendo tu nombre.") },
  { id: "regalo", pos: [14.85, 1.22, 5.97], icono: "🎁", etiqueta: "Regala un Café Poli", accion: { tipo: "app", pantalla: "demo" } },
  { id: "bolsa", pos: [12.95, 1.22, 5.97], icono: "🛍️", etiqueta: "Bolsa del final del día", accion: info("La bolsa del final del día", "Al cierre, lo que no se vendió va en una bolsa a 3.000 pesos y lo demás se dona.") },
  { id: "tienda", pos: [15.15, 1.4, 0.45], icono: "♻️", etiqueta: "Tienda Poli · termo", accion: { tipo: "app", pantalla: "termo" } },
  { id: "arbol", pos: [12.8, 1.7, 3.2], icono: "🌳", etiqueta: "La mesa del árbol", accion: info("La mesa del árbol", "El árbol de la cafetería actual se queda, ahora con una mesa compartida alrededor.") },
  { id: "tv", pos: [0.12, 1.95, 1.9], icono: "🎂", etiqueta: "Pantalla de cumpleaños", accion: { tipo: "tv" } },
  { id: "agenda", pos: [0.12, 2.75, 6.65], icono: "📅", etiqueta: "Agenda de la semana", accion: info("Agenda de la semana", "Torneos internos, charlas de Bienestar, noches de juegos y ferias del Poli. El contenido se actualiza cada semana.") },
  { id: "juegoSemana", pos: [9.6, 2.95, 0.12], icono: "🎯", etiqueta: "Juego de la semana", accion: info("Juego de la semana", "Cada semana destacamos un juego: parqués, ajedrez o Uno, que se prestan con el carné.") },
  { id: "orgullo", pos: [12.8, 2.95, 0.12], icono: "🏅", etiqueta: "Orgullo Poli", accion: { tipo: "logros" } },
  { id: "juegos", pos: [0.35, 1.2, 4.4], icono: "🎲", etiqueta: "Toma un juego", accion: info("Toma un juego, devuélvelo a su lugar", "Cada juego tiene su casilla con nombre. Se prestan con el carné del Poli y se devuelven al mismo lugar.") },
  { id: "microondas", pos: [0.4, 1.2, 6.65], icono: "🍱", etiqueta: "Microondas", accion: info("Estación de microondas", "Se mantiene la estación de microondas de hoy: muchos estudiantes traen su almuerzo.") },
  { id: "division", pos: [19.0, 1.0, 1.3], icono: "🔇", etiqueta: "División acústica", accion: info("La división acústica", "Muro bajo de madera que absorbe el ruido, vidrio laminado arriba, jardinera, cuadros con frases y un jardín vertical del lado de Modo Avión.") },
  { id: "agua", pos: [20.2, 1.2, 7.9], icono: "💧", etiqueta: "Rellena tu termo", accion: info("Estación de agua", "Reutiliza el punto de agua de la cafetería antigua para que rellenes tu termo gratis.") },
  { id: "biblioteca", pos: [27.0, 1.4, -4.5], icono: "📚", etiqueta: "Toma un libro, deja otro", accion: info("Biblioteca de pared", "Ocho metros de libros: tomas uno y dejas otro.") },
  { id: "puestos", pos: [21.95, 1.0, -4.0], icono: "💡", etiqueta: "Puestos frente al ventanal", accion: info("Puestos frente al ventanal", "Ocho puestos con lámpara y divisores de fieltro, con luz natural y la celosía de madera de la fachada.") },
];

// Un punto por cada logro real de la vitrina (misma distribución que el modelo 3D: vitrina centrada en x = 11,2 sobre el muro z = 0)
const cx = 11.2, w = 5.0, y0 = 0.8, z = 0.38 / 2 + 0.08 + 0.25;
const pisos = [y0 + 0.02, y0 + 0.55, y0 + 1.08];
const porRepisa = Math.ceil(LOGROS.length / 3) || 1;
LOGROS.forEach((l, i) => {
  const fila = Math.floor(i / porRepisa), col = i % porRepisa;
  const enFila = Math.min(porRepisa, LOGROS.length - fila * porRepisa);
  const x = cx - w / 2 + (w / enFila) * (col + 0.5);
  PUNTOS.push({ id: `logro${i}`, pos: [x, pisos[2 - fila] + 0.16, z], icono: "🏆", etiqueta: l.corto, logro: i, mini: true, accion: { tipo: "logro", i } });
});
