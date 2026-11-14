# Pilotage des indices — serveur maître (pilote enseignant)

Le point d'accès `POST /api/secure/tutor` utilise désormais un compteur **côté serveur** par identité authentifiée et mission. Les champs historiques `attempts` et `hints_used` restent acceptés pour la compatibilité, mais leurs valeurs **ne pilotent plus** la politique pédagogique. Un navigateur ne peut donc pas remettre son compteur d'indices à zéro en modifiant ces champs.

Une réponse du fournisseur reçue avec succès incrémente le compteur de tentatives. Un indice n'est compté que si l'action décidée est `HINT` et que le filtre de sortie ne bloque pas la réponse. Maximum : trois indices par identité et mission. Le compteur est isolé entre identités et missions, limité à 500 sessions, avec expiration après 30 minutes d'inactivité. Aucun texte d'élève ni réponse du modèle n'est conservé par ce magasin.

## Limites bloquantes pour un accès élève

- Mémoire volatile, perdue au redémarrage, non partagée entre plusieurs processus : **pas un suivi pédagogique durable ni un quota de sécurité de production**.
- L'identité est celle du jeton de démonstration enseignant, **pas une authentification d'élève**.
- `has_student_work`, `requested_solution` et `phase` restent déclaratifs : ils ne constituent pas une preuve de travail ni une évaluation indépendante.
- La réponse du modèle peut encore être incorrecte ou trop explicite malgré le filtre de sortie.
- Aucun appel réel à Albert n'est nécessaire pour les tests ; les simulations HTTP utilisent un jeton fictif.

## Recette

Exécuter `PYTHONPATH=backend pytest -q backend/tests/test_tutor_progress.py backend/tests/test_secure_tutor.py backend/tests/test_tutor_output_guard.py`, puis les suites complètes et Playwright. Vérifier les workflows GitHub Actions avant toute affirmation de publication.

## Suite

Introduire des preuves d'exécution Python et une grille d'évaluation indépendante, sans déduire la réussite d'une simple déclaration du navigateur. Toute ouverture aux élèves exigera une authentification réelle, un stockage serveur adapté, des protections anti-abus et la vérification des quotas financiers Albert.
