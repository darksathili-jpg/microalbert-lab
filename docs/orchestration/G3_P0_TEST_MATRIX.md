# G3-P0 — Matrice de tests et preuves attendues

**État :** planifié, aucun test G3 exécuté.

| ID | Situation | Preuve attendue | État |
|---|---|---|---|
| G3-T01 | Démarrage sans clé, fournisseur mock | API locale disponible, aucun trafic Albert | NON TESTÉ |
| G3-T02 | Contrat des 3 rôles | Requêtes et réponses normalisées | NON TESTÉ |
| G3-T03 | Absence de clé avec fournisseur Albert | Refus explicite sans fuite de secret | NON TESTÉ |
| G3-T04 | Authentification fournisseur refusée | Erreur applicative sûre, sans jeton | NON TESTÉ |
| G3-T05 | Quota 429 | Erreur normalisée, sans boucle infinie | NON TESTÉ |
| G3-T06 | Expiration réseau | Délai borné, erreur 504 | NON TESTÉ |
| G3-T07 | 5xx et réponse malformée | Erreur sûre, sans corps brut fournisseur | NON TESTÉ |
| G3-T08 | Modèle hors liste blanche | Refus avant requête externe | NON TESTÉ |
| G3-T09 | Hôte arbitraire ou HTTP | Configuration rejetée | NON TESTÉ |
| G3-T10 | Secret dans réponse/log/front | Aucun secret retrouvé | NON TESTÉ |
| G3-T11 | Régression frontend G2 | Tests Playwright + build TypeScript | NON TESTÉ |
| G3-T12 | Essai réel avec question fictive | Seulement après autorisation humaine | BLOQUÉ |

## Critères de passage
- 100 % des tests G3-P1 applicables réussis, preuves conservées et revue indépendante.
- Aucun secret, prompt d'élève ni donnée personnelle dans les preuves.
- Toute anomalie critique entraîne BLOQUÉ et retour à correction.
- Un succès du simulateur ne constitue pas un succès d'Albert API.
- La décision de passage à G3-P2 est humaine et explicite.
