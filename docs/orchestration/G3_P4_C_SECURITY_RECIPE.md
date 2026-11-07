# G3-P4-C — Durcissement, limites et recette

**État : EN VÉRIFICATION.** Tests non exécutés par l'assistant.

## Changements
- Route historique `POST /api/chat` : uniquement `microalbert-mock` ; aucun appel de l'adaptateur, même lorsqu'il est injecté par surcharge de dépendance.
- Tests d'intégration historiques réécrits pour vérifier la nouvelle politique : les appels à l'adaptateur demeurent testés indépendamment dans `test_albert_adapter.py`.
- Nouveaux tests `test_security_abuse.py` : concurrence sur un quota local, indépendance des identités, refus d'escalade et absence de contournement HTTP.

## Limites et décisions bloquantes
1. Le contrôle d'accès n'est intégré qu'à `/api/secure/chat`. La route historique mock reste publique et doit être strictement réservée à la démonstration locale.
2. Le registre de jetons et le limiteur sont en mémoire : **non adaptés à une exploitation multi-processus ou publique**.
3. Pas de fournisseur d'identité institutionnel ; aucune autorisation réelle d'accès des élèves.
4. Aucune preuve de conformité de traitement des données élèves ; exiger validation institutionnelle, minimisation, conservation, droits d'accès et analyse des journaux avant exploitation.
5. Aucun fournisseur Albert réel activé, aucun secret, aucun déploiement.
6. Les tests de concurrence prouvent seulement l'atomicité du limiteur local dans un processus. Ils ne constituent pas un test de charge ou de résistance à une attaque distribuée.
7. Le traitement de l'avertissement Starlette est différé jusqu'à identification exacte des versions installées.

## Recette PowerShell
À la racine du dépôt :
```powershell
git fetch origin
git switch --track origin/feature/g3-p4c-security-hardening
Set-Location backend
python -m pytest -q tests/test_api.py tests/test_albert_adapter.py tests/test_fastapi_albert_integration.py tests/test_albert_model_discovery.py tests/test_provider_settings.py tests/test_access_security.py tests/test_secure_http_access.py tests/test_security_abuse.py
python -m pip show starlette fastapi httpx
Set-Location ..
npm.cmd --prefix frontend run build
```
Avec Vite démarré :
```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs
```

## Porte de validation
P4-C est validable **uniquement pour la recette locale simulée** si tous les tests passent et si la modification de la route historique est acceptée. L'activation réelle nécessite une nouvelle phase d'architecture et d'autorisation, pas un simple interrupteur.

**Interdiction : fusion dans `main`, publication, appel Albert réel ou utilisation d'une clé sans autorisation explicite.**
