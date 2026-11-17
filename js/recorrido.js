// Puntos de captura 360° (nodos) y guion del recorrido guiado. Coordenadas en metros (x, y, z) del plano de City Campus, piso 2.
// Poligreca hace un pitch: cuenta, vende y echa chiste. Cada paso puede abrir una «escena» (app, carta, televisor, producto,
// logro, marca o maqueta) que nunca tapa Siguiente y Atrás.
import { LOGROS } from "./logros.js";

export const NODOS = {
  pasillo:   { pos: [17.65, 1.6, 12.5], tino: { pos: [18.3, 10.6], gesto: "saluda" }, nombre: "Pasillo de entrada" },
  vestibulo: { pos: [17.65, 1.6, 3.9], tino: { pos: [17.0, 2.4], gesto: "quieto" }, nombre: "Vestíbulo" },
  barra:     { pos: [15.0, 1.6, 4.75], tino: { pos: [12.45, 4.95], gesto: "senala" }, nombre: "Barra: pide y paga" },
  recogida:  { pos: [10.55, 1.6, 4.8], tino: { pos: [9.75, 4.5], gesto: "quieto" }, nombre: "Recoge y la mesa del árbol" },
  tienda:    { pos: [15.05, 1.55, 1.7], tino: { pos: [16.4, 3.0], gesto: "senala" }, nombre: "Tienda Poli" },
  parche:    { pos: [5.35, 1.6, 2.6], tino: { pos: [6.4, 4.5], gesto: "saluda" }, nombre: "Modo Conexión" },
  logros:    { pos: [11.2, 1.6, 1.0], tino: { pos: [13.55, 0.95], gesto: "senala" }, nombre: "Vitrina de logros" },
  avionEnt:  { pos: [20.1, 1.6, 3.15], tino: { pos: [22.6, 3.15], gesto: "quieto" }, nombre: "Modo Avión: mesas" },
  avion:     { pos: [23.65, 1.6, -4.2], tino: { pos: [23.65, -1.3], gesto: "quieto" }, nombre: "Modo Avión: ventanal" },
  rincon:    { pos: [26.1, 1.5, -3.5], tino: { pos: [26.15, -1.35], gesto: "senala" }, nombre: "Rincón Respira" },
};

// Caras de los televisores (centro c, ancho w, alto h, normal n hacia donde mira la pantalla), para «entrar» a la pantalla.
export const TVS = {
  politv: { c: [7.26, 2.525, 4.463], w: 1.4, h: 0.79, n: [0, 0, -1] },
  barra:  { c: [13.575, 2.303, 6.09], w: 1.2, h: 0.675, n: [0, 0, -1] },
};
// Puntos para acercar la cámara (se ajustan al modelo)
const P = {
  qr: [15.92, 1.2, 5.95], pantallasBarra: [13.575, 2.2, 6.09], vitrinaPan: [13.95, 1.3, 6.1], bolsaAviso: [12.95, 1.2, 5.97], pedidos: [11.2, 1.45, 5.98],
  tienda: [15.05, 1.35, 0.2], vasos: [15.445, 1.436, 0.33], termo: [15.445, 1.886, 0.33], pocillo: [15.445, 0.986, 0.33], ropa: [14.285, 1.4, 0.36], detalles: [15.445, 0.75, 0.33],
  sala: [3.2, 1.1, 5.6], hornos: [0.3, 1.1, 6.1], juegos: [0.375, 0.75, 2.45], tvs: [5.445, 2.35, 4.5], tvA: [3.63, 2.525, 4.463], tvB: [7.26, 2.525, 4.463],
  libros: [26.75, 1.25, -6.6], salaRincon: [25.2, 0.85, -5.6],
};
const logroPos = (i) => {
  const cx = 11.2, w = 5.0, y0 = 0.8, z = 0.38 / 2 + 0.08 + 0.25;
  const pisos = [y0 + 0.02, y0 + 0.55, y0 + 1.08];
  const porRepisa = Math.ceil(LOGROS.length / 3) || 1;
  const fila = Math.floor(i / porRepisa), col = i % porRepisa;
  const enFila = Math.min(porRepisa, LOGROS.length - fila * porRepisa);
  return [cx - w / 2 + (w / enFila) * (col + 0.5), pisos[2 - fila] + 0.16, z];
};
const pasoLogro = (i) => {
  const l = LOGROS[i];
  return { id: `logro${i}`, nodo: "logros", mira: logroPos(i), fov: 34, titulo: `${l.categoria} · ${l.anio}`, texto: `${l.titulo}. ${l.descripcion}`, escena: { tipo: "logro", i } };
};
const PRODUCTOS = {
  vasos: "Vaso reutilizable · 8, 12 y 16 oz", termo: "Termo de acero", pocillo: "Pocillo de porcelana",
  camiseta: "Camiseta", chaleco: "Chaleco", chaqueta: "Chaqueta", llavero: "Llavero", peluche: "Peluche de Poligreca",
};

export const PASOS = [
  // ---------------------------------------------------------------- Bienvenida
  { id: "entrada", nodo: "pasillo", mira: [17.65, 1.5, 3.0], titulo: "¡Bienvenido a Café Poli!",
    texto: "¡Quiubo! Soy Poligreca: Poli, por el Poli, y greca, por la greca del tinto. Sí, mi nombre es una cafetera, y con orgullo. Soy la prima de Polito, la mascota del Poli, y vengo del Eje Cafetero, de una familia de caficultores: o sea que de café sé, y bastante. Hoy te voy a mostrar Café Poli, aquí en el segundo piso de City Campus. Tú le das a Siguiente y yo te cuento. ¿Listo? ¡Vamos!" },
  { id: "vestibulo", nodo: "vestibulo", mira: [17.65, 1.7, 0.0], titulo: "Dos caminos, como en la vida",
    texto: "Al entrar tienes dos caminos, como en la vida. A la izquierda, Modo Conexión, para pedir, charlar y reírte duro. A la derecha, Modo Avión, para concentrarte. Pusimos la barra lejos de los que estudian, porque nadie aprende cálculo con una máquina de espresso rugiendo al lado." },
  { id: "estilo", nodo: "vestibulo", mira: [13.0, 1.6, 2.5], fov: 70, titulo: "¿Por qué no todo azul, como hoy?",
    texto: "¿Y por qué no todo azul, como la cafetería de hoy? Porque el azul se queda: es el Poli, es la casa. Pero un salón todo azul se siente más como aula que como café. Por eso sumamos madera clara, plantas y luz cálida, que invitan a quedarse. Y los colores del Poli tienen trabajo: el cian y el magenta te dicen que estás en Modo Conexión, y la madera ámbar, que entraste a Modo Avión." },

  // ---------------------------------------------------------------- La barra y la carta
  { id: "barra", nodo: "barra", mira: [13.6, 1.3, 6.6], titulo: "La barra: aquí tienes nombre",
    texto: "Aquí en la barra te atienden personas, no máquinas, y te llaman por tu nombre. Nada de «el siguiente»: aquí eres Laura, Camilo o Andrés. El equipo trabaja en turnos escalonados, de seis de la mañana a nueve y cuarenta y cinco de la noche, para las dos jornadas. Y fíjate: la barra quedó frente a las ventanas, con las plantas de siempre. No tapamos nada." },
  { id: "origen", nodo: "barra", mira: [11.5, 1.3, 7.9], fov: 55, titulo: "Café de origen, directo de caficultores",
    texto: "Ahora, lo importante: el café. Es café de origen, comprado al por mayor, directo a asociaciones de caficultores. Ni café comercial, ni de lujo para tomárselo con el meñique arriba: buen café, a precio de estudiante. Mi familia lo aprueba, y eso que son exigentes." },
  { id: "pantallasBarra", nodo: "barra", mira: P.pantallasBarra, fov: 58, titulo: "Tres pantallas que no se quedan quietas",
    texto: "Sobre la barra hay tres pantallas, y ninguna se queda quieta: rotan la carta, las promociones de la semana, los cumpleaños del día y tus Puntos Colibrí. Una ya existe en la cafetería de hoy; solo compramos dos. Porque reciclar también se vale con pantallas.",
    escena: { tipo: "tv", lista: "barra", tv: "barra", expandir: true, titulo: "Pantallas de la barra" } },
  { id: "carta1", nodo: "barra", titulo: "La carta: cafés por tamaño",
    texto: "Ahora sí, entremos a la carta. Primero, los cafés de origen: tinto, tinto campesino con panela, café con leche, capuchino, latte y café frío. Todo viene por tamaño, en onzas. Un tinto de siete onzas vale dos mil pesos, cuando en las cadenas cuesta entre cuatro mil ochocientos y siete mil. Con lo que te ahorras, te comes un buñuelo.",
    escena: { tipo: "carta", tab: "cafes" } },
  { id: "carta2", nodo: "barra", titulo: "El ritual del té: dieciséis opciones",
    texto: "Para los que no toman café, tranquilos, no los juzgo… mucho. El ritual del té tiene dieciséis tés e infusiones en hoja: negros como el Earl Grey, verde, jazmín, té blanco, rooibos, matcha, chai, frutales, aromáticas como manzanilla o jengibre con limón, y tés helados. Y para compartir, la cata de tres tés.",
    escena: { tipo: "carta", tab: "te" } },
  { id: "carta3", nodo: "barra", titulo: "Lo de la casa: sí, hay Milo",
    texto: "Y las bebidas de la casa, las de toda la vida: Milo caliente y Milo frío, como en las onces del colegio, chocolate santafereño con queso, agua de panela con limón, aromática, avena y jugos naturales, todo por tamaño. Y si vas de afán, hay agua, gaseosa, malta y jugos fríos para llevar; esos vienen sellados, así que ahí no aplica lo del vaso.",
    escena: { tipo: "carta", tab: "casa" } },
  { id: "carta4", nodo: "barra", titulo: "Antojos recién horneados",
    texto: "Para acompañar, antojos colombianos recién horneados: pan de bono, pan de yuca, buñuelo, almojábana, arepas, empanadas y un sándwich para el que viene con hambre de verdad. Y en la canasta de la vitrina, los de paquete de toda la vida: papas, platanitos, inflados de queso, galletas, maní y chocolatinas. Porque sí, entre clase y clase, el paquetico siempre cae bien.",
    escena: { tipo: "carta", tab: "comidas" } },
  { id: "carta5", nodo: "barra", titulo: "Postres para compartir",
    texto: "Y de la tarde a la noche, los postres para compartir: torta de zanahoria, cheesecake de frutos rojos, brownie y el postre para dos, con dos tenedores. Ojo, que el postre para dos no es para uno solo… bueno, no te voy a juzgar.",
    escena: { tipo: "carta", tab: "postres" } },
  { id: "parcial", nodo: "barra", mira: [14.5, 1.2, 7.9], fov: 45, titulo: "El Café Parcial",
    texto: "En semana de parciales llega el Café Parcial: doble carga de espresso con panela y canela. Tiene unos ciento veinticinco miligramos de cafeína, por debajo de los doscientos que se consideran seguros por dosis para un adulto. Por eso se vende uno por persona: queremos que pases el parcial, no que veas sonidos." },

  // ---------------------------------------------------------------- La app
  { id: "qr", nodo: "barra", mira: P.qr, fov: 40, titulo: "El truco para no hacer fila", accion: { texto: "📱 Probar la app real", tipo: "enlace", url: "app/" },
    texto: "Ahora, el truco para no hacer fila. Este QR está en la barra y pegado en cada mesa, así que no se pierde ni se lo lleva nadie. Lo escaneas, se abre la app de Café Poli y pides desde donde estés. En el descanso de la noche llegan más pedidos de los que la barra alcanza a atender en veinte minutos; con la app sí alcanza. Mira, te la muestro." },
  { id: "appInicio", nodo: "barra", titulo: "La app de Café Poli",
    texto: "Esta es la app. Arriba están tus Puntos Colibrí y cuánto valen en pesos. Abajo hay cuatro botones: pedir y recoger sin fila, regalar un Café Poli, tus puntos y trae tu vaso. Vamos uno por uno, sin afán.",
    escena: { tipo: "app", guion: "inicio" } },
  { id: "appPedir", nodo: "barra", titulo: "Pide por tamaño",
    texto: "Primero, pedir. Es la misma carta de la barra, con los mismos precios, y eliges el tamaño en onzas. Andrés, nuestro estudiante de la noche, pide un capuchino de doce onzas y un pan de bono. Buen gusto, Andrés.",
    escena: { tipo: "app", guion: "pedir" } },
  { id: "appPagar", nodo: "barra", titulo: "Elige la hora y paga",
    texto: "Después escoge cuándo lo recoge: en el descanso de las ocho y veinte. Marca que trae su propio vaso, y le descuentan trescientos pesos. Y paga con Nequi, Daviplata, Bre-B o tarjeta. Sin efectivo, sin fila, sin drama.",
    escena: { tipo: "app", guion: "pagar" } },
  { id: "appListo", nodo: "barra", titulo: "¡Listo, Andrés!",
    texto: "¡Listo! El pedido entra directo a la caja y al inventario, y la barra lo tiene a la hora que elegiste. Cuando está listo, la pantalla de pedidos te avisa y el barista te lo entrega diciendo tu nombre. Ah, y sumaste Puntos Colibrí.",
    escena: { tipo: "app", guion: "listo" } },

  // ---------------------------------------------------------------- Regala un Café Poli
  { id: "regalo1", nodo: "barra", titulo: "Regala un Café Poli",
    texto: "Ahora mi parte favorita, la romántica. Andrés quiere sorprender a Mary antes de su parcial. ¿Flores? No, mejor: un Café Poli. Abre la app y entra a Regalar.",
    escena: { tipo: "app", guion: "regalo1" } },
  { id: "regalo2", nodo: "barra", titulo: "Escoge y escribe tu mensaje",
    texto: "Escoge para quién es: alguien especial. Qué le regala: un latte de arequipe. Le suma la tarjeta impresa con chocolatina, porque Andrés no es tacaño. Busca a Mary en sus contactos y escribe su propio mensaje, firmado con su nombre: aquí no hay regalos anónimos.",
    escena: { tipo: "app", guion: "regalo2" } },
  { id: "regalo3", nodo: "barra", titulo: "El código y la tarjeta",
    texto: "Paga en segundos y la app crea un código único que vale treinta días. Mira cómo queda la tarjeta: para Mary, con el mensaje y la firma de Andrés, el producto y el código para reclamarlo. ¿Bonita, o qué?",
    escena: { tipo: "app", guion: "regalo3" } },
  { id: "regalo4", nodo: "barra", titulo: "Le llega por WhatsApp",
    texto: "Andrés se la manda por WhatsApp. A Mary le llega la tarjeta con el código… y mira cómo responde. Ay, no, yo aquí sobrando.",
    escena: { tipo: "app", guion: "regalo4" } },
  { id: "regalo5", nodo: "barra", titulo: "Así lo reclama",
    texto: "Al otro día, Mary muestra el código en la barra. El barista lo valida en la caja, que descuenta el latte del inventario, y se lo entrega por su nombre, con la tarjeta impresa. Y no es solo para el amor: también sirve para que los papás les paguen el desayuno a sus hijos, o para pagarle a un amigo los apuntes.",
    escena: { tipo: "app", guion: "regalo5" } },

  // ---------------------------------------------------------------- Club Colibrí y tu vaso
  { id: "appPuntos", nodo: "barra", titulo: "Club Colibrí",
    texto: "En Puntos está el Club Colibrí. Te inscribes con tu correo del Poli y sumas veinte puntos por cada mil pesos. Cada punto vale un peso, y con ellos pagas todo o una parte de lo que quieras. Andrés ya tiene dos mil ochenta, así que los usa en su próximo pedido. Y en tu cumpleaños, con tu compra, la galleta del colibrí va por nuestra cuenta.",
    escena: { tipo: "app", guion: "puntos" } },
  { id: "appCumple", nodo: "barra", titulo: "La app te felicita",
    texto: "Y como te registras con tu correo del Poli y tu fecha de cumpleaños, ese día la app te felicita y te invita a pasar por la galleta del colibrí. Eso sí, solo en días hábiles: si tu cumpleaños cae un domingo o un festivo, ese día no abrimos para consentirte… pero te queremos igual.",
    escena: { tipo: "app", guion: "cumple" } },
  { id: "appVaso", nodo: "barra", titulo: "Trae tu propio vaso",
    texto: "Y este botón es el que más me gusta: trae tu propio vaso. Tu vaso o tu termo, el que quieras. Pagas por tamaño, ocho, doce o dieciséis onzas, y en las bebidas que preparamos siempre son trescientos pesos menos. El planeta te lo agradece, y tu bolsillo también.",
    escena: { tipo: "app", guion: "vaso" } },

  // ---------------------------------------------------------------- Recogida y bolsa del final del día
  { id: "recogida", nodo: "recogida", mira: P.pedidos, fov: 55, titulo: "Recoge por tu nombre",
    texto: "Aquí recoges. Cuando tu pedido está listo, la pantalla te avisa y el barista te lo entrega diciendo tu nombre. La tecnología ordena la fila; el cariño lo pone una persona." },
  { id: "bolsa1", nodo: "recogida", mira: P.bolsaAviso, fov: 45, titulo: "La bolsa del final del día",
    texto: "¿Y qué pasa con lo que no se vende? Aquí viene lo bueno. A las ocho y media de la noche, la caja ya sabe qué quedó del día. Entonces la app le manda un aviso al Club Colibrí: ya está la bolsa del final del día, dos productos por tres mil pesos. Son pocas, porque dependen de lo que sobre, así que el que pestañea, pierde.",
    escena: { tipo: "app", guion: "bolsa1" } },
  { id: "bolsa2", nodo: "recogida", titulo: "Resérvala, recógela y lo demás se dona",
    texto: "La reservas y la pagas en la app, y te llega un código. La recoges en la barra antes de las nueve y media. Y lo que nadie reserva se dona esa misma noche. Menos comida a la basura y un antojo barato para el que sale tarde. Gana todo el mundo.",
    escena: { tipo: "app", guion: "bolsa2" } },

  { id: "appReal", nodo: "recogida", titulo: "Esta app sí existe",
    texto: "Y lo mejor: esta app no es solo un dibujo. Escanea el código con tu celular o abre el enlace, y pruébala de verdad: mira la carta y lo que queda en la vitrina, pide, y regala un Café Poli con tu mensaje para compartirlo por Instagram o WhatsApp. Todo es simulación, así que no se cobra nada.",
    escena: { tipo: "qrapp" }, accion: { texto: "📱 Abrir la app", tipo: "enlace", url: "app/" } },

  // ---------------------------------------------------------------- Tienda Poli
  { id: "tienda", nodo: "tienda", mira: P.tienda, fov: 66, titulo: "La Tienda Poli",
    texto: "Esta es la Tienda Poli. Y aquí está la estrella de la sostenibilidad: el vaso reutilizable de Café Poli. Acérquese, que no muerde." },
  { id: "vasos", nodo: "tienda", mira: P.vasos, fov: 30, titulo: "El vaso que se paga solo",
    texto: "Viene en tres tamaños, ocho, doce y dieciséis onzas, los mismos de la carta. Con él pagas trescientos pesos menos cada vez y dejas de botar vasos desechables. Si tomas un café cada día de clase, se paga solo antes de que termine el semestre. Literal: un vaso que se paga solo.",
    escena: { tipo: "producto", imgs: ["vasos"], nombres: PRODUCTOS, titulo: "Vaso reutilizable Café Poli", datos: ["8, 12 y 16 oz, los tamaños de la carta", "−$300 en cada bebida", "Adiós a los vasos desechables"] } },
  { id: "termo", nodo: "tienda", mira: P.termo, fov: 30, titulo: "Termo de acero",
    texto: "Para el que vive en el Poli de siete a diez, el termo de acero mantiene el tinto caliente por horas. Y cuenta como tu vaso: los mismos trescientos pesos menos.",
    escena: { tipo: "producto", imgs: ["termo"], nombres: PRODUCTOS, titulo: "Termo Café Poli de acero", datos: ["Mantiene el tinto caliente por horas", "También cuenta como tu vaso: −$300"] } },
  { id: "pocillo", nodo: "tienda", mira: P.pocillo, fov: 30, titulo: "Pocillo de porcelana",
    texto: "Y si te tomas el café aquí, te lo servimos en este pocillo de porcelana con el logo de Café Poli. En la mesa, cero desechables. Si te enamoras de él, también lo vendemos; no te lo lleves escondido en la maleta.",
    escena: { tipo: "producto", imgs: ["pocillo"], nombres: PRODUCTOS, titulo: "Pocillo de porcelana Café Poli", datos: ["Para tomar en la mesa: cero desechables", "También se vende en la Tienda"] } },
  { id: "ropa", nodo: "tienda", mira: P.ropa, fov: 34, titulo: "Los colores de la casa",
    texto: "También vendemos, en consignación, productos oficiales del Poli: camisetas, chalecos y chaquetas, para que lleves los colores de la casa a todas partes.",
    escena: { tipo: "producto", imgs: ["camiseta", "chaleco", "chaqueta"], nombres: PRODUCTOS, titulo: "Productos oficiales del Poli", datos: ["Camisetas, chalecos y chaquetas", "En consignación: el Poli pone el producto"] } },
  { id: "detalles", nodo: "tienda", mira: P.detalles, fov: 34, titulo: "Para regalar",
    texto: "Y para regalar: llaveros y… el peluche de Poligreca. Sí, ya sé, soy adorable. No es por nada, pero va a ser el más vendido.",
    escena: { tipo: "producto", imgs: ["llavero", "peluche"], nombres: PRODUCTOS, titulo: "Llaveros y peluche de Poligreca", datos: ["Detalles para regalar", "Poligreca en peluche"] } },

  // ---------------------------------------------------------------- Modo Conexión
  { id: "arbol", nodo: "recogida", mira: [12.8, 1.5, 3.2], titulo: "Nos vemos en el árbol",
    texto: "Y este árbol se queda, como en la cafetería de hoy, sembrado en el centro de su mesa cuadrada. Es el punto de encuentro entre la barra y Modo Conexión: el clásico «nos vemos en el árbol»." },
  { id: "conexion", nodo: "parche", mira: P.sala, titulo: "Modo Conexión",
    texto: "Bienvenido a Modo Conexión, la zona para encontrarse. Mesas para dos y para cuatro que se juntan cuando llega el combo completo, hasta de ocho, una banca larga junto al ventanal y una barra alta frente a las ventanas del pasillo. Caben setenta y nueve personas sentadas y ocho de pie en las mesas altas del tinto rápido, y aun así queda espacio de sobra para caminar." },
  { id: "hornos", nodo: "parche", mira: P.hornos, fov: 50, titulo: "Los hornos se quedan",
    texto: "Al fondo están los hornos microondas, porque muchos traen el almuerzo de la casa, y eso se respeta. Los mantenemos y los organizamos, para que la fila del microondas no sea más larga que la de la cafetería." },
  { id: "juegos", nodo: "parche", mira: P.juegos, fov: 30, titulo: "Toma un juego, devuélvelo a su lugar",
    texto: "Y al lado, los juegos de mesa: parqués, dominó, ajedrez, Uno, Jenga y Rummikub. Los pides con tu carné y los devuelves a su casilla. El parqués, por ejemplo, es el clásico colombiano: cuatro jugadores, dos dados y amistades que se ponen a prueba. Y el Jenga es perfecto para la semana de parciales: si la torre se cae, échale la culpa al estrés." },
  { id: "televisores", nodo: "parche", mira: P.tvs, fov: 78, titulo: "Televisores que todos ven",
    texto: "Mira hacia arriba: en el centro cuelgan dos televisores de doble cara, así que todos los ven, desde la banca o desde cualquier mesa. De cada lado ves uno con canales nacionales en vivo, para el partido o las noticias, y otro con Poli TV. Y no los compramos: la cafetería ya los tiene, solo los reubicamos." },
  { id: "politv", nodo: "parche", mira: P.tvB, fov: 50, titulo: "Poli TV",
    texto: "Poli TV es nuestro canal. Pasa los cumpleaños del día, luego una transición del Poli, la agenda de la semana con torneos, charlas y ferias, y después las noticias y los logros de nuestra comunidad. Contenido nuestro, hecho para nosotros.",
    escena: { tipo: "tv", lista: "politv", tv: "politv", expandir: true, titulo: "Poli TV" } },
  { id: "cumple", nodo: "parche", titulo: "Cumpleaños: todos en grande",
    texto: "En cumpleaños, cada persona sale sola, en grande, con el mismo protagonismo: un nombre, una transición y el siguiente. Nadie es más importante que nadie, ni siquiera el profe. Solo sales si nos das permiso, y con tu compra de ese día la galleta del colibrí va por nuestra cuenta.",
    escena: { tipo: "tv", lista: "cumple", tv: "politv", titulo: "Poli TV · Cumpleaños" } },

  // ---------------------------------------------------------------- Reconocimientos
  { id: "logros", nodo: "logros", mira: [11.2, 1.5, 0.0], fov: 75, titulo: "Vitrina de reconocimientos",
    texto: "Ahora, la vitrina de reconocimientos. Aquí no hay trofeos de mentiras: son logros reales del Poli, en deportes, investigación, creatividad y negocios. Te muestro algunos, porque presumir de la casa también es parte del café." },
  pasoLogro(21), pasoLogro(22), pasoLogro(24), pasoLogro(20), pasoLogro(6), pasoLogro(17),
  { id: "logrosTodos", nodo: "logros", mira: [11.2, 1.5, 0.0], fov: 75, titulo: "Y hay muchos más",
    texto: "Y hay muchos más: veinticinco logros, de 2008 a 2026, cada uno con su fuente. Si quieres verlos todos, el botón está aquí abajo.",
    accion: { texto: "🏆 Ver todos los logros", tipo: "logros" } },

  // ---------------------------------------------------------------- Modo Avión
  { id: "division", nodo: "vestibulo", mira: [19.0, 1.4, 1.5], fov: 62, titulo: "Shhh: la entrada a Modo Avión",
    texto: "Ahora, silencio, que vamos a Modo Avión. Esta es su entrada: un muro privado de piso a techo, con jardín vertical y listones de madera, como el atrio del Poli. Detrás de esta puerta, el ruido de la cafetería no entra. Prometido." },
  { id: "avion", nodo: "avionEnt", mira: [25.5, 1.0, 2.0], titulo: "Modo Avión",
    texto: "Modo Avión es para concentrarse: luz cálida, techo de listones de madera que se come el ruido y mesas largas con lámpara. Entre mesas, puestos y sillones caben cuarenta y nueve personas, pensadas para la hora pico y la semana de parciales. Aquí no hay pantallas, ni siquiera la mía. Bueno, yo hablo pasito." },
  { id: "ventanal", nodo: "avion", mira: [21.9, 1.2, -4.5], titulo: "Tu puesto frente al ventanal",
    texto: "Frente al ventanal están los puestos individuales, con la celosía de madera de la fachada y luz natural para leer. Cada uno tiene su lámpara y su divisor de fieltro: tu propio mundo, sin que nadie te mire el examen." },

  // ---------------------------------------------------------------- Rincón Respira
  { id: "rincon", nodo: "rincon", mira: P.salaRincon, fov: 72, titulo: "Rincón Respira",
    texto: "Y al fondo, mi lugar secreto: el Rincón Respira. Ojo, no es una biblioteca, que esa ya la tiene el Poli. Es un espacio para despejar la mente entre clases: sillones, mesitas, un café, una torta… y nadie que te pregunte cómo te fue en el parcial." },
  { id: "libros", nodo: "rincon", mira: P.libros, fov: 46, titulo: "Toma un libro, deja otro",
    texto: "Los libros van por franjas de color, una por género: fantasía, ciencia ficción, historia, novela colombiana, poesía, cómic y crecimiento personal. Tomas uno y dejas otro. Los jóvenes de dieciocho a veinticuatro años son los que más leen en el país, así que aquí estás en buena compañía." },

  // ---------------------------------------------------------------- La marca
  { id: "marcaTv", nodo: "parche", mira: P.tvB, fov: 50, titulo: "Un especial en Poli TV",
    texto: "Antes de despedirme, te quiero contar de dónde sale nuestra marca. Volvamos a Poli TV, que hoy tiene un especial… ¡sobre nosotros! Entremos a la pantalla.",
    escena: { tipo: "logo", fase: "nombre", tv: "politv", expandir: true } },
  { id: "marcaNombre", nodo: "parche", titulo: "¿Por qué Café Poli?",
    texto: "¿Por qué Café Poli? Café, porque todo empieza en el café de origen, comprado directo a caficultores colombianos. Y Poli, porque este café es de la comunidad del Poli y está hecho para ella. Simple, ¿no? Lo bueno no necesita enredos.",
    escena: { tipo: "logo", fase: "nombre" } },
  { id: "marcaColibri", nodo: "parche", titulo: "Un colibrí",
    texto: "Nuestro símbolo es un colibrí. En Colombia viven unas ciento sesenta y cinco especies de colibríes, de las más de trescientas que hay. Y el colibrí recarga energía a cada rato para seguir volando… igualito que tú entre clase y clase, de día o de noche.",
    escena: { tipo: "logo", fase: "colibri" } },
  { id: "marcaGrano", nodo: "parche", titulo: "Mira bien el colibrí",
    texto: "Ahora mira bien el colibrí: su cuerpo es un grano de café, con su pliegue en forma de ese. Sus alas son los dos trazos curvos del símbolo del Poli, en cian y magenta. Y la tilde de café también es un grano. Sí, nos pusimos detallistas.",
    escena: { tipo: "logo", fase: "grano" } },
  { id: "marcaColores", nodo: "parche", titulo: "Los colores del Poli",
    texto: "Los colores son los del Poli. Manda el azul noche, que es la casa, con el cian. El magenta y el oro son acentos, y el verde cafetal aparece poquito, como las plantas. Por eso Café Poli no es todo azul: el azul nos identifica, y los acentos y la madera le dan la calidez de un café.",
    escena: { tipo: "logo", fase: "colores" } },
  { id: "marcaEslogan", nodo: "parche", titulo: "Somos origen. Somos país. Somos Poli.",
    texto: "Y el eslogan: Somos origen. Somos país. Somos Poli. Origen, por el café de nuestras fincas. País, porque aquí estudia gente de todas las regiones. Y Poli, porque este café es nuestro. Repítelo conmigo… bueno, no en voz alta, que estamos cerca de Modo Avión.",
    escena: { tipo: "logo", fase: "eslogan" } },

  // ---------------------------------------------------------------- Maqueta y cierre
  { id: "maqueta", nodo: "parche", titulo: "Café Poli en maqueta",
    texto: "Y así se ve Café Poli completo, como una maqueta. Arrástrala con el dedo o con el mouse para darle la vuelta, súbela para verla desde arriba y haz zoom para mirar los detalles. Dale, juega un rato, que esta sí no se rompe.",
    escena: { tipo: "maqueta" } },
  { id: "final", nodo: "vestibulo", mira: [17.65, 1.7, 0.0], titulo: "¡Nos vemos en el árbol!",
    texto: "Esto es Café Poli: Modo Conexión, la barra, Modo Avión y un rincón para respirar, en el segundo piso de City Campus. Si el testeo y la medición lo confirman, lo llevamos también a la sede principal. Gracias por la visita… y ya sabes: trae tu vaso. ¡Nos vemos en el árbol!",
    accion: { texto: "📱 Probar la app", tipo: "enlace", url: "app/" } },
];

const desde = (id) => PASOS.findIndex((p) => p.id === id);
export const CAPITULOS = [
  { nombre: "Bienvenida", desde: desde("entrada") },
  { nombre: "La barra y la carta", desde: desde("barra") },
  { nombre: "La app", desde: desde("qr") },
  { nombre: "Regala un Café Poli", desde: desde("regalo1") },
  { nombre: "Club Colibrí y tu vaso", desde: desde("appPuntos") },
  { nombre: "Bolsa del final del día", desde: desde("recogida") },
  { nombre: "Tienda Poli", desde: desde("tienda") },
  { nombre: "Modo Conexión", desde: desde("arbol") },
  { nombre: "Reconocimientos", desde: desde("logros") },
  { nombre: "Modo Avión", desde: desde("division") },
  { nombre: "Rincón Respira", desde: desde("rincon") },
  { nombre: "La marca", desde: desde("marcaTv") },
  { nombre: "La maqueta", desde: desde("maqueta") },
];
