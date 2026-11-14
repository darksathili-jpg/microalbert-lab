# Mission « file » : évaluation structurelle sans exécution

Le module `app.mission_assessment` analyse les définitions Python par arbre syntaxique abstrait (AST, *Abstract Syntax Tree*) sans jamais exécuter le programme d'un élève. Il produit des constats sur la syntaxe, les fonctions de premier niveau, les paramètres, les corps vides et l'instruction `return` de `defiler`.

Chaque constat est accompagné d'une question socratique, sans corrigé. **Aucun résultat ne prouve la correction fonctionnelle** : `functional_correctness` vaut toujours `not_evaluated`, y compris lorsqu'un programme incorrect présente la structure attendue. Aucune donnée élève n'est conservée.

Le module n'ajoute aucune route publique, ne déclenche aucun appel Albert, et ne modifie ni le frontend ni le héros. Avant de déclarer une solution correcte, il faudra un exécuteur isolé avec limites de ressources, tests fonctionnels et revue de sécurité.

Test ciblé : `cd backend && python -m pytest tests/test_mission_assessment.py -q`.
