# G3-P0 — Contrat d'intégration Albert API

**Date :** 2026-11-07  
**État :** SPÉCIFIÉ — NON IMPLÉMENTÉ — ATTENTE_HUMAINE pour toute connexion réelle.

## 1. Périmètre
- Préserver `microalbert-mock` comme fournisseur par défaut et chemin de repli de test.
- Ne pas changer le contrat public local sans tests de non-régression : `GET /api/health`, `GET /api/models`, `POST /api/chat`.
- Trois rôles d'interface : `eleve`, `enseignant`, `audit`. Le rôle transmis par le navigateur n'est **pas** une preuve d'identité ni une autorisation.
- Aucune connexion réseau à Albert API, aucune clé, aucune modification du frontend ni du backend dans G3-P0.

## 2. Références à revérifier avant G3-P1
- https://ia.numerique.gouv.fr/outils-ia/albert-api/
- https://albert.api.etalab.gouv.fr/reference
- Vérifier l'URL de base, les versions d'API, l'authentification, la découverte des modèles, les capacités des modèles, les quotas et les conditions d'utilisation au moment de l'implémentation.
- Ne pas présumer qu'un modèle listé permet la conversation ; filtrer par capacité documentée.

## 3. Architecture cible (proposition)
Navigateur React → API FastAPI locale → adaptateur de fournisseur → Albert API HTTPS.
Le navigateur n'a jamais accès à la clé et ne contacte jamais directement Albert API.
L'adaptateur expose des méthodes `list_models` et `chat` et retourne des données normalisées.
Le fournisseur `mock` est injecté par défaut. Un fournisseur `albert` n'est activable qu'avec configuration serveur explicite, clé présente et validation humaine.

## 4. Configuration serveur envisagée
- `MICROALBERT_PROVIDER=mock|albert`, valeur par défaut `mock`.
- `ALBERT_API_KEY` : secret injecté dans le processus backend uniquement ; jamais dans `VITE_*`, `localStorage`, fichier suivi par Git ou message d'erreur.
- `ALBERT_API_BASE_URL` : origine HTTPS officielle explicitement autorisée ; interdiction des URL arbitraires envoyées par le navigateur (protection SSRF).
- Liste blanche explicite des modèles conversationnels autorisés ; ne pas permettre d'identifiants de modèle arbitraires.
- `ALBERT_TIMEOUT_SECONDS` borné ; taille maximale des réponses et limites de concurrence.

## 5. Contrat local actuel à préserver
`ChatRequest` : `mode` parmi `eleve|enseignant|audit`, `model_id` de 1 à 120 caractères, `message` non vide (1 à 4000 caractères), `mission_id` optionnel.
`ChatResponse` : `reply`, `model_id`, `finish_reason` optionnel, `request_id`, `warnings`.
La réponse d'Albert doit être normalisée vers ce schéma sans exposer les en-têtes d'authentification ni les réponses brutes sensibles.

## 6. Erreurs et protections cibles
- Entrée invalide : 422 (validation locale) ou 400 (modèle non autorisé).
- Identifiants absents/invalides : 503 côté application, message générique sans secret ; ne pas renvoyer le détail du fournisseur.
- Limite de débit fournisseur : 429 avec indication de réessai sûre si disponible.
- Indisponibilité fournisseur : 502/503 ; expiration : 504.
- Aucune répétition automatique des requêtes de génération sans politique explicite et borne stricte.
- Aucune journalisation des messages, réponses, clés ou données personnelles par défaut ; traces techniques minimales avec identifiant opaque, durée et code d'état.
- Authentification/autorisation locale et limites de débit **à concevoir avant toute exposition multi-utilisateur**.
- CORS restrictif et serveur lié à 127.0.0.1 pendant les essais.
- Ne pas traiter un texte produit par le modèle comme une instruction système ou une correction pédagogique certifiée.

## 7. Portes de validation
G3-P1 (adaptateur désactivé par défaut) :
1. Tests unitaires avec HTTP simulé : réussite, réponse malformée, modèle incompatible, 401/403, 429, 5xx, délai dépassé, absence de clé.
2. Test prouvant qu'aucun secret n'apparaît dans les réponses, logs, captures, artefacts de test ou code frontend.
3. Test du mode mock et des trois espaces sans régression.
4. Test du démarrage sans clé et sans connexion réseau.
5. Audit des dépendances, contrôle des sorties et vérification des protections contre requêtes vers des hôtes arbitraires.

G3-P2 (test réel, seulement après autorisation explicite) :
- Autorisation humaine, compte et droits vérifiés, clé gérée hors dépôt, modèle de conversation autorisé, question fictive.
- Mesure des codes d'erreur et de la latence sans conservation des prompts.
- Aucun déploiement ni accès élève à ce stade.

## 8. Décision
G3-P0 produit des documents et des contrats uniquement. Il n'autorise ni connexion réelle, ni fusion, ni publication.
