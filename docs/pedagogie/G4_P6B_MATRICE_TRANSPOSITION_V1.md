# G4-P6-B — Matrice de transposition didactique V1

Statut : EN CONCEPTION. Trois fiches du portail enseignant examinées. Vérification intégrale des sujets officiels et des écrits 2024–2026 encore à effectuer.

## Principes
- Créer des missions originales, sans reprendre les énoncés ou les corrigés des sujets de certification.
- Chaque mission : code initial incomplet, appels d'exemple et résultats attendus, trois indices gradués, tests nominaux et limites, justification écrite.
- Une exécution Python sans exception ne prouve pas la correction de l'algorithme.

## P1 — Codage RLE, fiche pratique 2026 n°1
Source : https://darksathili-jpg.github.io/pratique_2026/sujet_1/fiche_rle_nsi_light.html
Compétences observées : listes, plages consécutives, compression/décompression, contre-exemple, limite de 255.
Activité originale : « Balises lumineuses » — encoder puis décoder des états de capteurs consécutifs.
Tests : liste vide ; une valeur ; valeurs alternées ; plage longue ; propriété aller-retour ; limites du compteur.
Question socratique : « Quand remplacer une plage par un couple augmente-t-il la taille des données ? »

## P2 — Cabinet vétérinaire, fiche pratique 2026 n°15
Source : https://darksathili-jpg.github.io/pratique_2026/sujet_15/fiche_veto_nsi_light.html
Compétences observées : parcours de chaînes, sélection de caractères, tests, dictionnaires, SQL et requêtes paramétrées.
Activité originale : « Inventaire de médiathèque » — normaliser des identifiants, tester leur validité, analyser des emprunts fictifs.
Tests : chaîne vide ; séparateurs ; entrée invalide ; plusieurs lignes ; absence de résultat ; paramétrage SQL.
Question socratique : « Que doit renvoyer la fonction si aucun caractère n'est retenu ? »
Attention : l'exécution SQLite dans Pyodide doit être vérifiée avant implémentation.

## P3 — Cartes Leitner, fiche pratique 2026 n°21
Source : https://darksathili-jpg.github.io/pratique_2026/sujet_21/fiche_cartes_leitner.html
Compétences observées : classe et attributs, transitions d'état, dates, filtrage, débogage logique.
Activité originale : « Maintenance de robots » — niveaux d'entretien et sélection des contrôles prioritaires.
Tests : niveau minimal et maximal ; remise à zéro ; date exactement égale ; liste vide ; minimum changé ; ex æquo.
Question socratique : « Quand le minimum change, que deviennent les éléments précédemment sélectionnés ? »

## Séquence élève
Observer une entrée et une sortie ; formuler une hypothèse ; écrire le programme ; exécuter ; confronter aux tests ; justifier.
Le tuteur doit distinguer erreur de syntaxe, erreur à l'exécution et erreur de logique, sans livrer la solution.

## Portes de contrôle
1. Vérifier la correspondance exacte des compétences avec les PDF officiels 2026.
2. Inventorier les sujets écrits 2024–2026 avec session, centre, exercice et page.
3. Étudier les sujets pratiques 2025 en seconde priorité.
4. Valider pédagogiquement les trois missions avant toute intégration applicative.
5. Tester les fonctions et l'interface indépendamment.

Interdictions : aucune fusion main, aucun déploiement, aucun appel réel Albert, aucune divulgation de secret.