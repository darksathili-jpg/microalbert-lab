"""Contrôles statiques conservateurs pour la démonstration publique.
Ne constitue pas un audit complet de sécurité.
"""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
dist=root/"frontend"/"dist"
errors=[]
html=(dist/"index.html").read_text(encoding="utf-8") if (dist/"index.html").exists() else ""
if '/microalbert-lab/assets/' not in html:
    errors.append("Le chemin de base GitHub Pages manque dans index.html.")
if '/src/main.tsx' in html or '/src/main-public.tsx' in html:
    errors.append("L'entrée source ne doit pas figurer dans le HTML compilé.")
bundles=list((dist/"assets").glob("*.js")) if (dist/"assets").exists() else []
if not bundles:
    errors.append("Bundle JavaScript absent.")
source="\n".join(p.read_text(encoding="utf-8",errors="replace") for p in bundles)
for token in ["Interroger le simulateur","Repères pour l’enseignant","Espace Audit","Espace Enseignant","/api/chat","microalbert-mock"]:
    if token in source:
        errors.append("Contenu interdit détecté dans le bundle public : "+token)
if not (dist/"pyodide"/"pyodide.js").exists():
    errors.append("Pyodide absent.")
if errors:
    print("\n".join("ECHEC : "+item for item in errors))
    sys.exit(1)
print("OK : contrôle statique limité du bundle public.")
print("ATTENTION : ne remplace pas un audit des secrets ni un test du site déployé.")
