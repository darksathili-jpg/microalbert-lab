# G3-P2B — Audit du contrat officiel Albert API

**Date :** 2026-11-07  
**État :** AUDIT DOCUMENTAIRE RÉALISÉ ; ESSAI RÉEL BLOQUÉ.  
**Références :** https://albert.api.etalab.gouv.fr/reference ; https://github.com/betagouv/doc.albert-api ; https://ia.numerique.gouv.fr/outils-ia/albert-api/

## Correspondances vérifiées dans la référence publique
| Élément | Contrat officiel | Implémentation | Verdict |
|---|---|---|---|
| Origine | https://albert.api.etalab.gouv.fr | Hôte HTTPS exact | CONFORME |
| Authentification | HTTP Bearer | Authorization: Bearer ... | CONFORME |
| Conversation | POST /v1/chat/completions | Même route | CONFORME |
| Corps de requête | model + messages | Champs envoyés | CONFORME |
| Capacité | modèle de type text-generation | Liste blanche locale sans découverte de type | PARTIEL |
| Liste des modèles | GET /v1/models | Backend expose seulement modèle mock | NON INTÉGRÉ |
| Réponse | choices[0].message.content, finish_reason | Extraction et validation | CONFORME AU CAS SIMPLE |
| 401 / 403 | jeton ou droits invalides | Erreur locale 503 générique | PROTECTION OK, SÉMANTIQUE À REVOIR |
| 429 | quotas | 429 local | CONFORME AU CAS SIMPLE |
| 404 / 422 fournisseur | modèle introuvable / type incorrect | Erreur locale 502 générique | À AMÉLIORER |
| 503 fournisseur | modèle occupé | Erreur locale 502 | À AMÉLIORER |

## Constats techniques
1. **Bloquant pour le réel** : `get_albert_adapter()` retourne `None` et aucun transport réel n'est instancié. C'est une protection volontaire ; ne pas la lever dans cet audit.
2. **Bloquant pour le réel** : aucun modèle `text-generation` autorisé n'a été vérifié sur le compte ; les identifiants `test-chat` sont fictifs.
3. **Bloquant pour usage élève** : pas de mécanisme d'identification/autorisation utilisateur, de limitation de débit par utilisateur, ni de cadre de protection des données approuvé.
4. **À corriger avant le réel** : améliorer les codes d'erreur fournisseur 404/422/503, et ajouter des tests correspondants.
5. **À corriger avant le réel** : `warnings` annonce `simulated_provider_transport` lorsqu'un adaptateur est injecté ; ce message ne devra jamais être réutilisé pour une vraie connexion.
6. **À compléter** : tests de `GET /v1/models` avec filtrage explicite de `type == text-generation`, sans révéler de modèles interdits.
7. **À compléter** : protection contre réponse excessivement longue, charge concurrente, délai et fuite de secrets dans les journaux de production.
8. **Avertissement pytest** : dépréciation issue de `starlette.testclient` rapportée localement ; aucun échec, mais conserver la trace, identifier les versions exactes installées puis appliquer une mise à jour ciblée et retester. Ne pas supposer qu'installer un paquet au nom approchant corrige le problème.

## Protocole d'essai réel (NON AUTORISÉ PAR CET AUDIT)
- Validation du compte et de la politique d'accès institutionnelle.
- Vérification explicite du modèle autorisé via `/v1/models` ; capacité `text-generation`.
- Clé uniquement côté serveur, injectée hors dépôt ; jamais transmise dans la conversation ni dans des captures.
- Exécution sur poste local, serveur lié à `127.0.0.1`, avec une question fictive non personnelle.
- Enregistrement des seuls codes de statut, durée et identifiant opaque ; aucun prompt, réponse, jeton ou en-tête sensible.
- Arrêt immédiat en cas d'anomalie ; révocation/rotation du secret si exposition.

## Décision
- Le contrat de base est confirmé par la documentation officielle.
- L'implémentation G3-P2A reste **validée uniquement pour le périmètre simulé**.
- G3-P2B réel : **BLOQUÉ** jusqu'aux corrections, tests, revue de sécurité et autorisation humaine spécifique.
- Aucun commit sur `main`, aucune publication et aucun appel authentifié à Albert API dans cet audit.
