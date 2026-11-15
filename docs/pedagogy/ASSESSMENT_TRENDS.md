# Suivi longitudinal du diagnostic Python — pilote enseignant

La route protégée `POST /api/secure/assessment` renvoie désormais `trend` : nombre de tentatives observées (plafonné à 20), diagnostics persistants, apparus et disparus, et présence d'une tentative antérieure comparable. La première tentative ne permet **aucune comparaison**. Un diagnostic disparu signifie seulement que l'heuristique ne le détecte plus : **ce n'est pas une preuve de correction fonctionnelle ni une note**.

L'historique est calculé exclusivement à partir des diagnostics établis par le serveur, jamais d'un compteur ou d'un diagnostic fourni par le navigateur. Les données sont isolées par identité enseignante authentifiée et mission. Elles expirent après 30 minutes d'inactivité, sont limitées à 500 sessions et ne contiennent ni code source, ni message d'élève, ni clé Albert. Le processus local ne fournit aucune persistance entre redémarrages ni synchronisation entre plusieurs instances.

Le pilote reste réservé à l'enseignant : aucun accès élève, aucune exécution du code Python soumis, aucun appel Albert réel. La démonstration GitHub Pages est statique et ne constitue pas un serveur HTTPS pour cette API. Avant un usage en classe, vérifier une authentification institutionnelle réelle, l'hébergement HTTPS du serveur, les droits et la confidentialité, la qualité des diagnostics sur des productions d'élèves anonymisées, ainsi que la gratuité des quotas Albert.

## Adaptation du dialogue après plusieurs tentatives

À partir de la troisième tentative observée, si un diagnostic persiste sans nouveau diagnostic et qu'il est sélectionné, le serveur propose une question métacognitive invitant à examiner un petit exemple pas à pas. Lorsqu'un diagnostic disparaît et qu'aucun autre n'est détecté, il invite à construire des tests, notamment sur les cas limites. Un nouveau diagnostic conserve la priorité des questions spécifiques. Aucune de ces situations ne constitue une preuve de correction fonctionnelle, et aucun corrigé n'est fourni. La sélection s'appuie uniquement sur l'historique du serveur, sans nouvel accès élève ni appel à Albert.

## Respect de la phase pédagogique

La relance métacognitive après trois observations d'une même difficulté et l'invitation à construire des tests après disparition des diagnostics sont réservées aux phases `implementation` et `verification`. Les phases `decouverte`, `recherche` et `bilan` conservent leurs questions propres : le tuteur ne doit pas imposer un débogage alors que l'élève découvre le problème ou fait un bilan. La détection des anomalies reste disponible pour l'enseignant, mais aucun diagnostic ne certifie la correction du programme.

Les tests de régression couvrent les cinq phases, les changements de diagnostic et l'absence de validation fonctionnelle. Les tests doivent réussir dans GitHub Actions avant de considérer cette version publiable.
