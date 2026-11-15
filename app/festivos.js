// Festivos de Colombia para cualquier año (Ley 51 de 1983, «Ley Emiliani»), calculados sin internet.
// Fijos; trasladables al lunes siguiente; y los que dependen de la Pascua.

const clave = (a, m, d) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const sumarDias = (f, n) => { const x = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate() + n)); return x; };
const aClave = (f) => clave(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate());

// Domingo de Pascua (algoritmo anónimo gregoriano)
function pascua(a) {
  const A = a % 19, B = Math.floor(a / 100), C = a % 100, D = Math.floor(B / 4), E = B % 4;
  const F = Math.floor((B + 8) / 25), G = Math.floor((B - F + 1) / 3), H = (19 * A + B - D - G + 15) % 30;
  const I = Math.floor(C / 4), K = C % 4, L = (32 + 2 * E + 2 * I - H - K) % 7, M = Math.floor((A + 11 * H + 22 * L) / 451);
  const mes = Math.floor((H + L - 7 * M + 114) / 31), dia = ((H + L - 7 * M + 114) % 31) + 1;
  return new Date(Date.UTC(a, mes - 1, dia));
}
// lleva la fecha al lunes siguiente si no cae en lunes
function alLunes(f) { const d = f.getUTCDay(); return d === 1 ? f : sumarDias(f, (8 - d) % 7); }

const cache = new Map();
export function festivosDe(a) {
  if (cache.has(a)) return cache.get(a);
  const m = new Map();
  const poner = (f, nombre) => m.set(aClave(f), nombre);
  const fecha = (mes, dia) => new Date(Date.UTC(a, mes - 1, dia));
  // fijos
  poner(fecha(1, 1), "Año Nuevo");
  poner(fecha(5, 1), "Día del Trabajo");
  poner(fecha(7, 20), "Día de la Independencia");
  poner(fecha(8, 7), "Batalla de Boyacá");
  poner(fecha(12, 8), "Inmaculada Concepción");
  poner(fecha(12, 25), "Navidad");
  // trasladables al lunes (Ley Emiliani)
  poner(alLunes(fecha(1, 6)), "Reyes Magos");
  poner(alLunes(fecha(3, 19)), "San José");
  poner(alLunes(fecha(6, 29)), "San Pedro y San Pablo");
  poner(alLunes(fecha(8, 15)), "Asunción de la Virgen");
  poner(alLunes(fecha(10, 12)), "Día de la Raza");
  poner(alLunes(fecha(11, 1)), "Todos los Santos");
  poner(alLunes(fecha(11, 11)), "Independencia de Cartagena");
  // según la Pascua
  const p = pascua(a);
  poner(sumarDias(p, -3), "Jueves Santo");
  poner(sumarDias(p, -2), "Viernes Santo");
  poner(sumarDias(p, 43), "Ascensión del Señor");
  poner(sumarDias(p, 64), "Corpus Christi");
  poner(sumarDias(p, 71), "Sagrado Corazón");
  cache.set(a, m);
  return m;
}
/** Nombre del festivo si la fecha (año, mes 1-12, día) es festivo en Colombia; si no, null. */
export function festivo(a, mes, dia) { return festivosDe(a).get(clave(a, mes, dia)) || null; }
/** Día de la semana (0 = domingo) */
export function diaSemana(a, mes, dia) { return new Date(Date.UTC(a, mes - 1, dia)).getUTCDay(); }
/** Hábil para Café Poli: de lunes a sábado y no festivo. */
export function esHabil(a, mes, dia) { return diaSemana(a, mes, dia) !== 0 && !festivo(a, mes, dia); }
/** Explicación corta del tipo de día */
export function tipoDeDia(a, mes, dia) {
  const f = festivo(a, mes, dia);
  if (f) return { habil: false, motivo: `festivo (${f})` };
  if (diaSemana(a, mes, dia) === 0) return { habil: false, motivo: "domingo" };
  return { habil: true, motivo: "día hábil" };
}
