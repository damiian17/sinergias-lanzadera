#!/usr/bin/env python3
"""data/startups.csv -> data/startups.json (ejecútalo tras re-escrapear)."""
import csv, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
rows = list(csv.DictReader((ROOT / "data" / "startups.csv").open(encoding="utf-8")))
(ROOT / "data" / "startups.json").write_text(
    json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(rows), "startups")
