# Sessions d'évaluation isolées — pilote enseignant

Le serveur peut désormais émettre un identifiant opaque de session pour une mission, via `POST /api/secure/assessment/session`, exclusivement après authentification et autorisation de l'enseignant. L'enseignant transmet ensuite `session_id` dans `POST /api/secure/assessment`. Les historiques sont séparés même si plusieurs sessions appartiennent au même enseignant. Un identifiant inventé, expiré, attribué à un autre enseignant ou à une autre mission est refusé (HTTP 403).

Les identifiants sont générés avec `secrets.token_urlsafe(32)`, expirent après 30 minutes et sont conservés en mémoire dans une capacité bornée. Aucun code Python ni nom d'élève n'est enregistré dans le registre de sessions. Le redémarrage du processus supprime les sessions. Il ne faut ni journaliser ni inclure ces identifiants dans les URL.

**Limite volontaire de compatibilité :** une requête d'évaluation sans `session_id` reste acceptée pour les anciens tests et pour l'enseignant seul, avec l'avertissement `legacy_shared_teacher_history`. Cette voie n'isole pas les élèves. Elle devra être supprimée avant une ouverture multi-élèves. Le registre local de jetons ne constitue pas une authentification scolaire de production.

Ce lot ne crée aucun compte élève, ne configure aucun hébergement, n'active pas Albert et ne modifie ni le frontend ni les images. Le site GitHub Pages reste statique : les routes protégées nécessitent un serveur HTTPS distinct et une authentification de production vérifiée. Aucun accès élève ne doit être ouvert à ce stade.

Tests attendus : expiration, capacité, révocation, séparation entre deux sessions du même enseignant, refus d'une autre identité, refus des identifiants forgés, accès anonyme et rôle élève. Le workflow doit réussir avant toute publication.


## Durcissement des autorisations (15 novembre 2026)

L'API `POST /api/secure/assessment` valide maintenant tout identifiant de
session fourni **avant** d'analyser le programme Python. Un identifiant
inconnu, expiré, révoqué ou appartenant à un autre enseignant entraîne
`403 invalid_assessment_session` sans appel à l'analyseur.

L'enseignant authentifié peut révoquer une session avec
`POST /api/secure/assessment/session/revoke` et un corps JSON
`{"session_id": "..."}`. L'API retourne `{"revoked": true}` même
si l'identifiant est déjà absent ou appartient à une autre identité :
elle ne révèle pas l'existence des sessions d'autres enseignants.
Les rôles élève et les requêtes anonymes sont refusés.

**Limites toujours bloquantes :** les anciennes requêtes sans identifiant
de session restent acceptées uniquement pour la compatibilité du pilote
enseignant ; elles partagent l'historique de cet enseignant. Les jetons
et l'historique sont locaux au processus, sans persistance multi-instance.
Aucun accès élève ne doit être ouvert. GitHub Pages n'héberge pas l'API
sécurisée ; un serveur HTTPS avec authentification scolaire vérifiée
reste nécessaire. Aucun appel Albert réel n'est requis par ce lot.

La validation de livraison exige les suites Python, frontend et Playwright,
plus les vérifications visuelles du héros et de l'interface approuvée.
