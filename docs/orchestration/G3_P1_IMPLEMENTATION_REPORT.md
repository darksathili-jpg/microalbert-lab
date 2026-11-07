# G3-P1 — Livraison contrôlée de l'adaptateur (2026-11-07)

**Statut : EN VÉRIFICATION — tests non exécutés dans cette intervention.**

## Livrables
- `backend/app/albert_adapter.py` : adaptateur asynchrone isolé, transport HTTP obligatoirement injecté, origine HTTPS officielle fixée, liste blanche de modèles, borne de durée et taille des réponses, erreurs normalisées sans corps fournisseur.
- `backend/tests/test_albert_adapter.py` : tests hors ligne par `httpx.MockTransport`, incluant succès, erreurs 401/403/429/5xx, délai, réseau, réponse malformée, réponse volumineuse, modèle non autorisé, origine invalide, absence de clé et régression mock.
- Aucune modification de `backend/app/main.py`, aucun changement frontend : les routes FastAPI continuent d'utiliser uniquement `microalbert-mock`.
- Aucun appel Albert API réel ; aucune clé réelle utilisée.

## Limites et travaux nécessaires avant G3-P2
1. Valider les chemins, le schéma des messages et le format de réponse avec la documentation officielle actuelle (le contrat de compatibilité est encore provisoire).
2. Vérifier les tests et corriger les éventuels échecs.
3. Implémenter l'intégration contrôlée à FastAPI, **désactivée par défaut**, uniquement après revue indépendante.
4. Prévoir le filtrage des modèles conversationnels via les capacités réellement déclarées, la politique de confidentialité et la limitation de débit.
5. Établir des preuves de sécurité : non-exposition des secrets, contrôle du CORS, absence de données personnelles et des journaux sensibles.
6. Autorisation humaine explicite avant toute utilisation d'un compte ou d'une clé réelle.

## Exécution locale
Dans `backend` avec l'environnement virtuel Python activé :
```powershell
python -m pip install -r requirements.txt
python -m pytest -q tests/test_api.py tests/test_albert_adapter.py
```
Depuis `frontend` :
```powershell
npm.cmd run build
```
Depuis la racine, avec Vite en marche :
```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs
```

Ne pas fusionner dans `main`, ne pas publier, ne pas activer le fournisseur réel.
