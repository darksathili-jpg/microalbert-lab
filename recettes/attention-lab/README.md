# Recette du laboratoire d’attention

Code vérifié au commit `0e9cca1`, branche `feature/attention-lab`, issue de `main` (`4457687`). Le dépôt de départ proposait une mission Albert statique. L’accueil relie désormais les deux parcours. Le moteur de la mission est conservé et le sprite fourni est chargé par son mécanisme existant.

## Résultats

| Contrôle exécuté | Résultat |
| --- | --- |
| `node --test` | 10 tests réussis, dont les 6 tests existants de la mission. |
| `python verification.py` et `python export_reference.py`, NumPy 2.3.5 | 21 états et 126 propagations, normalisation, perte strictement décroissante et tests finaux. `cmp` a confirmé l’identité octet pour octet avec le JSON fourni. |
| Comparaison JavaScript/JSON | Tolérance absolue 10⁻⁸ sur X, Q, K, V, scores, α, z, h, logits, probabilités et pertes, 10⁻⁶ sur états, gradients et perte moyenne. Tolérance 10⁻¹² sur les normalisations. Aucun écart au-delà des seuils. |
| Cas scientifiques et validation des états | Softmax stable, gradients nuls attendus, isolement corpus/test, ablation, invariance de α à WV, inférence pure, mise à jour simultanée, entrées invalides et validation de la provenance à l’import. |
| Playwright 1.62.1, Chromium 156 | Découverte en dix étapes, précédent/suivant, clavier, trois modes, édition matrice, rejet d’un mot inconnu, calcul papier, pause et reprise, entraînement à 20 pas, comparaison, ablation, quiz, persistance des réponses, restauration graine 12, import/export, quatre liens PDF, téléchargement réel du livret et mission Albert jouée jusqu’à la cible. Aucune erreur console ni réponse HTTP en échec pendant le scénario. |
| axe-core 4.14.1 | Aucune violation automatisée pour les règles WCAG 2.0 et 2.1 A/AA testées sur les neuf combinaisons thème/mode. Ce résultat couvre les états inspectés par le script. |
| Build statique | Assemblage avec `build.sh`, test d’intégrité ZIP, routes et fichiers servis sous `/microalbert-lab/`. |

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

- [Côte à côte](captures/cote-a-cote.jpg) et [superposition à opacité égale](captures/superposition.jpg), établis à partir du rendu et de la maquette à 1672 × 941. Le rendu est à gauche dans la comparaison.
- Nuit aux quatre résolutions demandées. [1672 × 941](captures/1672x941-nuit.jpg) · [1440 × 900](captures/1440x900-nuit.jpg) · [1280 × 720](captures/1280x720-nuit.jpg) · [390 × 844](captures/390x844-nuit.jpg) · [Cartes sur mobile](captures/mobile-cartes.jpg).
- [Clair](captures/1672x941-clair.jpg) · [Projecteur](captures/1672x941-projecteur.jpg).
- [Multiplications Q/K/V](captures/calcul-4.jpg) · [Softmax d’attention](captures/calcul-6.jpg) · [Softmax de sortie](captures/calcul-9.jpg) · [Résultat après 20 pas](captures/entrainement-20.jpg) · [Trace d’entraînement](captures/trace-20.jpg).

La première capture a révélé un titre replié à la résolution native, des cellules dépassant de leur carte et des commandes sous le bord de l’écran. Les largeurs de titre et de cartes, le tableau des paramètres et la densité verticale ont été ajustés. Une erreur JavaScript au rendu initial du questionnaire et une requête d’icône manquante ont été corrigées et contrôlées sur les scénarios rejoués. La pause annule la minuterie, afin qu’une reprise ne conserve aucun pas déjà programmé.

La maquette montre un graphique chiffré et trois candidats dès l’arrivée. Le parcours élève dévoile les poids et la sortie aux étapes de calcul correspondantes, et le modèle n’a que deux candidats. La barre latérale contient les destinations disponibles. La chaîne conserve sept groupes visuels avec dix étapes accessibles. Le personnage utilise la pose frontale immobile de l’atlas livré et conserve son canal alpha. La pose avec baguette et les effets lumineux du bandeau restent des écarts visuels par rapport à la maquette. Les éléments se réorganisent lorsque la largeur diminue.

## Publication

L’API Pages indique une publication de type workflow et la source déclarée `feature/g4-github-pages-preview`. Le workflow de cette branche assemble le site et le parcours existants vers l’URL Pages du projet. Il se déclenche uniquement sur cette branche et ne fournit pas d’URL isolée pour la branche Attention Lab. Le build et les preuves ci-dessus constituent la livraison de recette. La fusion et la publication restent soumises à la validation humaine.
