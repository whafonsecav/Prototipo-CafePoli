// Datos del prototipo: carta (igual al modelo de rentabilidad) por mundos de color.
// Cada categoría trae su color, su lema y si va en la pestaña de bebidas o de comidas.
// Las bebidas se venden por tamaño (onzas). Si traes tu propio vaso (o termo), cualquier tamaño vale $300 menos:
// el campo «termo: true» significa que la bebida aplica a ese descuento por traer tu vaso.

export const DESCUENTO_TERMO = 300; // descuento por traer tu vaso, en cualquier tamaño
export const DESCUENTO_VASO = DESCUENTO_TERMO;
// Aumento sobre el precio del tamaño base: un tamaño más, dos tamaños más (igual que en el Excel)
export const TAMANO_INC = [0, 800, 1500];
export const TAMANOS_OZ = [7, 8, 9, 12, 16];

// i(id, nombre, precio base, { oz: [tamaños], grupo, termo, cafe, nota })
const i = (id, nombre, precio, o = {}) => {
  const it = { id, nombre, precio, ...o };
  if (o.oz) it.tamanos = o.oz.map((oz, k) => ({ oz, precio: precio + TAMANO_INC[k] }));
  delete it.oz;
  return it;
};
const B = { termo: true }; // bebida que aplica «trae tu vaso −$300»

export const CARTA = [
  { cat: "Cafés de origen", color: "#6B4226", tipo: "bebidas", icono: "taza", lema: "Directo de la finca a tu taza, a precio de estudiante.", items: [
    i("tinto", "Tinto", 2000, { ...B, cafe: true, oz: [7, 12, 16] }),
    i("campesino", "Tinto campesino con panela", 2200, { ...B, cafe: true, oz: [7, 12, 16] }),
    i("leche", "Café con leche o perico", 3500, { ...B, cafe: true, oz: [9, 12, 16] }),
    i("capu", "Capuchino", 4500, { ...B, cafe: true, oz: [9, 12, 16] }),
    i("latte", "Latte de arequipe o vainilla", 5500, { ...B, cafe: true, oz: [12, 16] }),
    i("frio", "Café frío con panela", 5000, { ...B, cafe: true, oz: [12, 16] }),
  ]},
  { cat: "Energía para el parcial", color: "#E0006E", tipo: "bebidas", icono: "rayo", lema: "Para la semana de parciales: energía, pero con medida.", items: [
    i("parcial", "Café Parcial: doble espresso con panela y canela", 4000, { ...B, cafe: true, oz: [9], nota: "Unos 125 mg de cafeína. Uno por persona." }),
    i("espresso", "Espresso doble", 3500, { ...B, cafe: true, oz: [2] }),
    i("cparcial", "Combo Parcial: Café Parcial + brownie", 6500, { ...B, cafe: true }),
  ]},
  { cat: "Ritual del té", color: "#A6CE38", tipo: "bebidas", icono: "tetera", lema: "Dieciséis tés e infusiones para una pausa sin afán.", nota: "Té en hoja, servido en tetera de vidrio para tomar aquí.", items: [
    i("teNegro", "Té negro English Breakfast", 2500, { ...B, grupo: "Negros", oz: [9, 12, 16] }),
    i("earlgrey", "Earl Grey con bergamota", 2500, { ...B, grupo: "Negros", oz: [9, 12, 16] }),
    i("teVerde", "Té verde sencha", 2500, { ...B, grupo: "Verdes y blanco", oz: [9, 12, 16] }),
    i("jazmin", "Té verde con jazmín", 2800, { ...B, grupo: "Verdes y blanco", oz: [9, 12, 16] }),
    i("blanco", "Té blanco con pétalos", 3200, { ...B, grupo: "Verdes y blanco", oz: [9, 12, 16] }),
    i("rooibos", "Rooibos con vainilla", 3000, { ...B, grupo: "Frutales y sin cafeína", oz: [9, 12, 16] }),
    i("frutos", "Infusión de frutos rojos", 3000, { ...B, grupo: "Frutales y sin cafeína", oz: [9, 12, 16] }),
    i("maracuya", "Infusión de maracuyá y mango", 3000, { ...B, grupo: "Frutales y sin cafeína", oz: [9, 12, 16] }),
    i("manzanilla", "Manzanilla con miel", 2200, { ...B, grupo: "Frutales y sin cafeína", oz: [9, 12, 16] }),
    i("jengibre", "Jengibre, limón y miel", 2800, { ...B, grupo: "Frutales y sin cafeína", oz: [9, 12, 16] }),
    i("jamaica", "Flor de Jamaica con canela", 2800, { ...B, grupo: "Frutales y sin cafeína", oz: [9, 12, 16] }),
    i("chai", "Chai latte", 4500, { ...B, grupo: "Lattes de té", oz: [12, 16] }),
    i("matcha", "Matcha latte", 5500, { ...B, grupo: "Lattes de té", oz: [12, 16] }),
    i("teHelado", "Té negro helado de durazno", 4000, { ...B, grupo: "Helados", oz: [12, 16] }),
    i("teMaracuya", "Té verde helado con maracuyá", 4000, { ...B, grupo: "Helados", oz: [12, 16] }),
    i("cata", "Cata de tres tés para compartir", 6500, { grupo: "Para compartir", nota: "Tres tazas pequeñas para probar y conversar." }),
  ]},
  { cat: "Bebidas de la casa", color: "#FBAF17", tipo: "bebidas", icono: "olla", lema: "Lo de la casa colombiana, para los que no toman café.", items: [
    i("aroma", "Aromática de hierbabuena o limoncillo", 1500, { ...B, oz: [9, 12, 16] }),
    i("panela", "Agua de panela con limón, caliente o fría", 2000, { ...B, oz: [9, 12, 16] }),
    i("choco", "Chocolate santafereño con queso", 3500, { ...B, oz: [9, 12] }),
    i("milo", "Milo caliente", 3500, { ...B, oz: [9, 12, 16] }),
    i("miloFrio", "Milo frío", 4500, { ...B, oz: [12, 16] }),
    i("avena", "Avena fría", 3000, { ...B, oz: [12, 16] }),
    i("jugo", "Jugo natural en agua", 3500, { ...B, oz: [12, 16] }),
  ]},
  { cat: "Antojos colombianos", color: "#0F385A", tipo: "comidas", icono: "pan", lema: "Recién horneado y bien nuestro, del desayuno a la tarde.", items: [
    i("pan", "Pan de bono", 2000),
    i("panyuca", "Pan de yuca", 2000),
    i("bunuelo", "Buñuelo", 1800),
    i("almojabana", "Almojábana", 2000),
    i("arepa", "Arepa de queso", 3000),
    i("boyacense", "Arepa boyacense", 3800),
    i("arepahuevo", "Arepa con huevo", 4000),
    i("empanada", "Empanada", 2500),
    i("sandwich", "Sándwich de jamón y queso", 6000),
  ]},
  { cat: "Postres para compartir", color: "#15BECE", tipo: "comidas", icono: "torta", lema: "De la tarde a la noche: un postre, dos tenedores y la conversación.", items: [
    i("tortica", "Tortica del día", 3500),
    i("zanahoria", "Torta de zanahoria", 4500),
    i("cheesecake", "Cheesecake de frutos rojos", 5500),
    i("brownie", "Brownie", 3000),
    i("galletas", "Galletas de la casa", 2000),
    i("postre2", "Postre para dos: 2 porciones + 2 tenedores", 8500),
    i("fruta", "Fruta picada", 3500),
  ]},
  { cat: "Combos", color: "#1A4B74", tipo: "comidas", icono: "combo", lema: "Junta lo de siempre y ahorra un poco.", items: [
    i("pausa", "La pausa: tinto + pan de bono", 3800, { ...B, cafe: true }),
    i("desayuno", "Desayuno de la casa: café con leche + arepa con huevo", 6500, { ...B, cafe: true }),
    i("tardecata", "Tarde de cata: cata de tres tés + postre para dos", 13500),
  ]},
  { cat: "Tienda Café Poli", color: "#5C6B7A", tipo: "comidas", icono: "vaso", lema: "Trae tu propio vaso: cualquier bebida, en cualquier tamaño, vale $300 menos.", nota: "Para tomar aquí te servimos en pocillo de porcelana. Además, productos oficiales del Poli en consignación: camisetas, chalecos, chaquetas, llaveros y peluches de Poligreca.", items: [
    i("vaso", "Vaso reutilizable Café Poli (8, 12 o 16 oz)", 12000, { nota: "8 oz $10.000 · 12 oz $12.000 · 16 oz $14.000" }),
    i("termo", "Termo Café Poli de acero (12 oz)", 28000),
    i("pocillo", "Pocillo de porcelana Café Poli (9 oz)", 18000),
  ]},
];

// Precios del vaso reutilizable por tamaño (igual que en el Excel)
export const VASOS = [{ oz: 8, precio: 10000 }, { oz: 12, precio: 12000 }, { oz: 16, precio: 14000 }];

export const DETALLE_REGALO = { nombre: "Tarjeta impresa con tu mensaje + chocolatina", precio: 2500 };

export const fmt = (n) => "$" + Math.round(n).toLocaleString("es-CO");

// Texto corto del tamaño: «7 oz», «12 oz»…
export const ozTxt = (oz) => `${oz} oz`;
