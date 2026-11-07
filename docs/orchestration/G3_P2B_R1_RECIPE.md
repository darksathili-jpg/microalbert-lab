# G3-P2B-R1 — Correction ciblée et recette

**État : EN VÉRIFICATION.** Aucun test exécuté par l'assistant dans cette intervention.

## Modifications
- Adaptateur : distinction des réponses fournisseur 404, 422 et 503 ; messages locaux normalisés, sans corps distant.
- Adaptateur : méthode `list_allowed_chat_models()`, requête GET /v1/models avec transport HTTP injecté ; filtre par liste blanche locale ET type `text-generation` ; aucune exposition au frontend.
- Tests : scénarios supplémentaires pour les erreurs et la découverte des modèles.
- `get_albert_adapter()` continue de retourner `None` dans FastAPI. Aucun transport réel, aucune clé ni changement du fournisseur mock.

## Recette locale
Depuis `backend` :
```powershell
python -m pytest -q tests/test_api.py tests/test_albert_adapter.py tests/test_fastapi_albert_integration.py tests/test_albert_model_discovery.py
python -m pip show starlette fastapi httpx
```
Depuis `frontend` :
```powershell
npm.cmd run build
```
Depuis la racine (Vite démarré) :
```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs
```

## Réserves
- Vérifier sur la documentation et la réponse réelle du compte autorisé que le champ `type` utilise bien la valeur `text-generation`. Aucun accès réel n'est effectué ici.
- L'avertissement de dépréciation Starlette/TestClient ne doit pas être supprimé par filtrage ; identifier d'abord les versions installées.
- Avant activation réelle : revoir authentification locale, limitations de débit, confidentialité, journalisation, politique de modèle et revue indépendante.
- Aucun merge, déploiement, appel réseau Albert ou utilisation de secret autorisé par R1.
