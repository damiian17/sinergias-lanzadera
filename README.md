# Sinergias Lanzadera

**Radar de Sinergias** — motor de compatibilidad sobre el portfolio público de [Lanzadera](https://lanzadera.es/startups/). Eliges una empresa base de las 1.496 y puntúa las otras 1.495 contra ella, clasificando cada par como competidor, aliado comercial, proveedor, cliente potencial o espejo de modelo.

`index.html` no necesita servidor ni build en tiempo de ejecución: es HTML autónomo. Ábrelo con doble clic o publícalo en GitHub Pages.

## Cómo puntúa el radar

Cada ficha se etiqueta a partir de su descripción pública en dos ejes:

- **Público** — a quién vende: clínicas y sanidad, negocio de calle, hostelería, industria, inmobiliario, educación, empresa B2B…
- **Función** — qué hace: IA y agentes, voz, marketing, gestión, datos, cumplimiento, pagos, hardware…

Con esas etiquetas, para cada par (base → candidata) se suma:

| Señal | Peso | Detalle |
|---|---|---|
| Público compartido | hasta 38 | Ponderado por especificidad (IDF): compartir «clínicas y sanidad» vale mucho más que compartir «empresa B2B» |
| Complementariedad | hasta 24 | Funciones que la candidata aporta y la base no cubre. Escalado por el público compartido: complementar a quien no te compra no sirve |
| Encaje proveedor | hasta 16 | Infraestructura, seguridad, cumplimiento, pagos, datos o personas |
| Espejo de modelo | 20 | Sin público común pero misma función: playbook transferible |
| Léxico de nicho | hasta 21 | Palabras poco frecuentes que las dos fichas usan literalmente («dental», «licitaciones») |
| Mismo sector / cohorte | 6 / 9 | La cohorte compartida importa: son gente a la que puedes ver esta semana |

Solo se listan los pares que llegan a una **fuerza mínima**, ajustable en la barra lateral: solo fuerte (60+), media-alta (45+, por defecto) o todas (22+).

Dos cautelas que el motor aplica antes de decir «mismo público»: si las dos fichas tienen el público **inferido del sector** en vez de leído de su descripción, eso no cuenta como coincidencia — son dos incógnitas, no un cruce; y «empresa B2B» pesa un tercio, porque es un cajón de sastre y no un comprador concreto. Sin esto, las 400 fichas sin señal de público se emparejaban entre sí y una hamburguesería salía como aliado comercial de una startup de IA.

Los resultados salen en **dos listas separadas**, catálogo activo e histórico, y nunca mezclados en un mismo ranking: las fichas del histórico traen más texto y por eso puntúan algo más alto de lo que merecen, y además muchas de esas empresas ya no operan. Comparar un vecino de cohorte con una empresa que cerró hace cinco años en la misma tabla no ayuda a decidir nada.

El total se multiplica por un factor según el tipo de relación, de modo que un «cliente potencial» no compite en la lista con un «aliado comercial». Un solapamiento de función alto sobre el mismo público **no resta**: cambia la etiqueta a competidor, que es igual de accionable.

Toda la lógica está en `src/app.template.html`, en los bloques `AUD`, `CAP` y la función `evaluate()`.

### Lo que este cribado no es

Es un filtro heurístico sobre **una o dos frases por empresa** — las que Lanzadera publica en su ficha. Sirve para decidir a quién mirar, no para decidir nada más. Además, las 947 del histórico no tienen sector ni cohorte publicados y 163 de las activas tienen el sector «Por definir»; ahí el motor infiere el público del sector y pondera esa señal a la baja a propósito.

## Los datos

`data/startups.csv` y `data/startups.json` — 1.496 fichas. Columnas: `nombre`, `sector`, `cohorte`, `descripcion`, `slug`. Las descripciones son literales de la fuente.

Vienen de **dos catálogos distintos** que Lanzadera publica por separado:

| Catálogo | Fichas | URL | Cómo se obtiene |
|---|---|---|---|
| Activo | 549 | `/startups/<slug>/` | API REST de WordPress: el post type `startups` está expuesto, con sector y cohorte como taxonomías |
| Histórico | 947 | `/proyecto/<slug>/` | El post type `proyecto` **no** está en la REST API. La lista sale de `proyecto-sitemap.xml` y cada ficha de su propio HTML |

El histórico son 1.056 fichas, de las que 109 ya existen en el catálogo activo bajo los dos URLs; esas se descartan al fusionar. Las del histórico llevan `cohorte` = `Histórico` y `sector` = `Sin definir`, porque esas páginas no publican ninguno de los dos, y el radar enlaza cada una a su catálogo de origen.

## Regenerar

```bash
# 1. volver a escrapear (necesita salida a lanzadera.es)
node scripts/scrape.js > data/startups.csv            # catálogo activo
node scripts/scrape-historico.js > data/historico.csv  # histórico
# fusiona historico.csv en startups.csv descartando slugs repetidos, y después:
python3 scripts/csv_to_json.py

# 2. reconstruir la página desde src/
python3 scripts/build.py
```

`scripts/build.py` inyecta el dataset en `src/app.template.html` (marcador `__DATA__`) y lo envuelve en un documento HTML completo. Edita siempre `src/`, nunca el `index.html` de la raíz: se sobrescribe en cada build.

## Estructura

```
data/startups.csv            1.496 fichas, fuente de verdad
data/startups.json           lo mismo en JSON, es lo que consume el build
src/app.template.html        radar: estilos, taxonomía, motor y UI
scripts/scrape.js            catálogo activo, desde la API REST de Lanzadera
scripts/scrape-historico.js  histórico, desde los sitemaps + el HTML de cada ficha
scripts/csv_to_json.py       csv -> json
scripts/build.py             src/ + data/ -> index.html
```

## Publicar en GitHub Pages

Settings → Pages → Deploy from a branch → `main` / `(root)`. El `.nojekyll` de la raíz evita que Jekyll toque nada.
