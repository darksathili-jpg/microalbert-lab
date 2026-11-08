# G4-P6-J — Variante pilote élèves (non déployée)

**État : EN VÉRIFICATION.** Cette branche prépare une interface d'expérimentation, sans publier de site ni activer de compte.

## Changement
Avec `VITE_STUDENT_STAGING=true` **au moment du build**, l'interface n'affiche que l'espace Élève. Les boutons Enseignant et Audit, ainsi que l'outil « Interroger le simulateur », ne sont pas rendus. Le badge précise « Pilote élèves — non certifié ». Sans cette variable, le comportement historique des trois espaces est conservé pour les tests de régression.

**Limite de sécurité essentielle :** masquer une interface côté client ne constitue **pas** une autorisation d'accès. Les ressources JavaScript peuvent contenir du contenu statique enseignant et des éléments du prototype. Le vrai contrôle d'accès doit être assuré par Cloudflare Access ou un mécanisme serveur équivalent. Cette variante n'est pas une séparation cryptographique des rôles et ne doit pas héberger de corrigés confidentiels.

## Vérifications locales (PowerShell)
Depuis la racine du clone, installer les dépendances et construire le candidat :

```powershell
git fetch origin
git switch --track origin/feature/g4-p6j-student-staging
npm.cmd --prefix frontend ci
$env:VITE_STUDENT_STAGING = 'true'
npm.cmd --prefix frontend run build
python scripts/check_staging_artifacts.py
```

Pour la recette de l'interface, arrêter d'abord les éventuels serveurs Vite, puis lancer le serveur de développement dans un premier terminal :

```powershell
$env:VITE_STUDENT_STAGING = 'true'
npm.cmd --prefix frontend run dev
```

Dans un second terminal, depuis la racine du dépôt :

```powershell
$env:VITE_STUDENT_STAGING = 'true'
npx.cmd playwright test tests/e2e/g4-p6j-student-staging.spec.cjs --config=playwright.edge.config.cjs --reporter=list --workers=1
```

**Attention :** ce test dépend du serveur lancé avec la même variable. La configuration Playwright peut lancer son propre serveur ; vérifier son comportement avant de conclure. Nettoyer la variable dans les terminaux concernés avec `Remove-Item Env:VITE_STUDENT_STAGING` après la recette.

## Conditions de validation
- [ ] Build avec variable pilote réussi.
- [ ] Contrôle des artefacts réussi.
- [ ] Test dédié réussi : aucun bouton Enseignant, Audit ou simulateur ; mission Balises accessible.
- [ ] Exécution réelle Python dans le navigateur pilote vérifiée.
- [ ] Les modes clair, sombre, vidéoprojecteur et mobile restent utilisables.
- [ ] Tests de régression de la variante normale exécutés **sans** variable pilote (48 tests de référence).
- [ ] Revue du bundle statique pour vérifier l'absence de corrigés réservés ou de données sensibles.
- [ ] Confirmation que les appels vers `/api/chat` ne sont pas nécessaires au pilote élèves.
- [ ] Contrôle d'accès Cloudflare et approbations institutionnelles : **non réalisés**.

**STOP avant déploiement.** Aucune publication et aucune fusion dans `main` sans accord distinct.
