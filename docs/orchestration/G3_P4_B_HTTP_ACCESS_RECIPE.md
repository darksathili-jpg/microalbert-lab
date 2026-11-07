# G3-P4-B — Contrôle d'accès HTTP, recette

**État : EN VÉRIFICATION — tests écrits mais non exécutés par l'assistant.**

## Livraison
- Nouvelle route `POST /api/secure/chat` : jeton Bearer émis côté serveur (registre local éphémère), autorisation de rôle sur identité vérifiée et limitation par identité.
- Réponses normalisées 401 (absent/faux/révoqué), 403 (rôle incorrect), 429 (quota local dépassé).
- Route sécurisée **mock-only** ; aucune requête Albert API possible depuis cette route.
- La route historique `POST /api/chat` est inchangée pour la compatibilité des exercices ; elle **n'est pas protégée par G3-P4-B** et ne doit pas être utilisée pour le réel.
- Aucun point HTTP ne permet d'émettre des jetons. Les tests injectent un registre temporaire ; il n'y a pas de système d'identité institutionnel.

## Recette PowerShell
Depuis la racine du dépôt :
```powershell
git fetch origin
git switch --track origin/feature/g3-p4b-http-access-gate
Set-Location backend
python -m pytest -q tests/test_api.py tests/test_albert_adapter.py tests/test_fastapi_albert_integration.py tests/test_albert_model_discovery.py tests/test_provider_settings.py tests/test_access_security.py tests/test_secure_http_access.py
Set-Location ..
npm.cmd --prefix frontend run build
```
Avec Vite démarré, depuis la racine :
```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs
```

## Bloquants avant accès réel
- Choisir et intégrer une identité institutionnelle vérifiable.
- Migrer tous les chemins de communication vers des routes protégées, puis retirer ou restreindre la route héritée.
- Limiteur partagé entre processus, plafond global fournisseur, gestion des coûts et attaques distribuées.
- Revue des données élèves, politique de conservation et validation institutionnelle.
- Tests indépendants, tests d'abus, audit des dépendances et avertissement Starlette.

**Aucun merge, déploiement, secret réel ou appel réseau Albert autorisé.**
