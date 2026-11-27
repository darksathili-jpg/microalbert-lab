# Modèle de menaces — MicroAlbert Lab
Statut : G0 provisoire

Actifs : clé Albert API, quota utilisateur, poste enseignant, réponses du modèle, travaux des élèves, machine exécutant Python.

Menaces et atténuations :
1. Clé divulguée dans JS, Git ou logs → accès Albert côté serveur, variables d'environnement, .gitignore, scanner de secrets, révocation en cas de fuite.
2. Serveur local exposé à tout le réseau → écoute 127.0.0.1 par défaut, contrôle d'origine, mesures d'authentification avant déploiement.
3. Prompt injection / contenu IA dangereux → sorties non fiables, HTML brut interdit, rendu Markdown assaini, aucune action système pilotée par le modèle.
4. Boucle Python infinie → exécution dans Worker isolé, timeout, destruction/recréation du Worker, plafonds de taille; audit complémentaire pour tout hébergement multi-utilisateur.
5. Données personnelles et mineurs → données fictives pendant G0–G4, étude RGPD et information des responsables avant pilote.
6. Indisponibilité et coût API → timeouts, retries bornés, erreurs explicites, quotas, circuit de secours sans IA.
7. Conformité trompeuse → validation déterministe, journal de preuves versionnées, approbation humaine.
8. Dépendances compromises → verrouillage des versions, scans CI, mises à jour contrôlées.

Aucune clé réelle ne doit être committée. Un dépôt public est visible de tous; ne jamais y placer de travaux d'élèves ou de captures contenant des informations confidentielles.
