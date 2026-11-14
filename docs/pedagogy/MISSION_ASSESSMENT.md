# Mission « file » : évaluation structurelle sans exécution

Le module `app.mission_assessment` analyse les définitions Python par arbre syntaxique abstrait (AST, *Abstract Syntax Tree*) sans jamais exécuter le programme d'un élève. Il produit des constats sur la syntaxe, les fonctions de premier niveau, les paramètres, les corps vides et l'instruction `return` de `defiler`.

Chaque constat est accompagné d'une question socratique, sans corrigé. **Aucun résultat ne prouve la correction fonctionnelle** : `functional_correctness` vaut toujours `not_evaluated`, y compris lorsqu'un programme incorrect présente la structure attendue. Aucune donnée élève n'est conservée.

Le module n'ajoute aucune route publique, ne déclenche aucun appel Albert, et ne modifie ni le frontend ni le héros. Avant de déclarer une solution correcte, il faudra un exécuteur isolé avec limites de ressources, tests fonctionnels et revue de sécurité.

Test ciblé : `cd backend && python -m pytest tests/test_mission_assessment.py -q`.

## Limites des retours et décorateurs (durcissement)

Un `return` placé uniquement dans une fonction imbriquée ou dans une méthode d'une classe interne ne constitue pas un `return` de `defiler` : le contrôle de structure ignore désormais ces faux positifs. En revanche, un `return` conditionnel compte comme présence syntaxique, **sans garantir que toutes les branches renvoient une valeur**. Les fonctions décorées sont signalées, car le décorateur peut changer leur comportement ou leur signature. L'analyseur n'exécute jamais le décorateur.

Les constats restent des indices, jamais une note ni une preuve de conformité. Aucun accès élève n'est ouvert, aucun code soumis n'est exécuté, aucun appel Albert réel n'est déclenché. Tests de régression : `backend/tests/test_mission_assessment.py` et `backend/tests/test_secure_assessment.py`. Le déploiement doit rester conditionné à la réussite de la chaîne GitHub Actions et de Playwright.
