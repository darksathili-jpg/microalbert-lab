# G3-P3 — Préparation sécurisée : recette et portes de validation

**État : EN VÉRIFICATION — intégration réelle non activée.**

## Livré
- Module `backend/app/provider_settings.py` : lecture **sur demande uniquement** des paramètres, contrôle de l'origine HTTPS officielle, de la liste blanche, du délai et de la présence du secret ; aucune valeur de secret n'est retournée ni journalisée.
- `backend/tests/test_provider_settings.py` : tests du mode mock, refus des configurations dangereuses et validation documentaire.
- `backend/.env.example` : modèle sans clé.
- Le point d'injection `get_albert_adapter()` reste volontairement `None`. Aucun code ne construit un transport réel.

## Non livré et bloquant pour l'activation
- Authentification et autorisation des utilisateurs côté application.
- Limitation de débit robuste par utilisateur et quotas du fournisseur.
- Revue des données personnelles, politique institutionnelle, rétention et journaux.
- Validation réelle des modèles et droits associés au compte.
- Transport HTTP réel, configuration d'exploitation et essai réseau avec clé.
- Traitement de l'avertissement Starlette selon versions installées.

## Recette indépendante (Windows PowerShell)
À la racine du dépôt :
```powershell
git fetch origin
git switch --track origin/feature/g3-p3-secure-preparation
Set-Location backend
python -m pytest -q tests/test_api.py tests/test_albert_adapter.py tests/test_fastapi_albert_integration.py tests/test_albert_model_discovery.py tests/test_provider_settings.py
python -m pip show starlette fastapi httpx
Set-Location ..
npm.cmd --prefix frontend run build
```
Avec le serveur Vite démarré dans un autre terminal :
```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs
```

## Décision de sécurité
Un feu vert de développement **n'est pas** une autorisation d'utilisation de clé ou d'appel réel. Toute ouverture réseau nécessite une décision humaine explicite ultérieure, avec preuve de validation de tous les prérequis. Ne pas fusionner `main` et ne pas déployer.
