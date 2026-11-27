# Contrat d'intégration — Assistance enseignant
**Statut : SPÉCIFIÉE, implémentation non commencée**

## Navigation attendue
La future interface MicroAlbert Lab propose un accès visible « Aide à l'installation » depuis l'accueil et les modes Élève / Enseignant / Audit. Le guide s'ouvre sans envoyer de clé au navigateur.

## Réutilisation du guide
Le document autonome `docs/enseignants/guide-installation.html` est la référence G0. L'intégration V1 devra éviter deux copies divergentes : contenu structuré réutilisable (Markdown ou données versionnées), page HTML générée et composant React issus d'une source commune.

## Parcours
1. Préparer le compte et la clé depuis les services officiels.
2. Configurer la clé dans la session du serveur local, jamais dans un champ web.
3. Lancer un diagnostic serveur à résultat non sensible.
4. Distinguer : connexion réseau, authentification API, modèle conversationnel, disponibilité de génération.
5. Afficher une aide contextuelle par code d'erreur, sans afficher d'identifiant secret.

## API diagnostic proposée
`GET /api/setup/status` retourne seulement `{server_ready:boolean, api_key_present:boolean, provider_reachable:boolean|null, models_available:boolean|null, checked_at:string|null}`. Ne jamais retourner la clé, un extrait, sa longueur ou un jeton. Pour un serveur exposé, protéger cet endpoint contre l'accès non autorisé et les abus.

## Critères de recette
- Le guide fonctionne hors ligne.
- Le thème vidéoprojecteur ne conserve aucune zone sombre.
- La documentation est accessible au clavier et aux lecteurs d'écran.
- Le test de configuration n'envoie jamais la clé au client.
- Aucun texte généré par l'IA n'est présenté comme un diagnostic système fiable.
- Les commandes de la fiche technique sont exécutées par un enseignant volontaire sur poste de test avant validation.

## Interdictions
Aucun formulaire HTML de saisie de clé Albert; aucune clé dans localStorage, URL, fichier JS ou journal client. Aucun appel direct du navigateur vers Albert API.

## Porte
G1 ne peut démarrer qu'après validation G0 et décision humaine explicite.
