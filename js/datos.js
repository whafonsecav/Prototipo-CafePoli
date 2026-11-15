// Datos del prototipo: carta (igual al modelo de rentabilidad) y paradas del recorrido.
// La carta está organizada en mundos de color: cada categoría trae su color, su lema y si va en la pestaña de bebidas o de comidas.

export const DESCUENTO_TERMO = 300;

export const CARTA = [
  { cat: "Cafés de origen", color: "#6B4226", tipo: "bebidas", lema: "Directo de la finca a tu taza, a precio de estudiante.", items: [
    { id: "tinto", nombre: "Tinto (7 oz)", precio: 2000, termo: true, cafe: true },
    { id: "campesino", nombre: "Tinto campesino con panela (7 oz)", precio: 2200, termo: true, cafe: true },
    { id: "leche", nombre: "Café con leche o perico (9 oz)", precio: 3500, termo: true, cafe: true },
    { id: "capu", nombre: "Capuchino (9 oz)", precio: 4500, termo: true, cafe: true },
    { id: "latte", nombre: "Latte de arequipe o vainilla (12 oz)", precio: 5500, termo: true, cafe: true },
    { id: "frio", nombre: "Café frío con panela (12 oz)", precio: 5000, termo: true, cafe: true },
  ]},
  { cat: "Energía para el parcial", color: "#E0006E", tipo: "bebidas", lema: "Para la semana de parciales: energía, pero con medida.", items: [
    { id: "parcial", nombre: "Café Parcial: doble espresso con panela y canela", precio: 4000, termo: true, cafe: true, nota: "Unos 125 mg de cafeína. Uno por persona." },
    { id: "espresso", nombre: "Espresso doble", precio: 3500, termo: true, cafe: true },
    { id: "cparcial", nombre: "Combo Parcial: Café Parcial + brownie", precio: 6500, termo: true, cafe: true },
  ]},
  { cat: "Ritual del té", color: "#4E8F3A", tipo: "bebidas", lema: "Una pausa sin afán, como en las casas de té de Bogotá.", items: [
    { id: "teNegro", nombre: "Té negro o Earl Grey (9 oz)", precio: 2500, termo: true },
    { id: "teVerde", nombre: "Té verde (9 oz)", precio: 2500, termo: true },
    { id: "frutos", nombre: "Infusión de frutos rojos (9 oz)", precio: 3000, termo: true },
    { id: "chai", nombre: "Chai latte (12 oz)", precio: 4500, termo: true },
    { id: "cata", nombre: "Cata de tres tés para compartir", precio: 6500, nota: "Tres tazas pequeñas para probar y conversar." },
  ]},
  { cat: "Bebidas de la casa", color: "#FBAF17", tipo: "bebidas", lema: "Lo de la casa colombiana, para los que no toman café.", items: [
    { id: "aroma", nombre: "Aromática de hierbabuena o limoncillo", precio: 1500, termo: true },
    { id: "panela", nombre: "Agua de panela con limón", precio: 2000, termo: true },
    { id: "choco", nombre: "Chocolate santafereño con queso (9 oz)", precio: 3500, termo: true },
    { id: "avena", nombre: "Avena fría (12 oz)", precio: 3000, termo: true },
    { id: "jugo", nombre: "Jugo natural en agua (12 oz)", precio: 3500, termo: true },
  ]},
  { cat: "Antojos colombianos", color: "#0F385A", tipo: "comidas", lema: "Recién horneado y bien nuestro, del desayuno a la tarde.", items: [
    { id: "pan", nombre: "Pan de bono", precio: 2000 },
    { id: "panyuca", nombre: "Pan de yuca", precio: 2000 },
    { id: "bunuelo", nombre: "Buñuelo", precio: 1800 },
    { id: "almojabana", nombre: "Almojábana", precio: 2000 },
    { id: "arepa", nombre: "Arepa de queso", precio: 3000 },
    { id: "boyacense", nombre: "Arepa boyacense", precio: 3800 },
    { id: "arepahuevo", nombre: "Arepa con huevo", precio: 4000 },
    { id: "empanada", nombre: "Empanada", precio: 2500 },
    { id: "sandwich", nombre: "Sándwich de jamón y queso", precio: 6000 },
  ]},
  { cat: "Postres para compartir", color: "#15BECE", tipo: "comidas", lema: "De la tarde a la noche: un postre, dos tenedores y la conversación.", items: [
    { id: "tortica", nombre: "Tortica del día", precio: 3500 },
    { id: "zanahoria", nombre: "Torta de zanahoria", precio: 4500 },
    { id: "cheesecake", nombre: "Cheesecake de frutos rojos", precio: 5500 },
    { id: "brownie", nombre: "Brownie", precio: 3000 },
    { id: "galletas", nombre: "Galletas de la casa", precio: 2000 },
    { id: "postre2", nombre: "Postre para dos: 2 porciones + 2 tenedores", precio: 8500 },
    { id: "fruta", nombre: "Fruta picada", precio: 3500 },
  ]},
  { cat: "Combos", color: "#A6CE38", tipo: "comidas", lema: "Junta lo de siempre y ahorra un poco.", items: [
    { id: "pausa", nombre: "La pausa: tinto + pan de bono", precio: 3800, termo: true, cafe: true },
    { id: "desayuno", nombre: "Desayuno de la casa: café con leche + arepa con huevo", precio: 6500, termo: true, cafe: true },
    { id: "tardecata", nombre: "Tarde de cata: cata de tres tés + postre para dos", precio: 13500 },
  ]},
  { cat: "Tienda Café Poli", color: "#5C6B7A", tipo: "comidas", lema: "Trae tu termo: cada bebida vale $300 menos.", nota: "Además, productos oficiales del Poli en consignación.", items: [
    { id: "vaso", nombre: "Vaso reutilizable Café Poli (12 oz)", precio: 12000 },
    { id: "termo", nombre: "Termo Café Poli de acero (350 ml)", precio: 28000 },
  ]},
];

export const DETALLE_REGALO = { nombre: "Tarjeta impresa con tu mensaje + chocolatina", precio: 2500 };

export const fmt = (n) => "$" + Math.round(n).toLocaleString("es-CO");
