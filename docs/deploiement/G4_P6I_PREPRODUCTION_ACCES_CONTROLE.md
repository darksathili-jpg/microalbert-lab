# G4-P6-I — Préproduction à accès contrôlé : plan de déploiement (sans publication)

**Statut : PRÉPARÉ — BLOQUÉ AVANT DÉPLOIEMENT.** Ce document ne donne aucune autorisation de publication.

## Architecture retenue

- **Front-end** : application Vite/React construite par `npm --prefix frontend run build`, fichiers statiques issus de `frontend/dist/` ; Pyodide est copié par `prepare:pyodide`. Les missions, le moteur Python local et les tests publics s'exécutent dans le navigateur.
- **API locale** : le front-end appelle `/api/chat` uniquement depuis l'espace Audit. En développement, Vite relaie `/api` vers FastAPI sur `127.0.0.1:8000`. **Cette redirection Vite n'existe pas dans les fichiers statiques publiés.** Le site statique seul ne fournit pas cette API.
- **Décision de préproduction recommandée** : **accès élève/enseignant via site statique protégé**, mais **ne pas exposer l'espace Audit tant qu'une architecture d'administration et d'authentification n'a pas été validée**. L'espace Audit actuel, si accessible, peut afficher une erreur d'API indisponible ; ne pas annoncer une fonctionnalité Audit opérationnelle.
- **Protection d'accès** : authentification au niveau de l'hébergeur ou du proxy *avant* la distribution de tout fichier, y compris `index.html`, les scripts et les ressources Pyodide. Une URL difficile à deviner, `robots.txt`, une vérification JavaScript ou un simple mot de passe dans le code ne sont **pas** des contrôles d'accès.
- **Pas de données nominatives**, pas d'identifiants personnels dans l'application, pas de collecte de code élève, pas d'analytique ni d'outil tiers ajouté sans étude spécifique. Ne pas inscrire de secret dans le dépôt ou le bundle JavaScript.
- **Aucun fournisseur Albert réel** : l'API actuelle est mock-only, aucun secret Albert requis.

## Décisions humaines requises avant publication

1. Choisir l'hébergeur et le mécanisme réel de contrôle d'accès (ex. Cloudflare Access / autre passerelle institutionnellement autorisée) ; confirmer que les élèves disposent du moyen d'authentification requis.
2. Obtenir l'accord institutionnel applicable à un essai avec élèves et examiner la protection des données avec les interlocuteurs compétents de l'établissement. Vérifier conditions d'utilisation et transfert éventuel de données de l'hébergeur.
3. Définir qui peut accéder au site, la durée de l'expérimentation, la révocation des accès et la politique de journalisation de l'hébergeur.
4. Décider si l'espace Audit doit être masqué/désactivé en préproduction ou servi par une API mock protégée, après recette distincte.
5. Autoriser explicitement le déploiement de **la branche et du commit exacts**, pas de `main`.

## Porte G0 — Contrôles hors ligne (autorisés dès maintenant)
- Compilation TypeScript et construction Vite réussies ; `frontend/dist/index.html` et ressources Pyodide présentes.
- Aucun fichier `.env`, jeton, clé, nom d'élève, donnée personnelle ou fichier de développement sensible dans `dist/`.
- 48 tests Playwright de référence et tests Python enseignants exécutés sur le commit candidat (les 48 précédemment réussis concernent G4-P6-G, pas nécessairement la future préproduction).
- Tests fonctionnels et de mutation Balises, séparation Élève / Enseignant / Audit, modes clair/sombre/vidéoprojecteur, navigation mobile.
- Inventaire des requêtes réseau navigateur : vérifier qu'aucune donnée élève n'est envoyée à un service externe. Vérifier absence de dépendance CDN non prévue et chargement local Pyodide.
- Vérifier qu'une visite d'élève ne nécessite pas d'API serveur pour les missions ; Audit est explicitement hors périmètre du pilote tant que non configuré.

## Porte G1 — Contrôles de préproduction (APRÈS autorisation de publication seulement)
- HTTPS valide ; refus d'accès **avant** authentification sur la racine **et** sur une ressource JavaScript/Pyodide ; authentification et déconnexion ; révocation effective.
- Vérification que le serveur ne distribue que `dist/`, sans répertoire `.git`, fichiers de configuration, sources privées ou cartes de débogage sensibles.
- En-têtes de sécurité adaptés (CSP, `X-Content-Type-Options`, `Referrer-Policy`, protections de cadrage), sans casser Pyodide/Worker ; contrôler les restrictions `connect-src` et `worker-src` par tests navigateur réels.
- Vérification du comportement sans cookies tiers, sur ordinateurs du lycée et mobile ; vérifier performances du premier chargement Pyodide.
- Audit du journal d'accès et de sa durée de conservation, politique de purge et procédure d'incident.
- Vérification de l'absence de service Albert réel et de tout stockage de productions ; vérification du fonctionnement hors de l'espace Audit.
- Tester la révocation et la procédure de retour arrière (désactivation de l'URL, suppression de la publication, invalidation des sessions).

## Porte G2 — Expérimentation pédagogique (APRÈS G1)
Utiliser `docs/pedagogie/G4_P6H_PROTOCOLE_CLASSE.md` pour un pilote anonyme à quatre élèves. Recueillir uniquement les observations agrégées prévues ; ne pas annoncer la réussite pédagogique avant analyse.

## Commandes de préparation locale (aucune publication)
```powershell
git fetch origin
git switch --track origin/feature/g4-p6i-staging-readiness
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
python -m unittest discover -s tests/pedagogie -p "test_balises.py" -v
npx.cmd playwright test --config=playwright.edge.config.cjs --reporter=list --workers=1
```

**Interdits sans accord distinct** : `git merge main`, `git push origin main`, `gh-pages`, `wrangler deploy`, création de domaine public, configuration d'un hébergeur ou activation d'un accès élève. Un dépôt privé ne rend pas automatiquement privée une URL de préproduction.

## Registre des preuves à compléter
| Contrôle | Résultat | Date | Preuve | Responsable |
| --- | --- | --- | --- | --- |
| Build | NON TESTÉ | | | |
| 48 Playwright | NON TESTÉ SUR CETTE BRANCHE | | | |
| Python enseignant | NON CONFIRMÉ | | | |
| Analyse réseau | NON TESTÉ | | | |
| Choix hébergeur / authentification | EN ATTENTE | | | |
| Autorisation institutionnelle | EN ATTENTE | | | |
| Autorisation de publication | NON ACCORDÉE | | | |

**Décision : STOP avant tout déploiement.**
