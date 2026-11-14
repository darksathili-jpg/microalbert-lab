# Dialogue d'évaluation structurelle — pilote enseignant

Ce lot ajoute un choix déterministe de questions socratiques à partir des constats **actuels** de l'analyse syntaxique et structurelle Python.

- Le serveur choisit une question selon la phase : découverte, recherche, implémentation, vérification ou bilan.
- En cas d'anomalies, il privilégie les constats structurels. Le code de constat précédent peut permettre de varier la question, mais ne peut jamais créer un constat.
- Aucun code soumis n'est exécuté, enregistré ou transmis à Albert par cette route.
- Le navigateur ne peut pas imposer une question ni déclarer un programme correct.
- Les réponses restent des questions, jamais un corrigé ni une certification de conformité fonctionnelle.
- L'accès demeure réservé au pilote enseignant authentifié. Aucun accès élève n'est ouvert.

## Limites

Le paramètre `previous_finding` est un indice de présentation non fiable, pas un état de progression sécurisé. Il ne remplace pas un historique authentifié côté serveur. La conformité fonctionnelle demeure `not_evaluated`. L'analyse statique n'évalue pas le comportement de la file. Une véritable évaluation exige un bac à sable isolé et une politique de sécurité spécifique avant toute exécution de code élève.

## Validation

Exécuter `pytest backend/tests/test_assessment_dialogue.py` depuis un environnement configuré avec `backend` dans `PYTHONPATH`, puis toutes les suites du dépôt. Vérifier également les tests Playwright de non-régression de l'interface et du héros avant toute publication.
