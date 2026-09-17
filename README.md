# Sinergias Lanzadera

**Radar de Sinergias** — motor de compatibilidad sobre el portfolio público de startups de [Lanzadera](https://lanzadera.es/startups/). Eliges una empresa base de las 549 y puntúa las otras 548 contra ella, clasificando cada par como competidor, aliado comercial, proveedor, cliente potencial o espejo de modelo.

`index.html` no necesita servidor ni build en tiempo de ejecución: es HTML autónomo. Ábrelo con doble clic o publícalo en GitHub Pages.

## Cómo puntúa el radar

Cada ficha se etiqueta a partir de su descripción pública en dos ejes:

- **Público** — a quién vende: clínicas y sanidad, negocio de calle, hostelería, industria, inmobiliario, educación, empresa B2B…
- **Función** — qué hace: IA y agentes, voz, marketing, gestión, datos, cumplimiento, pagos, hardware…

Con esas etiquetas, para cada par (base → candidata) se suma:

| Señal | Peso | Detalle |
|---|---|---|
| Público compartido | hasta 38 | Ponderado por especificidad (IDF): compartir «clínicas y sanidad», que llevan 25 empresas, vale mucho más que compartir «empresa B2B» |
| Complementariedad | hasta 24 | Funciones que la candidata aporta y la base no cubre. Escalado por el público compartido: complementar a quien no te compra no sirve |
| Encaje proveedor | hasta 16 | Infraestructura, seguridad, cumplimiento, pagos, datos o personas |
| Espejo de modelo | 20 | Sin público común pero misma función: playbook transferible |
| Léxico de nicho | hasta 21 | Palabras poco frecuentes que las dos fichas usan literalmente («dental», «licitaciones») |
| Mismo sector / cohorte | 6 / 9 | La cohorte compartida importa: son gente a la que puedes ver esta semana |

El total se multiplica por un factor según el tipo de relación, de modo que un «cliente potencial» no compite en la lista con un «aliado comercial». Un solapamiento de función alto sobre el mismo público **no resta**: cambia la etiqueta a competidor, que es igual de accionable.

Toda la lógica está en `src/app.template.html`, en los bloques `AUD`, `CAP` y la función `evaluate()`.

### Lo que este cribado no es

Es un filtro heurístico sobre **una frase por empresa** — la que Lanzadera publica en su ficha. Sirve para decidir a quién mirar, no para decidir nada más. Además, 163 fichas tienen el sector «Por definir» y unas pocas no tienen descripción; ahí el motor infiere el público del sector y pondera esa señal a la baja a propósito.

## Los datos

`data/startups.csv` y `data/startups.json` — 549 fichas leídas de la API REST de WordPress de Lanzadera el 09/09/2026. Columnas: `nombre`, `sector`, `cohorte`, `descripcion`, `slug`. Las descripciones son literales de la fuente.

Cohortes presentes: MAR24, SEPT24, MAR25, SEPT25, MAR26, SEPT26 y `Alumni` para las fichas sin cohorte asignada.

## Regenerar

```bash
# 1. volver a escrapear (necesita salida a lanzadera.es)
node scripts/scrape.js > data/startups.csv
python3 scripts/csv_to_json.py

# 2. reconstruir las páginas desde src/
python3 scripts/build.py
```

`scripts/build.py` inyecta el dataset en `src/app.template.html` (marcador `__DATA__`) y lo envuelve en un documento HTML completo. Edita siempre `src/`, nunca el `index.html` de la raíz: se sobrescribe en cada build.

## Estructura

```
data/startups.csv            549 fichas, fuente de verdad
data/startups.json           lo mismo en JSON, es lo que consume el build
src/app.template.html        radar: estilos, taxonomía, motor y UI
scripts/scrape.js            re-escrapeo desde la API de Lanzadera
scripts/csv_to_json.py       csv -> json
scripts/build.py             src/ + data/ -> index.html
```

## Publicar en GitHub Pages

Settings → Pages → Deploy from a branch → `main` / `(root)`. El `.nojekyll` de la raíz evita que Jekyll toque nada.
