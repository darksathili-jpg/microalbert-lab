# Inventaire de l'archive V0.1 fournie — 2026-11-06
Inspection statique de `albert_nsi_v01(1).zip`, sans exécution de l'application.

Contenu observé :
- `albert_nsi_v01/index.html` — 5 286 octets
- `albert_nsi_v01/server.py` — 3 977 octets
- `albert_nsi_v01/README.txt` — 1 039 octets

Observations du serveur :
- Bibliothèque standard Python `http.server`, sans dépendance FastAPI à ce stade.
- Écoute sur `127.0.0.1:8765`; routes `/`, `/api/models`, `/api/chat`.
- Clé obtenue via `os.getenv('ALBERT_API_KEY')` et envoyée uniquement au fournisseur par le serveur.
- Trois prompts système : `eleve`, `enseignant`, `audit`.
- `max_tokens: 1000`, délai fournisseur de 50 s; `finish_reason` non retourné au navigateur.
- Modèles listés sans filtrage des capacités de conversation.
- Les réponses sont renvoyées sous forme de texte; le rendu Markdown doit être audité dans l'interface.
- Contrôle de taille de requête partiel; aucun dispositif de sécurité réseau multi-utilisateur n'est démontré.

Aucun test automatisé ni preuve de recette navigateur n'est fourni dans l'archive. La migration doit préserver l'original hors dépôt jusqu'à l'audit de sécurité et de licence. Ne pas publier automatiquement l'archive brute.
