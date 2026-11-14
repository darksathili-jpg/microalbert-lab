# G4 — Barrière de sortie du tuteur NSI (lot de sécurité)

## Fonctionnement
Le point d'accès enseignant `POST /api/secure/tutor` conserve son contrôle d'authentification, son autorisation et sa limitation de débit. Après la réponse de l'adaptateur Albert, `review_tutor_output` applique un filtrage conservateur avant tout retour HTTP.

Les réponses vides, trop longues, contenant un bloc de code, une définition de fonction ou une formulation explicite de corrigé complet sont remplacées par une question socratique fixe. Le serveur ajoute `output_guard_blocked` aux avertissements. Aucun contenu bloqué n'est renvoyé dans les avertissements.

## Limites critiques
**Ce filtrage n'est pas une garantie contre les fuites de corrigés.** Un corrigé en langage naturel, une expression Python sur une ligne, un code déguisé ou un contournement multilingue peuvent lui échapper. Inversement, des explications légitimes peuvent être bloquées. La présence d'une barrière n'autorise pas l'ouverture du service aux élèves.

Les compteurs `attempts` et `hints_used` sont encore déclarés par le client et non maintenus par le serveur. L'authentification est une démonstration en mémoire, non un fournisseur d'identité de production. L'API réelle demeure réservée au pilote enseignant et nécessite approbation explicite et vérification de la gratuité.

## Preuves attendues
- `backend/tests/test_tutor_output_guard.py` : corpus de blocage et de questions autorisées ; test HTTP avec `httpx.MockTransport`.
- `backend/tests/test_secure_tutor.py` : accès anonyme et élève refusés ; accès enseignant contrôlé.
- GitHub Actions `microalbert-pages.yml` : tests Python, compilation frontend, tests Playwright et publication uniquement si les contrôles réussissent.

## Suite
1. Maintenir l'état de session, le budget d'indices et les tentatives côté serveur.
2. Tester les attaques en langue naturelle, les paraphrases et les variantes de code.
3. Préparer une véritable authentification sans ouvrir le site statique à une clé.
4. Vérifier les conditions financières de l'API Albert avant tout appel réel.
