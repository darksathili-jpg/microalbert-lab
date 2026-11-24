# Recette du laboratoire d’attention

Cycle final de G5, sur `feature/attention-lab` à partir de `e011454`. Le code vérifié est publié au commit [`c2b1c1e48feec2cf0201e53c2cd5954c52d9ff7c`](https://github.com/darksathili-jpg/microalbert-lab/commit/c2b1c1e48feec2cf0201e53c2cd5954c52d9ff7c). Les commandes ont été exécutées sur le commit local `461387f47861fda66adb9df7fdf8c7a57f90f539`. L’arbre Git `db2f07292c8da0f72b960d321c0b7aab58a69ac3` est identique pour les deux commits. Les preuves et le ZIP sont dans le commit suivant.

## Résultats

| Contrôle exécuté | Résultat |
| --- | --- |
| `node --test` | 10 tests réussis, dont les 6 tests existants de la mission. |
| `python verification.py` et `python export_reference.py`, NumPy 2.3.5 | 21 états et 126 propagations, normalisation, perte strictement décroissante et tests finaux. `cmp` a confirmé l’identité octet pour octet avec le JSON fourni. |
| Comparaison JavaScript/JSON | Tolérance absolue 10⁻⁸ sur X, Q, K, V, scores, α, z, h, logits, probabilités et pertes, 10⁻⁶ sur états, gradients et perte moyenne. Tolérance 10⁻¹² sur les normalisations. Aucun écart au-delà des seuils. |
| Cas scientifiques et validation des états | Softmax stable, gradients nuls attendus, isolement corpus/test, ablation, invariance de α à WV, inférence pure, mise à jour simultanée, entrées invalides et validation de la provenance à l’import. |
| Playwright 1.62.1, Chromium 156 | Découverte en dix étapes avec contrôle du verrouillage avant tentative, précédent/suivant, clavier, trois modes, édition matrice, rejet d’un mot inconnu, calcul papier, pause et reprise, entraînement à 20 pas, comparaison, ablation, quiz, persistance des réponses, restauration graine 12, import/export, trois poses, respect du mouvement réduit, absence de débordement de la mascotte sur mobile, quatre liens PDF, téléchargement réel du livret et mission Albert jouée jusqu’à la cible. Aucune erreur console ni réponse HTTP en échec pendant le scénario. |
| axe-core 4.14.1 | Aucune violation automatisée pour les règles WCAG 2.0 et 2.1 A/AA testées sur les neuf combinaisons thème/mode. Ce résultat couvre les états inspectés par le script. |
| Build statique | Assemblage avec `build.sh`, test d’intégrité ZIP, routes et fichiers servis sous `/microalbert-lab/`. |

Journaux bruts de recette. [Node](node.log) · [Chromium et axe-core](chromium.log) · [Moteur Python](verification.log) · [Export Python](python-export.log).

Avec la graine 12, la perte moyenne passe de **0,82571** à **0,40603** après 20 mises à jour. Le test NSI donne **0,60295** pour Python, et le test web **0,64925** pour HTML. L’ablation donne **0,5 / 0,5** pour ces deux phrases. Les sorties proviennent du moteur et les poids restent fixes en inférence. Les deux phrases de test vérifient cette tâche étroite avec des embeddings choisis à la main.

## Reproduire

Depuis la racine du dépôt, Python doit disposer de NumPy. Les dépendances de recette navigateur sont indépendantes du site.

```sh
node --test
oracle="$(mktemp -d)"
cp tests/attention-reference/* "$oracle/"
(cd "$oracle" && python verification.py && python export_reference.py)
cmp tests/attention-reference/reference.json "$oracle/reference.json"

site="$(mktemp -d)"
sh attention-lab/build.sh "$site/microalbert-lab"
python -m http.server 8384 --bind 127.0.0.1 --directory "$site"
```

Dans un second terminal, avec Chromium disponible à l’emplacement indiqué (adapter le chemin au poste) :

```sh
recette="$(mktemp -d)"
npm install --prefix "$recette" playwright@1.62.1 axe-core@4.14.1
NODE_PATH="$recette/node_modules" \
  AXE_PATH="$recette/node_modules/axe-core/axe.min.js" \
  CHROMIUM_PATH=/usr/bin/chromium \
  node tests/browser/attention-lab.mjs
```

Le [build statique vérifié](microalbert-lab-statique.zip) contient un dossier racine `microalbert-lab/`. Servir son dossier parent par HTTP pour reproduire le préfixe GitHub Pages et ouvrir `/microalbert-lab/attention-lab/`.

## Vérification visuelle

[Comparaison côte à côte](captures/cote-a-cote.jpg) et [superposition à opacité égale](captures/superposition.jpg), obtenues à 1672 × 941, sans mise à l’échelle des sources. Le rendu est à gauche. Cette vue est prise à la fin de la découverte, aux poids initiaux, pour rendre visibles les valeurs dans les cartes.

| Résolution | Nuit | Clair | Projecteur |
| --- | --- | --- | --- |
| 1672 × 941 | [Capture](captures/1672x941-nuit.jpg) | [Capture](captures/1672x941-clair.jpg) | [Capture](captures/1672x941-projecteur.jpg) |
| 1440 × 900 | [Capture](captures/1440x900-nuit.jpg) | [Capture](captures/1440x900-clair.jpg) | [Capture](captures/1440x900-projecteur.jpg) |
| 1280 × 720 | [Capture](captures/1280x720-nuit.jpg) | [Capture](captures/1280x720-clair.jpg) | [Capture](captures/1280x720-projecteur.jpg) |
| 390 × 844 | [Capture](captures/390x844-nuit.jpg) | [Capture](captures/390x844-clair.jpg) | [Capture](captures/390x844-projecteur.jpg) |

- Pose d’explication de profil, réflexion de face et légèrement inclinée, validation de face et légèrement agrandie. Les deux images proviennent de cellules immobiles de l’atlas et restent ancrées en bas. Le fondu et les transformations sont désactivés lorsque le mouvement est réduit. Chromium a détecté un débordement vertical mobile lors de l’inspection, corrigé par le dimensionnement de la grille et contrôlé par une assertion géométrique. [Explication sur mobile](captures/mobile-mascotte.jpg) · [Réflexion](captures/mascotte-reflexion.jpg) · [Validation](captures/mascotte-validation.jpg).
- Progression élève. La tentative ouvre le calcul et le bouton suivant. Les valeurs des cartes, l’argmax, la comparaison et le quiz sont dévoilés à leur étape. Les modes de simulation et professeur conservent l’accès direct. Les réponses existantes du livret sont reprises lors de la migration locale. [Découverte terminée](captures/decouverte-resultat.jpg) · [Projections Q/K/V](captures/calcul-4.jpg) · [Softmax d’attention](captures/calcul-6.jpg) · [Softmax de sortie](captures/calcul-9.jpg).
- Calcul. L’ablation affiche la somme pondérée réellement calculée, puis force z à zéro avant le résidu. Les probabilités égales sont signalées et le calcul détaillé indique la convention de départage de l’argmax. HTML reste présenté comme langage de balisage. [Résultat après 20 pas](captures/entrainement-20.jpg) · [Trace d’entraînement](captures/trace-20.jpg).

Le bandeau reprend la pastille de séance, le diagramme et les halos cyan et violet. La position exacte des courbes et du diagramme, la typographie, le cadrage du personnage sans baguette et la densité de la navigation restent différents. Les sept groupes visuels contiennent dix étapes. La sortie à deux candidats et les poids calculés diffèrent des valeurs illustratives de la maquette. La prédiction initiale NSI est HTML à 0,62246, puis Python à 0,60295 après apprentissage.

## Prévisualisation GitHub Pages

L’API Pages indique un déploiement par workflow sur l’URL du site existant. Le workflow est déclenché uniquement par un push sur `feature/g4-github-pages-preview`. Un déploiement depuis la branche de travail vers le même site remplacerait l’artefact courant, même si l’environnement GitHub Actions portait un autre nom. Ajouter un sous-chemin de recette exigerait d’intégrer le build au workflow du site existant. Un dépôt Pages distinct donnerait une URL isolée et nécessiterait l’autorisation de créer et configurer ce dépôt.

L’URL existante a répondu et son `revision.txt` indiquait `82325ca514fc4f9435f5d6b1c6f5df548569ec99`. Le build statique joint est la prévisualisation de recette disponible. Aucun déploiement ni changement de configuration Pages n’a été effectué.
