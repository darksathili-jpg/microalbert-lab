# Architecture cible — MicroAlbert Lab V1
Statut : PROPOSÉE / G0 NON VALIDÉ

## Décisions structurantes
- Application web React + TypeScript (strict), Vite.
- API serveur Python FastAPI + Pydantic, unique propriétaire du secret ALBERT_API_KEY.
- Albert API accessible **uniquement côté serveur**, via adaptateur isolé et configurable. Les identifiants de modèles sont découverts auprès du service, sans présumer de leur aptitude à converser.
- Exécution de code Python dans Pyodide/Web Worker avec arrêt, timeout et réinitialisation; aucun accès à la clé API. Ne pas qualifier un Worker de sandbox de sécurité complète.
- Validation des exercices par tests déterministes, indépendants de la génération IA.
- Séparation des composants pédagogiques, animations 2D, client HTTP et schémas de données.
- Aucun usage réel auprès des élèves avant analyse RGPD, autorisations nécessaires et recette G5.

## Contrats minimaux
POST /api/chat : {mode: "eleve"|"enseignant"|"audit", model_id: string, message: string, mission_id?: string}
Réponse : {reply: string, model_id: string, finish_reason?: string, request_id: string, warnings: string[]}
GET /api/models : liste de modèles et capacités confirmées ou inconnues.
GET /api/health : état local sans secret.
Erreurs normalisées : 400 invalid_input, 401 local_access_denied, 429 rate_limited, 502 provider_error, 504 provider_timeout; ne jamais divulguer les secrets ni prompts sensibles dans les traces.

## Défense en profondeur
- Serveur local lié à 127.0.0.1 par défaut; authentification/contrôle d'origine avant toute exposition réseau.
- Quotas par requête et par session, limites de taille des entrées et des sorties, timeout fournisseur.
- Markdown assaini avec désactivation du HTML brut; CSP et tests d'injection.
- Aucun journal contenant clé, identifiant individuel d'élève ou texte personnel non nécessaire.
- Tests contractuels avec fournisseur simulé; appels Albert réels seulement en recette explicite.
- Historique désactivé par défaut; toute persistance demande une politique de conservation documentée.

## Chemin de migration
1. Inventorier le prototype V0.1 et ses dépendances, sans supposer son contenu.
2. Figer une référence visuelle approuvée et les assets autorisés.
3. Reproduire la connectivité Albert en tests simulés puis réel contrôlé.
4. Construire la couche UI et les modes, puis le laboratoire Python.
5. Ne pas migrer aveuglément le code du prototype ni ses défauts de rendu.
