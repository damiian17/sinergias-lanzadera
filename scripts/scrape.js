/**
 * Re-escrapea el directorio de startups de Lanzadera y vuelca data/startups.csv.
 *
 * Lanzadera corre WordPress y expone el custom post type `startups` en su REST API,
 * así que no hace falta parsear HTML. Pégalo en la consola del navegador con
 * https://lanzadera.es/startups/ abierto y copia la salida, o ejecútalo con Node
 * (Node 18+ trae fetch) desde una red con salida a lanzadera.es:
 *
 *   node scripts/scrape.js > data/startups.csv
 */
const BASE = "https://lanzadera.es/wp-json/wp/v2";

const clean = (s) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/&#8217;|&#039;|&#39;/g, "'")
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function terms(tax) {
  const out = {};
  for (let page = 1; ; page++) {
    const res = await fetch(`${BASE}/${tax}?per_page=100&page=${page}`);
    if (!res.ok) break;
    const list = await res.json();
    for (const t of list) out[t.id] = clean(t.name);
    if (list.length < 100) break;
  }
  return out;
}

async function main() {
  const [sectores, batches] = await Promise.all([terms("sectores"), terms("batch")]);
  const rows = [];
  for (let page = 1; ; page++) {
    const url = `${BASE}/startups?per_page=100&page=${page}` +
                `&_fields=title,link,excerpt,sectores,batch`;
    const res = await fetch(url);
    if (!res.ok) break;
    const list = await res.json();
    for (const s of list) {
      rows.push([
        clean(s.title.rendered),
        (s.sectores || []).map((id) => sectores[id]).filter(Boolean).join("/") || "Sin definir",
        (s.batch || []).map((id) => batches[id]).filter(Boolean).join("/") || "Alumni",
        clean(s.excerpt.rendered) || "Sin descripción publicada en la ficha.",
        s.link.replace(/.*\/startups\//, "").replace(/\/$/, ""),
      ]);
    }
    if (list.length < 100) break;
  }
  const q = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [["nombre","sector","cohorte","descripcion","slug"], ...rows]
    .map((r) => r.map(q).join(","))
    .join("\n");
  if (typeof process !== "undefined" && process.stdout) process.stdout.write(csv + "\n");
  else console.log(csv);
  console.error(`${rows.length} startups`);
}

main();
