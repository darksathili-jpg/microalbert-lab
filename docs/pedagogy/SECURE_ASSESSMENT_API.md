# Évaluation statique protégée — lot G4

## Contrat
`POST /api/secure/assessment` reçoit `{"mission_id":"file","source":"..."}` et nécessite un jeton Bearer **enseignant** délivré par le registre local de démonstration. Les élèves et les requêtes anonymes sont refusés. La limitation de débit est partagée avec les autres routes protégées. Aucun jeton n'est délivré publiquement.

La réponse contient `syntax_valid`, `structural_evidence`, `findings`, `functional_correctness: "not_evaluated"`, `next_question` et `warnings`. La question choisit la première anomalie ou invite à concevoir des tests. Il ne s'agit **ni d'une correction ni d'une note**.

## Sécurité et limites
- Analyse par `ast.parse` uniquement : aucun `exec`, `eval`, lancement de processus ou appel à Albert.
- La source n'est pas persistée par ce module. Elle doit rester hors des journaux et des services tiers.
- Entrée plafonnée à 8 000 caractères et mission `file` uniquement.
- Le registre de jetons est local et éphémère : il ne constitue **pas** une authentification institutionnelle pour un déploiement auprès d'élèves.
- Le parseur AST n'est pas un bac à sable d'exécution et n'établit jamais la correction fonctionnelle. Un programme peut être structurellement conforme et faux.
- Aucun changement d'interface ni de l'illustration du héros. Le site GitHub Pages statique ne propose pas cet endpoint.

## Vérification
`PYTHONPATH=backend python -m pytest -q backend/tests` puis compilation frontend et recette Playwright du build public. Le workflow Pages valide avant de déployer. Aucun appel réel au fournisseur Albert n'est requis.

## Suite
Préparer des cas de tests fonctionnels déterministes sur des programmes **de référence internes** sans exécuter de code élève, puis spécifier une isolation d'exécution appropriée avant toute évaluation dynamique des copies. Valider l'authentification réelle, l'hébergement HTTPS, les budgets et le traitement des données avant ouverture aux élèves.
