#!/usr/bin/env python3
"""Inyecta data/startups.json en src/app.template.html y escribe index.html,
una página autónoma sin dependencias externas más allá de Google Fonts."""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIELDS = ["nombre", "sector", "cohorte", "descripcion", "slug"]

SHELL = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{desc}">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="icon" type="image/jpeg" href="favicon.jpg">
<style>
  :root{{color-scheme:light dark}}
  body{{margin:0;font:14px system-ui,sans-serif}}
  img{{max-width:100%}}
  [hidden]{{display:none!important}}
</style>
</head>
<body>
{fragment}
</body>
</html>
"""

def build(src_name, out_name, desc, data=None):
    frag = (ROOT / "src" / src_name).read_text(encoding="utf-8")
    if data is not None:
        assert "__DATA__" in frag, f"{src_name} no tiene marcador __DATA__"
        frag = frag.replace("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    out = ROOT / out_name
    out.write_text(SHELL.format(desc=desc, fragment=frag), encoding="utf-8")
    print(f"{out_name}: {out.stat().st_size:,} bytes")

def main():
    recs = json.loads((ROOT / "data" / "startups.json").read_text(encoding="utf-8"))
    rows = [[r[k] for k in FIELDS] for r in recs]
    print(f"{len(rows)} startups")
    build("app.template.html", "index.html",
          "Motor de compatibilidad entre las startups del portfolio de Lanzadera.", rows)

if __name__ == "__main__":
    main()
