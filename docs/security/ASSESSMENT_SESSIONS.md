# Sessions d'évaluation isolées — pilote enseignant

Le serveur peut désormais émettre un identifiant opaque de session pour une mission, via `POST /api/secure/assessment/session`, exclusivement après authentification et autorisation de l'enseignant. L'enseignant transmet ensuite `session_id` dans `POST /api/secure/assessment`. Les historiques sont séparés même si plusieurs sessions appartiennent au même enseignant. Un identifiant inventé, expiré, attribué à un autre enseignant ou à une autre mission est refusé (HTTP 403).

Les identifiants sont générés avec `secrets.token_urlsafe(32)`, expirent après 30 minutes et sont conservés en mémoire dans une capacité bornée. Aucun code Python ni nom d'élève n'est enregistré dans le registre de sessions. Le redémarrage du processus supprime les sessions. Il ne faut ni journaliser ni inclure ces identifiants dans les URL.

**Compatibilité supprimée :** les requêtes sans `session_id` sont désormais refusées (HTTP 422) avant toute analyse. Les anciens clients et tests doivent d'abord créer une session enseignante. Le registre local de jetons ne constitue pas une authentification scolaire de production.

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

**Limites toujours bloquantes :** les jetons et l'historique sont locaux au processus, sans persistance multi-instance. Aucun accès élève ne doit être ouvert. GitHub Pages n'héberge pas l'API sécurisée ; un serveur HTTPS avec authentification scolaire vérifiée reste nécessaire. Aucun appel Albert réel n'est requis par ce lot.

La validation de livraison exige les suites Python, frontend et Playwright,
plus les vérifications visuelles du héros et de l'interface approuvée.


## Obligation de session (durcissement)

Chaque appel `POST /api/secure/assessment` exige désormais un `session_id` opaque obtenu par `POST /api/secure/assessment/session` avec l'identité enseignante authentifiée. Une requête sans ce champ est rejetée (422) avant analyse du programme ; une session inconnue, révoquée, expirée ou étrangère est rejetée (403) avant analyse. L'historique est isolé par identité enseignante, mission et session. L'ancien historique partagé sans session n'est plus accessible par cette route. La révocation demeure disponible via `POST /api/secure/assessment/session/revoke`.

Cette protection ne constitue **pas** une authentification des élèves. L'API reste un pilote enseignant local ; aucune clé Albert ne doit être exposée dans GitHub Pages. Les identifiants de session ne doivent pas être consignés dans les journaux ou publiés. L'expiration est gérée en mémoire du processus, sans persistance. Aucun accès élève ni appel réel à Albert n'est autorisé par cette modification.


## Migration des tests de régression

Les tests longitudinaux `backend/tests/test_assessment_history.py` créent maintenant une session par identité enseignante, puis réutilisent la même capacité pour les tentatives successives. Cela permet de vérifier la rotation des questions, la persistance des difficultés et l'isolation des historiques sans réintroduire l'ancien accès sans session. Les tests anonymes et élèves conservent leur refus. Aucune ressource réseau Albert n'est nécessaire.
