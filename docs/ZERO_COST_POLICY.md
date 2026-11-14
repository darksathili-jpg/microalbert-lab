# MicroAlbert — politique budgétaire (zéro surcoût)

**Décision du responsable du projet : aucun coût supplémentaire autorisé.**

## Autorisé
- Dépôt GitHub public existant et branche `feature/g4-github-pages-preview`.
- GitHub Pages et GitHub Actions sur runners standards hébergés par GitHub, pour un dépôt public, sous réserve de leurs conditions et quotas.
- Outils déjà compris dans les abonnements actuels, dans leurs limites incluses.
- Tests locaux et simulations du service Albert, sans appel facturable.

## Interdit sans nouvel accord explicite
- Création de machine virtuelle, Codespace facturable, runner payant ou hébergement payant.
- Achat de crédits, dépassement automatique, nouvelle souscription ou configuration d'une facturation.
- Utilisation d'une clé Albert pour des appels réels avant vérification des droits, quotas et conditions financières du compte.
- Stockage d'une clé Albert dans le dépôt, dans les ressources GitHub Pages ou dans le navigateur.

## Barrière de livraison
- Le site GitHub Pages est statique : il ne doit jamais appeler Albert avec une clé embarquée.
- L'activation du backend réel exige une authentification adaptée, une limitation des requêtes et une décision explicite du responsable du projet.
- En cas de doute sur un coût, bloquer l'opération et signaler le besoin de vérification.
- Ne pas présenter les simulations comme des appels réels au modèle.

## Contrôles manuels nécessaires
La présente politique ne règle **pas** les plafonds financiers chez GitHub, OpenAI ou Albert. Vérifier dans chaque interface les budgets, dépassements et alertes avant d'activer un service qui pourrait être facturé. Une consigne à un agent ne constitue pas une protection financière technique.

## Preuves
Les modifications doivent rester dans le dépôt existant et être validées par la chaîne de tests avant publication. Les comptes rendus doivent citer les commits et les workflows effectivement exécutés.
