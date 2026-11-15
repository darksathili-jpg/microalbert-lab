# Recette de la branche GitHub Pages

Seule `feature/g4-github-pages-preview` alimente le workflow de publication. Lire la tête exacte de la branche et la liste des exécutions déclenchées par push avant de modifier le code. Le statut du commit seul ne permet pas de conclure sur ces exécutions.

```bash
gh run list --branch feature/g4-github-pages-preview --workflow microalbert-pages.yml
gh run view ID_DU_WORKFLOW
```

Dans un environnement jetable, préparer les dépendances et lancer les tests locaux avant l’envoi du commit. Les scripts ci-dessous n’utilisent aucune clé Albert.

```bash
python -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
PYTHONPATH=backend .venv/bin/python -m pytest -q backend/tests tests/test_teacher_guide.py tests/pedagogie
python scripts/check_zero_cost.py
npm ci --prefix frontend
npm install --no-save --no-package-lock
npx playwright install chromium
npm run build --prefix frontend
PATH="$PWD/.venv/bin:$PATH" npx playwright test --config=playwright.standard.config.cjs
npx playwright test --config=playwright.student-staging.config.cjs --workers=1
```

Pour tester le build Pages, sélectionner provisoirement `frontend/index-public.html` comme `frontend/index.html`, lancer les commandes suivantes, puis restaurer l’entrée standard avant de préparer le commit. Le contrôle du navigateur vérifie les trois thèmes, la présence et le placement du héros et l’exécution Python locale.

```bash
npm run build --prefix frontend -- --mode public-demo
cmp frontend/public/microalbert-reference-left.webp frontend/dist/microalbert-reference-left.webp
python scripts/check_public_demo.py
python scripts/check_staging_artifacts.py
npx playwright test --config=playwright.public-pages.config.cjs
```

En cas d’échec, lire l’étape concernée et reproduire la commande locale. Le workflow publie après validation puis vérifie le fichier `revision.txt` servi par Pages, le chargement du JavaScript et la disponibilité du moteur Python. Le fichier de révision doit correspondre au commit exact annoncé.

```bash
gh run watch ID_DU_WORKFLOW --exit-status
curl -fsSL https://darksathili-jpg.github.io/microalbert-lab/revision.txt
```
