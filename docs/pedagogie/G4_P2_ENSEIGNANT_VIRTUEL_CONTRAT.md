# G4-P2 — Contrat de l'enseignant virtuel NSI

**Statut : EN VÉRIFICATION — moteur de décisions hors ligne, non connecté à Albert.**

## Finalité

Albert n'est pas un distributeur de réponses. Le système guide l'élève par questionnement socratique, aide graduée, analyse de tests et justification. Le professeur conserve l'autorité pédagogique. L'outil ne peut pas certifier seul une compétence.

## Parcours d'une mission

1. **Découverte** : lire l'énoncé, reformuler le problème et identifier les entrées, sorties et contraintes.
2. **Recherche** : proposer une stratégie personnelle avant toute aide détaillée.
3. **Implémentation** : écrire soi-même les instructions Python ; exécuter des exemples d'appel et analyser les valeurs renvoyées.
4. **Vérification** : produire des jeux de tests, notamment des cas limites, puis confronter les résultats aux attentes.
5. **Bilan** : expliquer le raisonnement, identifier une erreur et réussir une variante de transfert.

Le serveur calcule une décision pédagogique `TutorDecision` en fonction de la phase, des tentatives et du nombre d'indices déjà utilisés. Le champ `reveal_solution` est toujours `False`. **Cela ne prouve pas qu'un modèle génératif obéira à cette consigne.** Avant tout appel réel, un filtre de sortie et des tests adversariaux devront être conçus, et les corrigés ne devront pas être transmis au modèle dans le contexte élève.

## Règles pour le tuteur

- Ne pas donner le code complet, les réponses finales ni un pseudocode équivalent.
- Ne pas écrire le programme à la place de l'élève, y compris après plusieurs demandes.
- Préférer une question utile à une explication exhaustive.
- Aider à construire un test qui met en évidence une erreur, sans corriger immédiatement.
- Ne jamais présenter une réponse générée comme une preuve ; seuls les tests et la justification de l'élève permettent une évaluation.
- Employer le vocabulaire officiel NSI : « variable de type entier », « affecter une valeur à une variable », « boucle bornée », « instruction », « valeur renvoyée ».
- Éviter les données personnelles et les traces contenant les messages bruts des élèves.

## Commandes réservées à l'enseignant (futures)

Le professeur pourra configurer le budget d'indices, le niveau de difficulté, les compétences visées, le verrouillage du corrigé, les critères d'évaluation et les interventions humaines. **Ces contrôles ne sont pas implémentés dans G4-P2** ; le rôle déclaré dans le navigateur ne doit pas être utilisé pour les autoriser.

## Alignement baccalauréat NSI 2026

La banque de sujets pratiques et les sujets écrits 2026 servent de références de compétences, pas de stock de réponses à reproduire. Chaque mission originale doit porter la référence du sujet, l'attendu du programme, la preuve produite et les tests associés. La publication institutionnelle des sujets n'implique pas une approbation du produit par l'inspection.

## Protections et limites

- `backend/app/pedagogical_tutor.py` est un module **hors ligne**, sans requête réseau et sans enregistrement de données élèves.
- Aucun endpoint n'expose encore le tuteur ; aucune réponse de modèle n'a été validée.
- Le contexte `attempts`/`hints_used` est fourni au moteur : avant une intégration HTTP, ces compteurs devront être détenus côté serveur et non déclarés par le navigateur.
- La prévention des fuites de corrigés exige une séparation technique des contenus, un filtrage et des essais de contournement indépendants ; un prompt seul ne suffit pas.
- Toute intégration à Albert API nécessite un accord explicite distinct et le franchissement des portes de sécurité G3/G4.

## Recette

Depuis la racine du dépôt :

```powershell
git fetch origin
git switch --track origin/feature/g4-p2-virtual-nsi-tutor
Set-Location backend
python -m pytest -q
Set-Location ..
npm.cmd --prefix frontend run build
```

Avec Vite démarré :
```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs
```

**Décision : G4-P2 EN VÉRIFICATION.** Aucune fusion dans `main`, aucun déploiement, aucune clé ni appel réel Albert.
