# G3-P4 — Sécurisation des accès : livraison P4-A

**État : EN VÉRIFICATION — primitives isolées, aucune protection HTTP déployée.**

## Périmètre réalisé
- `backend/app/access_security.py` : registre de jetons éphémères créé côté serveur, identité et rôle associés au jeton, révocation, autorisations explicites par rôle et limite de requêtes par identité dans un seul processus.
- `backend/tests/test_access_security.py` : tests de jetons absents/falsifiés/révoqués, refus d'escalade de privilèges, droits autorisés et limitation de débit.
- Aucun changement de `backend/app/main.py` : l'interface de démonstration et ses tests historiques restent compatibles.
- Aucune clé Albert API, aucun transport réel, aucun appel réseau.

## Limites importantes
1. **Les routes HTTP ne sont PAS encore protégées par ce module.** Le registre n'est pas injecté dans FastAPI ; il serait trompeur de présenter cette étape comme une authentification opérationnelle.
2. Le registre local en mémoire n'est pas un fournisseur d'identité : pas de connexion institutionnelle, de sessions persistantes ni de gestion multi-instance.
3. Le limiteur local en mémoire n'est pas une protection distribuée : pas de partage entre workers, de plafond global fournisseur ni de mécanisme anti-abus en production.
4. L'autorisation sur le mode de l'interface doit être effectuée côté serveur, sur une identité vérifiée, **avant** toute activation réelle.
5. Les données personnelles des élèves, la durée de conservation et la conformité institutionnelle nécessitent une revue séparée.

## Recette locale
Depuis la racine du dépôt :
```powershell
git fetch origin
git switch --track origin/feature/g3-p4-access-security
Set-Location backend
python -m pytest -q tests/test_api.py tests/test_albert_adapter.py tests/test_fastapi_albert_integration.py tests/test_albert_model_discovery.py tests/test_provider_settings.py tests/test_access_security.py
Set-Location ..
npm.cmd --prefix frontend run build
```
Avec Vite démarré, depuis la racine :
```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs
```

## Critères de passage à P4-B
- Tests indépendants verts et vérification du comportement historique.
- Choix explicite du mécanisme d'identité institutionnel et de sa configuration.
- Intégration FastAPI des contrôles d'accès, sans régression du simulateur ; tests de bout en bout des refus 401/403/429.
- Revue indépendante de sécurité et politique de données avant toute connexion réelle.

**Décision actuelle : P4-A EN VÉRIFICATION.** Pas de fusion dans `main`, pas de publication, pas d'activation d'Albert API.
