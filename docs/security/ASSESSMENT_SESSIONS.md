# Sessions d'évaluation isolées — pilote enseignant

Le serveur peut désormais émettre un identifiant opaque de session pour une mission, via `POST /api/secure/assessment/session`, exclusivement après authentification et autorisation de l'enseignant. L'enseignant transmet ensuite `session_id` dans `POST /api/secure/assessment`. Les historiques sont séparés même si plusieurs sessions appartiennent au même enseignant. Un identifiant inventé, expiré, attribué à un autre enseignant ou à une autre mission est refusé (HTTP 403).

Les identifiants sont générés avec `secrets.token_urlsafe(32)`, expirent après 30 minutes et sont conservés en mémoire dans une capacité bornée. Aucun code Python ni nom d'élève n'est enregistré dans le registre de sessions. Le redémarrage du processus supprime les sessions. Il ne faut ni journaliser ni inclure ces identifiants dans les URL.

**Limite volontaire de compatibilité :** une requête d'évaluation sans `session_id` reste acceptée pour les anciens tests et pour l'enseignant seul, avec l'avertissement `legacy_shared_teacher_history`. Cette voie n'isole pas les élèves. Elle devra être supprimée avant une ouverture multi-élèves. Le registre local de jetons ne constitue pas une authentification scolaire de production.

Ce lot ne crée aucun compte élève, ne configure aucun hébergement, n'active pas Albert et ne modifie ni le frontend ni les images. Le site GitHub Pages reste statique : les routes protégées nécessitent un serveur HTTPS distinct et une authentification de production vérifiée. Aucun accès élève ne doit être ouvert à ce stade.

Tests attendus : expiration, capacité, révocation, séparation entre deux sessions du même enseignant, refus d'une autre identité, refus des identifiants forgés, accès anonyme et rôle élève. Le workflow doit réussir avant toute publication.
