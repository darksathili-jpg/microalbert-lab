# MicroAlbert · Rapport de validation

Le cahier pédagogique v1.0 fournit les contenus et les critères scientifiques. Le fichier d’instructions joint est un document d’accompagnement. Le périmètre de livraison et de publication découle de la demande de l’utilisateur.

## G0 · Ressources et design

La maquette RGB (1 672 × 941) et l’atlas RGBA (1 086 × 1 448) ont été lus et contrôlés. La structure de l’accueil reprend la navigation latérale, la barre de recherche, le bandeau avec MicroAlbert, les huit jalons et les quatre portes d’entrée. Les panneaux de stratégie et de pile technique imprimés autour de l’interface décrivent le projet. En petit écran, la navigation est repliable et le parcours passe en grille à quatre colonnes puis en liste.

La couleur sombre reprend les aplats échantillonnés de la maquette. Les palettes claire et vidéoprojecteur déclinent les surfaces, textes et indicateurs. Inter et IBM Plex Mono sont servis localement. Les poses viennent de l’atlas. Les trois poses de face sont recentrées dans des cadres identiques sur une ligne de sol commune. La séquence de marche au survol est continue par images entières et désactivée quand la préférence de réduction des animations est activée. Le cerveau est un schéma vectoriel redessiné. Les captures d’accueil permettent de comparer la hiérarchie du parcours, la composition du bandeau et la densité aux références. Les effets lumineux et les illustrations de cartes ont été simplifiés.

## G1 à G4 · Traçabilité

| Lab | Notion et démonstration | Expériences | Exercice et évaluation | Vérification | Capture |
|---|---|---|---|---|---|
| L01 | Découpage sans perte, index, E[1], positions et fenêtre | A01 texte → unités, A02 table et plan 2D | Espaces associés, identifiants stables et transfert vers l’ordre des tokens | Tests de reconstruction, édition et synchronisation SVG, quiz et persistance | l01-ordinateur, l01-tablette, l01-telephone |
| L02 | Q/K/V, produits [1,1,2], √2, softmax, somme pondérée | A01 projections éditables, A02 causalité, A03 deux têtes et projection | Produits manuels, masque, échelle et interprétation | SCI-03/04, masque à poids exactement nuls, modification des entrées | l02-telephone |
| L03 | Projection de h, exemples A et B, stabilité du softmax | A01 logits, histogramme et température, A02 sélection et cycle | Trois températures, prédiction gloutonne, transfert vers la véracité | SCI-01/02, test des grands logits et graine reproductible | l03-telephone |
| L04 | Entropie croisée binaire, gradient, règle de chaîne et extension multiclasse | A01 pas de gradient et courbes, A02 exemples autosupervisés | Calcul d’une mise à jour, rôle du signe et inférence | SCI-05 à 08, différence finie et perte décroissante | l04-telephone |
| L05 | Perte SFT, préférences, rôles et outils | A01 classement et perte, A02 style, A03 appel simulé | Annotation de la perte, distinction contexte et poids, choix de style | SCI-09, changement d’instruction et progression de l’appel | l05-telephone |
| L06 | Paramètres, contexte, recherche documentaire et cosinus | A01 portée, A02 classement vectoriel, A03 recherche réelle | Produit, normes, cosinus et mise à jour du corpus | SCI-10/11, vecteur nul et passage avec provenance | l06-telephone |
| L07 | Machine à états, affectations Python, politique et critères d’arrêt | A01 embranchements, A02 permissions, A03 trace simulée | Refuser une publication, expliquer la dernière affectation | Tests de transitions et permissions, refus dans l’interface | l07-telephone |
| L08 | Preuves d’exécution, oracle et notation formative | A01 éditeur, worker, historique, indices et compréhension | Six scénarios avec sorties attendues, grille de compréhension | Exécution réelle, exception, sortie longue, timeout et redémarrage | l08-telephone |

G2 calcule les références en double précision. Pour la perte SFT, la valeur est 2,3434070875143 et s’affiche 2,343407088 à neuf décimales. Le softmax de l’exemple B donne 0,643914, 0,087144, 0,032059, 0,236883. La probabilité après la première mise à jour de l’exemple L04 vaut 0,1737038422073385.

G4 utilise exclusivement le scénario prédéfini pour le tutorat. Le worker est créé à la demande, dispose de 20 secondes de chargement puis de 4 secondes d’exécution, et chaque sortie est bornée. La vérification de compréhension s’appuie sur le code effectivement exécuté et reste une grille formative par mots-clés. GitHub Pages est l’unique cible de déploiement. Un dépôt homonyme héberge déjà un autre aperçu de MicroAlbert. La cible de publication reste à déterminer.

## Résultats de l’exécution locale

- 7 tests unitaires réussis.
- 9 scénarios Chromium réussis. Navigation entre les huit laboratoires, correction et restauration du quiz, export et import, expérience numérique de chaque séance, six oracles Python, permission d’exécution, exception, limite de sortie, dépassement de délai et exécution suivante.
- Aucune violation détectée par axe sur les règles WCAG 2.0 A/AA et 2.1 AA activées pour les huit laboratoires sur 1 440 px (sombre), 820 px (clair) et 390 px (vidéoprojecteur). Navigation clavier vérifiée sur l’accueil et le premier laboratoire. Les tables longues disposent d’un défilement local au clavier. L’audit automatisé ne constitue pas une certification d’accessibilité.
- 34 captures PNG. Accueil et laboratoire 01 dans les trois configurations, puis laboratoires 02 à 08 sur téléphone sombre et dans les trois configurations d’audit.
- Vérification statique sous le préfixe /microalbert/ avec Chromium et exécution réelle de Python. Sortie 4 et aucune erreur réseau ou de console dans ce scénario.
- Aucune publication distante effectuée. Le workflow GitHub Actions est livré avec les sources.
