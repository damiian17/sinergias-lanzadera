/**
 * Escrapea el HISTÓRICO de Lanzadera (/proyecto/), que NO está expuesto en la REST API:
 * el post type `proyecto` tiene show_in_rest desactivado, así que la lista sale de los
 * sitemaps de Yoast y cada ficha se lee de su propio HTML (<title> + meta description).
 *
 *   node scripts/scrape-historico.js > data/historico.csv
 *
 * También funciona pegado en la consola del navegador con lanzadera.es abierto, que es
 * la vía a usar si tu red no llega al dominio. Descarta los slugs que ya están en
 * data/startups.csv para no duplicar: las ~109 fichas que viven en los dos catálogos.
 */
const BASE = "https://lanzadera.es";
const MAPS = ["/proyecto-sitemap.xml", "/proyecto-sitemap2.xml"];
const CONCURRENCY = 12;

const ENT = { "&amp;":"&", "&#038;":"&", "&quot;":'"', "&#8217;":"'", "&#039;":"'",
              "&#8211;":"-", "&#8212;":"-", "&hellip;":"…", "&nbsp;":" " };
const dec = (s) => String(s ?? "").replace(/&[#a-z0-9]+;/gi, (m) => ENT[m] ?? m);

/** La meta description de Yoast es el excerpt entero. Lo cortamos a una o dos frases. */
function trim(d) {
  let t = dec(d).replace(/\s*\[[^\]]*…\]\s*$/, "").replace(/\s+/g, " ").trim();
  if (t.length <= 200) return t;
  const cut = t.slice(0, 200);
  const dot = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return (dot > 90 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, "") + "…").trim();
}

async function slugs() {
  const out = [];
  for (const m of MAPS) {
    const xml = await fetch(BASE + m).then((r) => (r.ok ? r.text() : ""));
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g))
      out.push(loc.replace(/.*\/proyecto\//, "").replace(/\/$/, ""));
  }
  return out;
}

async function ficha(slug) {
  try {
    const h = await fetch(`${BASE}/proyecto/${slug}/`).then((r) => (r.ok ? r.text() : null));
    if (!h) return null;
    const ti = (h.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "";
    const de = (h.match(/<meta name="description" content="([^"]*)"/i) || [])[1]
            || (h.match(/<meta property="og:description" content="([^"]*)"/i) || [])[1] || "";
    return {
      // el <title> arrastra colas de SEO tipo " - Lanzadera apoyo a emprendedores"
      nombre: dec(ti).replace(/\s*[-–]\s*lanzadera.*$/i, "").replace(/\s+/g, " ").trim() || slug,
      descripcion: de ? trim(de) : "Sin descripción publicada en la ficha.",
      slug,
    };
  } catch { return null; }
}

async function main() {
  const list = await slugs();
  const rows = new Array(list.length);
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < list.length) { const k = i++; rows[k] = await ficha(list[k]); }
  }));
  const q = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [["nombre","sector","cohorte","descripcion","slug"].join(",")]
    .concat(rows.filter(Boolean).map((r) =>
      [r.nombre, "Sin definir", "Histórico", r.descripcion, r.slug].map(q).join(",")))
    .join("\n");
  if (typeof process !== "undefined" && process.stdout) process.stdout.write(csv + "\n");
  else console.log(csv);
  console.error(`${rows.filter(Boolean).length} fichas del histórico`);
}

main();
