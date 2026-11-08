"""Contrôles de préproduction hors ligne. Ne publie rien.

Exécuter depuis la racine du dépôt :
    python scripts/check_staging_artifacts.py
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "frontend" / "dist"
errors = []

def require(path, description):
    if not path.is_file():
        errors.append(f"ABSENT : {description} ({path.relative_to(ROOT)})")

require(DIST / "index.html", "page d'entrée Vite")
require(DIST / "pyodide" / "pyodide.js", "moteur Python local")
require(DIST / "python-runtime.worker.js", "Web Worker Python")

if DIST.exists():
    forbidden_names = {".env", ".env.local", ".env.production", "id_rsa", "id_ed25519"}
    for path in DIST.rglob("*"):
        if path.is_file() and (path.name in forbidden_names or ".git" in path.parts):
            errors.append(f"FICHIER INTERDIT : {path.relative_to(ROOT)}")
    for file in DIST.rglob("*.map"):
        errors.append(f"CARTE SOURCE À EXAMINER : {file.relative_to(ROOT)}")
else:
    errors.append("ABSENT : frontend/dist (lancer npm.cmd --prefix frontend run build)")

print("Contrôle hors ligne G4-P6-I — aucune publication")
if errors:
    for item in errors:
        print("ECHEC :", item)
    sys.exit(1)
print("OK : artefacts essentiels présents, aucun nom interdit détecté.")
print("ATTENTION : ceci n'est ni un audit des secrets dans le contenu,")
print("ni une preuve de protection d'accès ou de sécurité de l'hébergeur.")
