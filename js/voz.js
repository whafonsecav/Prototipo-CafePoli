// Voz pregrabada de Poligreca. La clave de cada audio es un hash del texto (espacios colapsados): si el texto cambia,
// no hay audio y el recorrido usa la voz del navegador. Lo regenera scripts/generar_voz.py (ver abajo del archivo).
export function claveVoz(texto) {
  const s = String(texto).replace(/\s+/g, " ").trim();
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
// ==== MANIFIESTO (lo escribe scripts/generar_voz.py; no editar a mano)
export const VOZ = {
  "112djf3goaq": "audio/112djf3goaq.mp3",
  "15yw4je3054": "audio/15yw4je3054.mp3",
  "19934un3xup": "audio/19934un3xup.mp3",
  "19uyapho1td": "audio/19uyapho1td.mp3",
  "1aalzdf77hh": "audio/1aalzdf77hh.mp3",
  "1auvdsygpm5": "audio/1auvdsygpm5.mp3",
  "1dypys83b0m": "audio/1dypys83b0m.mp3",
  "1f7qljy1wi0": "audio/1f7qljy1wi0.mp3",
  "1fdrpikmsep": "audio/1fdrpikmsep.mp3",
  "1gexymo39fy": "audio/1gexymo39fy.mp3",
  "1h58rzo7lpa": "audio/1h58rzo7lpa.mp3",
  "1io45hrmz3j": "audio/1io45hrmz3j.mp3",
  "1ityjp4gewe": "audio/1ityjp4gewe.mp3",
  "1j49gs6rves": "audio/1j49gs6rves.mp3",
  "1kjxef4020a": "audio/1kjxef4020a.mp3",
  "1kk94yi9a33": "audio/1kk94yi9a33.mp3",
  "1kv9cuxm0cp": "audio/1kv9cuxm0cp.mp3",
  "1lm9lk3y6cw": "audio/1lm9lk3y6cw.mp3",
  "1lqrqo2pjg7": "audio/1lqrqo2pjg7.mp3",
  "1maau4ml3e8": "audio/1maau4ml3e8.mp3",
  "1mamqx018ul": "audio/1mamqx018ul.mp3",
  "1mfcqr7x8se": "audio/1mfcqr7x8se.mp3",
  "1mgc8a1tqol": "audio/1mgc8a1tqol.mp3",
  "1msz8aifb9t": "audio/1msz8aifb9t.mp3",
  "1nrppzib61s": "audio/1nrppzib61s.mp3",
  "1oy5zozqlyd": "audio/1oy5zozqlyd.mp3",
  "1oz11sujxpo": "audio/1oz11sujxpo.mp3",
  "1ue1icap43b": "audio/1ue1icap43b.mp3",
  "1x1iu695vb6": "audio/1x1iu695vb6.mp3",
  "1x6ydh9di6g": "audio/1x6ydh9di6g.mp3",
  "1yl8ycc3600": "audio/1yl8ycc3600.mp3",
  "1z68jyqq57q": "audio/1z68jyqq57q.mp3",
  "1z9o9havl76": "audio/1z9o9havl76.mp3",
  "204ptuh333j": "audio/204ptuh333j.mp3",
  "21g6xjvhirf": "audio/21g6xjvhirf.mp3",
  "2201tdoz111": "audio/2201tdoz111.mp3",
  "22nvbczgdyl": "audio/22nvbczgdyl.mp3",
  "22v4qfccvmz": "audio/22v4qfccvmz.mp3",
  "23vfbupaw38": "audio/23vfbupaw38.mp3",
  "24dsinpcdot": "audio/24dsinpcdot.mp3",
  "25c3gwnyeqw": "audio/25c3gwnyeqw.mp3",
  "25e0a51jpx2": "audio/25e0a51jpx2.mp3",
  "25vdlel1xy0": "audio/25vdlel1xy0.mp3",
  "2678gg1thrt": "audio/2678gg1thrt.mp3",
  "27vvp1xu759": "audio/27vvp1xu759.mp3",
  "28fd77ok77f": "audio/28fd77ok77f.mp3",
  "2a78lac95yr": "audio/2a78lac95yr.mp3",
  "2bo2uamq5yf": "audio/2bo2uamq5yf.mp3",
  "2c8grtsaizi": "audio/2c8grtsaizi.mp3",
  "2d86awr91w0": "audio/2d86awr91w0.mp3",
  "2eiipzxxyt7": "audio/2eiipzxxyt7.mp3",
  "2feb926zhqi": "audio/2feb926zhqi.mp3",
  "2gkhf2g32oe": "audio/2gkhf2g32oe.mp3",
  "37boo22brd": "audio/37boo22brd.mp3",
  "4mjbu4n74w": "audio/4mjbu4n74w.mp3",
  "5nuqd7t5sc": "audio/5nuqd7t5sc.mp3",
  "97cp7oa161": "audio/97cp7oa161.mp3",
  "a56g5rrd4k": "audio/a56g5rrd4k.mp3",
  "aa2h37stnv": "audio/aa2h37stnv.mp3",
  "bfvdk6441f": "audio/bfvdk6441f.mp3",
  "dc40brvmyx": "audio/dc40brvmyx.mp3",
  "dfzavowayo": "audio/dfzavowayo.mp3",
  "g4nk6h59u": "audio/g4nk6h59u.mp3",
  "gkut76vdaw": "audio/gkut76vdaw.mp3",
  "i1xmruidkh": "audio/i1xmruidkh.mp3",
  "j3sui38hiq": "audio/j3sui38hiq.mp3",
  "ksmarsracx": "audio/ksmarsracx.mp3",
  "lqey5tuwny": "audio/lqey5tuwny.mp3",
  "n4ywt7jtu2": "audio/n4ywt7jtu2.mp3",
  "ngq1h6echq": "audio/ngq1h6echq.mp3",
  "njlq36clg": "audio/njlq36clg.mp3",
  "p5bai1y7ll": "audio/p5bai1y7ll.mp3",
  "qxoi8h7876": "audio/qxoi8h7876.mp3",
  "rmdowcgv4p": "audio/rmdowcgv4p.mp3",
  "t7o3yt2lga": "audio/t7o3yt2lga.mp3",
  "teun6l01bn": "audio/teun6l01bn.mp3",
  "v43ewadl8m": "audio/v43ewadl8m.mp3",
  "vbq7nzep5n": "audio/vbq7nzep5n.mp3"
};
