# G3-P2A — Recette d'intégration FastAPI (2026-11-07)

**Statut : EN VÉRIFICATION — code livré, tests non exécutés par l'assistant.**

## Modifications
- `backend/app/main.py` : `get_albert_adapter()` renvoie toujours `None` par défaut. L'adaptateur ne peut être fourni que par surcharge explicite de dépendance dans les tests. Le fournisseur mock reste prioritaire pour `microalbert-mock`.
- `backend/tests/test_fastapi_albert_integration.py` : vérification des trois rôles, des erreurs 401/403/429/500, de la liste blanche, de l'absence de fuite du jeton et du fonctionnement mock.
- Pas de changement du frontend, pas de clé réelle, pas de transport réseau de production.

## Points de sécurité
- Le mode choisi par le navigateur n'est pas une autorisation d'accès.
- Les erreurs fournisseur sont normalisées et ne renvoient pas de corps de réponse distant.
- Les avertissements `simulated_provider_transport` et `not_pedagogically_certified` signalent une réponse d'essai.
- L'API locale n'expose toujours pas de fournisseur Albert réel ; aucun basculement par variable d'environnement n'est activé.
- Le chemin et le schéma HTTP utilisés par l'adaptateur doivent être vérifiés dans la documentation officielle actuelle avant G3-P2B.

## Recette à exécuter
Depuis la racine :
```powershell
git fetch origin
git switch --track origin/feature/g3-p2a-fastapi-integration
```
Depuis `backend` (environnement virtuel actif) :
```powershell
python -m pytest -q tests/test_api.py tests/test_albert_adapter.py tests/test_fastapi_albert_integration.py
```
Depuis `frontend` :
```powershell
npm.cmd run build
npm.cmd run dev
```
Dans un autre terminal, depuis la racine :
```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs
```

## Portes de sortie
1. Tous les tests Python passent ; conserver la sortie brute.
2. Build TypeScript/Vite et Playwright passent ; conserver les résultats.
3. Audit indépendant des secrets, du transport injecté et des dépendances.
4. Vérification du contrat officiel Albert API ; les spécifications ReDoc requièrent JavaScript et n'ont pas été intégralement vérifiées ici.
5. Aucun essai réel sans autorisation humaine distincte.
6. Pas de fusion ni publication.
