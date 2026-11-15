// Datos del prototipo: carta (igual al modelo de rentabilidad) y paradas del recorrido.

export const DESCUENTO_TERMO = 300;

export const CARTA = [
  { cat: "Bebidas calientes", items: [
    { id: "tinto", nombre: "Tinto (7 oz)", precio: 2000, termo: true, cafe: true },
    { id: "leche", nombre: "Café con leche o perico (9 oz)", precio: 3500, termo: true, cafe: true },
    { id: "capu", nombre: "Capuchino (9 oz)", precio: 4500, termo: true, cafe: true },
    { id: "latte", nombre: "Latte de arequipe o vainilla (12 oz)", precio: 5500, termo: true, cafe: true },
    { id: "parcial", nombre: "Café Parcial: doble carga con panela y canela", precio: 4000, termo: true, cafe: true, nota: "Unos 125 mg de cafeína. Uno por persona." },
    { id: "choco", nombre: "Chocolate caliente (9 oz)", precio: 3500, termo: true },
    { id: "aroma", nombre: "Aromática o té", precio: 1500, termo: true },
    { id: "panela", nombre: "Agua de panela con limón", precio: 2000, termo: true },
  ]},
  { cat: "Bebidas frías", items: [
    { id: "frio", nombre: "Café frío con panela (12 oz)", precio: 5000, termo: true, cafe: true },
    { id: "jugo", nombre: "Jugo natural en agua o limonada (12 oz)", precio: 3500, termo: true },
  ]},
  { cat: "Para comer", items: [
    { id: "pan", nombre: "Pan del día: almojábana, pan de bono o de queso", precio: 2000 },
    { id: "arepa", nombre: "Arepa con queso", precio: 3000 },
    { id: "empanada", nombre: "Empanada", precio: 2500 },
    { id: "sandwich", nombre: "Sándwich de jamón y queso", precio: 6000 },
    { id: "croissant", nombre: "Croissant", precio: 3500 },
    { id: "brownie", nombre: "Brownie o galletas de la casa", precio: 3000 },
    { id: "fruta", nombre: "Fruta picada", precio: 3500 },
  ]},
  { cat: "Combos", items: [
    { id: "pausa", nombre: "La pausa: tinto + pan del día", precio: 3800, termo: true, cafe: true },
    { id: "desayuno", nombre: "Desayuno de la casa: café con leche + arepa con queso", precio: 6000, termo: true, cafe: true },
    { id: "cparcial", nombre: "Combo Parcial: Café Parcial + brownie", precio: 6500, termo: true, cafe: true },
  ]},
  { cat: "Tienda Café Poli", items: [
    { id: "vaso", nombre: "Vaso reutilizable Café Poli (12 oz)", precio: 12000 },
    { id: "termo", nombre: "Termo Café Poli de acero (350 ml)", precio: 28000 },
  ]},
];

export const DETALLE_REGALO = { nombre: "Tarjeta impresa con tu mensaje + chocolatina", precio: 2500 };

export const fmt = (n) => "$" + Math.round(n).toLocaleString("es-CO");

