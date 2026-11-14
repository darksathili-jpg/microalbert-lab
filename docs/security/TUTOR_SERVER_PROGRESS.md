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

## Recette corrective du 14 novembre 2026

Le workflow du commit `6c3406bd` a échoué avec **153 tests réussis et 1 échec** dans `test_progress_isolated_bounded_and_expires`. Le scénario essayait de vérifier l'éviction après l'enregistrement de seulement deux sessions alors que la capacité était de deux : les lectures `snapshot` ne créent pas de session. Le test a été corrigé pour enregistrer trois sessions distinctes avant d'attendre l'éviction. Des cas complémentaires couvrent le plafonnement des tentatives et indices, l'isolation par mission et identité, l'expiration exacte et le rejet des clés invalides.

**Invariant à préserver :** une lecture de progression inconnue ne doit pas créer de session, et l'éviction ne doit intervenir que lors de l'enregistrement d'une nouvelle clé au-delà de la capacité. Ce magasin reste volatile et ne constitue pas un mécanisme d'authentification ni un registre durable d'élèves. La validation du lot exige une exécution complète réussie du workflow Pages ; ne pas déclarer de publication sur la seule base du commit.
