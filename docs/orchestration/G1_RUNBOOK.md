# G1 — Démarrage local (prototype mock uniquement)

## Prérequis
Python 3.11+ ; Node.js 20+ ; aucune clé Albert requise.

## Terminal 1 — API
Depuis la racine du dépôt :

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Terminal 2 — Interface
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
Ouvrir http://127.0.0.1:5173 .

## Tests à exécuter
```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest -q
cd ..\frontend
npm.cmd run build
```

Les tests ci-dessus sont fournis mais **n'ont pas été exécutés par le connecteur GitHub**. La validation G1 reste suspendue aux preuves d'exécution et à une recette humaine.

## Limites explicites
- Mock uniquement : aucune connexion Albert réelle.
- Aucun moteur Python, aucun sprite officiel, aucune validation pédagogique à ce stade.
- Usage local de développement ; ne pas exposer le serveur sur le réseau.
- Ne jamais saisir une clé API dans l'interface.
