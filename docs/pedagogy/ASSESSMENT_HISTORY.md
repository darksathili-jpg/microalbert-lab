# Historique pédagogique authentifié — pilote enseignant

La route `POST /api/secure/assessment` conserve désormais uniquement le dernier **code de diagnostic** pour chaque couple (identité enseignante authentifiée, mission). Elle ne conserve ni programme Python ni message d'élève. Le paramètre historique `previous_finding` du navigateur est ignoré : il ne peut ni imposer un diagnostic ni réinitialiser la rotation des questions.

La sélection et l'enregistrement sont atomiques sous verrou. Expiration après 30 minutes, capacité maximale de 500 couples, éviction de l'entrée la plus ancienne, remise à zéro au redémarrage. Aucun suivi durable, aucune synchronisation entre processus et aucune identité élève ne sont proposés. Le pilote reste réservé aux enseignants authentifiés.

Les tests couvrent la rotation, l'isolation entre identités, la falsification du navigateur, le refus d'accès élève, l'expiration et l'éviction. L'analyse statique n'exécute pas le programme et ne certifie pas sa correction fonctionnelle. Aucun appel à Albert n'est effectué par cette route.

**Avant un accès élève :** authentification réelle, stockage durable sécurisé, politique de conservation et tests multi-processus, puis audit indépendant. Ne pas ouvrir l'accès sur la seule base de ce pilote.
