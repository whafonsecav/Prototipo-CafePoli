// Puntos interactivos del modo libre (coordenadas del plano, en metros), en qué vistas aparecen y conexiones entre vistas.
import { LOGROS } from "./logros.js";

export const CONEXIONES = {
  pasillo: ["vestibulo"],
  vestibulo: ["pasillo", "barra", "avionEnt", "tienda"],
  barra: ["vestibulo", "recogida", "tienda"],
  recogida: ["barra", "parche", "logros"],
  tienda: ["barra", "logros", "vestibulo"],
  parche: ["recogida", "logros"],
  logros: ["tienda", "recogida", "parche"],
  avionEnt: ["vestibulo", "avion"],
  avion: ["avionEnt", "rincon"],
  rincon: ["avion"],
};

const info = (titulo, texto) => ({ tipo: "info", titulo, texto });
const prod = (titulo, imgs, datos, texto) => ({ tipo: "producto", titulo, imgs, datos, texto });

export const PUNTOS = [
  { id: "qr", nodos: ["barra", "vestibulo"], pos: [15.92, 1.2, 5.95], icono: "📱", etiqueta: "Pide con el QR", accion: { tipo: "app", pantalla: "inicio" } },
  { id: "club", nodos: ["barra"], pos: [15.6, 1.3, 6.05], icono: "⭐", etiqueta: "Club Colibrí", accion: { tipo: "app", pantalla: "puntos" } },
  { id: "caja", nodos: ["barra"], pos: [15.35, 1.25, 6.1], icono: "🧾", etiqueta: "Caja e inventario", accion: info("Caja e inventario conectados", "Cada pedido de la app entra directo a la caja y al inventario. Así sabemos qué se vende en cada jornada, pedimos a tiempo y botamos menos comida.") },
  { id: "carta", nodos: ["barra", "recogida"], pos: [15.225, 2.0, 6.09], icono: "☕", etiqueta: "La carta", accion: { tipo: "carta", tab: "cafes" } },
  { id: "pantallas", nodos: ["barra", "recogida"], pos: [11.925, 2.0, 6.09], icono: "📺", etiqueta: "Pantallas de la barra", accion: { tipo: "tv", lista: "barra", titulo: "Pantallas de la barra" } },
  { id: "parcial", nodos: ["barra"], pos: [14.5, 1.3, 7.88], icono: "⚡", etiqueta: "Café Parcial", accion: info("El Café Parcial", "Doble carga de espresso con panela y canela para la semana de parciales: unos 125 miligramos de cafeína, por debajo de los 200 por dosis que se consideran seguros para un adulto. Lleva aviso y se vende uno por persona.") },
  { id: "origen", nodos: ["barra", "recogida"], pos: [11.5, 1.3, 7.88], icono: "🌱", etiqueta: "Café de origen", accion: info("Café de origen", "Lo compramos al por mayor, directo a asociaciones de caficultores: buen café, ni comercial ni de lujo, a un precio que le sirve al estudiante y al negocio.") },
  { id: "regalo", nodos: ["barra"], pos: [14.85, 1.22, 5.97], icono: "🎁", etiqueta: "Regala un Café Poli", accion: { tipo: "app", pantalla: "regalo" } },
  { id: "recogida", nodos: ["recogida"], pos: [11.2, 1.45, 5.98], icono: "🙋", etiqueta: "Recoge por tu nombre", accion: info("Recoge por tu nombre", "La pantalla te avisa cuando tu pedido está listo y el barista te lo entrega diciendo tu nombre.") },
  { id: "bolsa", nodos: ["recogida", "barra"], pos: [12.95, 1.22, 5.97], icono: "🛍️", etiqueta: "Bolsa del final del día", accion: { tipo: "app", pantalla: "bolsa" } },
  { id: "vaso", nodos: ["tienda"], pos: [15.445, 1.436, 0.33], icono: "♻️", etiqueta: "Trae tu vaso", accion: prod("Vaso reutilizable Café Poli", ["vasos"], ["8, 12 y 16 oz", "−$300 en cada bebida"], "El vaso reutilizable de Café Poli viene en ocho, doce y dieciséis onzas. Con él, o con tu propio vaso o termo, cada bebida vale 300 pesos menos.") },
  { id: "termo", nodos: ["tienda"], pos: [15.445, 1.886, 0.33], icono: "🧉", etiqueta: "Termo de acero", accion: prod("Termo Café Poli de acero", ["termo"], ["Mantiene el tinto caliente por horas", "También cuenta como tu vaso"]) },
  { id: "pocillo", nodos: ["tienda"], pos: [15.6, 0.986, 0.33], icono: "☕", etiqueta: "Pocillo de porcelana", accion: prod("Pocillo de porcelana Café Poli", ["pocillo"], ["Para tomar en la mesa", "También se vende"]) },
  { id: "ropa", nodos: ["tienda"], pos: [14.285, 1.4, 0.36], icono: "👕", etiqueta: "Productos del Poli", accion: prod("Productos oficiales del Poli", ["camiseta", "chaleco", "chaqueta"], ["Camisetas, chalecos y chaquetas", "En consignación"]) },
  { id: "peluche", nodos: ["tienda"], pos: [15.445, 0.626, 0.33], icono: "🧸", etiqueta: "Peluche de Poligreca", accion: prod("Llaveros y peluche de Poligreca", ["llavero", "peluche"], ["Detalles para regalar"]) },
  { id: "arbol", nodos: ["recogida", "barra"], pos: [12.8, 1.7, 3.2], icono: "🌳", etiqueta: "La mesa del árbol", accion: info("La mesa del árbol", "El árbol de la cafetería actual se queda, sembrado en el centro de su mesa cuadrada.") },
  { id: "politv", nodos: ["parche"], pos: [7.26, 2.525, 4.463], icono: "📺", etiqueta: "Poli TV", accion: { tipo: "tv", lista: "politv", titulo: "Poli TV", texto: "Poli TV pasa los cumpleaños del día, la agenda de la semana y las noticias del Poli. Del otro lado, canales nacionales en vivo." } },
  { id: "hornos", nodos: ["parche"], pos: [0.3, 1.1, 6.1], icono: "🍱", etiqueta: "Hornos microondas", accion: info("Hornos microondas", "Se quedan los hornos microondas de hoy, organizados, porque muchos estudiantes traen su almuerzo.") },
  { id: "juegos", nodos: ["parche"], pos: [0.375, 0.75, 2.45], icono: "🎲", etiqueta: "Juegos de mesa", accion: info("Toma un juego, devuélvelo a su lugar", "Parqués, dominó, ajedrez, Uno, Jenga y Rummikub. Se prestan con el carné del Poli y se devuelven a su casilla.") },
  { id: "division", nodos: ["vestibulo", "avionEnt"], pos: [19.0, 1.0, 1.3], icono: "🔇", etiqueta: "Entrada a Modo Avión", accion: info("La entrada a Modo Avión", "Muro acústico de piso a techo forrado con jardín vertical y listones de madera, como el atrio del Poli. Puerta de madera maciza: adentro no entra el ruido.") },
  { id: "puestos", nodos: ["avion"], pos: [21.95, 1.0, -4.0], icono: "💡", etiqueta: "Puestos frente al ventanal", accion: info("Puestos frente al ventanal", "Ocho puestos con lámpara y divisores de fieltro, con luz natural y la celosía de madera de la fachada.") },
  { id: "rincon", nodos: ["avion", "rincon"], pos: [25.2, 0.7, -4.8], icono: "🫖", etiqueta: "Rincón Respira", accion: info("Rincón Respira", "Un espacio para despejar la mente: sillones, mesitas para un café o una torta y libros para tomar y dejar.") },
  { id: "libros", nodos: ["rincon"], pos: [26.75, 1.25, -6.6], icono: "📚", etiqueta: "Toma un libro, deja otro", accion: info("Toma un libro, deja otro", "Los libros van por franjas de color, una por género. Tomas uno y dejas otro.") },
  { id: "maqueta", nodos: ["vestibulo"], pos: [17.65, 0.4, 1.6], icono: "🧩", etiqueta: "Ver la maqueta", accion: { tipo: "maqueta" } },
];

// Un punto por cada logro real de la vitrina (misma distribución que el modelo 3D: vitrina centrada en x = 11,2 sobre el muro z = 0)
const cx = 11.2, w = 5.0, y0 = 0.8, z = 0.38 / 2 + 0.08 + 0.25;
const pisos = [y0 + 0.02, y0 + 0.55, y0 + 1.08];
const porRepisa = Math.ceil(LOGROS.length / 3) || 1;
LOGROS.forEach((l, i) => {
  const fila = Math.floor(i / porRepisa), col = i % porRepisa;
  const enFila = Math.min(porRepisa, LOGROS.length - fila * porRepisa);
  const x = cx - w / 2 + (w / enFila) * (col + 0.5);
  PUNTOS.push({ id: `logro${i}`, nodos: ["logros"], pos: [x, pisos[2 - fila] + 0.16, z], icono: "🏆", etiqueta: l.corto, logro: i, mini: true, accion: { tipo: "logro", i } });
});
PUNTOS.push({ id: "todosLogros", nodos: ["logros", "tienda"], pos: [11.2, 2.45, 0.3], icono: "🏅", etiqueta: "Todos los logros", accion: { tipo: "logros" } });
