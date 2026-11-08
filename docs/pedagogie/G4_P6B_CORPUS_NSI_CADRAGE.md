# G4-P6-B — Corpus NSI et contrat pédagogique (cadrage)

Statut : SPÉCIFIÉ — pas de validation technique ou pédagogique à ce stade.

## Sources prioritaires
1. Banque officielle des 23 sujets pratiques 2026 : https://sti.eduscol.education.fr/concours_examens/epreuve-pratique-bac-specialite-numerique-et-sciences-informatiques-2026
2. Épreuves écrites 2024–2026 : https://eduscol.education.gouv.fr/5199/annales-des-epreuves-du-baccalaureat-des-voies-generale-et-technologique et https://sti.eduscol.education.fr/formations/bac-voie-generale/specialite-nsi-numerique-et-sciences-informatiques
3. Banque officielle des 48 sujets pratiques 2025, en second ordre : https://sti.eduscol.education.fr/concours_examens/epreuves-bac-et-concours-general-specialite-nsi-2025
4. Modalités de l'épreuve pratique 2026 : https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/textes/bac-voie-generale/specialite-nsi-numerique-et-sciences-informatiques/18788-partie-pratique-de-lepreuve-de-lenseignement-de-specialite-numerique-et-sciences-informatiques.pdf

## Contrainte de conformité
Les situations d'évaluation 2026 sont conçues pour la certification : ne pas les reprendre telles quelles pendant la formation. Créer des situations originales ciblant les compétences, avec traçabilité source → notion → adaptation → tests. Ne pas assimiler une exécution Python sans exception à une solution correcte.

## Lot de conception
- Inventorier chaque sujet avant sélection ; distinguer faits extraits des sources et interprétations pédagogiques.
- Prioriser les compétences réellement identifiées dans le corpus, notamment les structures de données et la programmation Python lorsque présentes.
- Définir pour chaque activité : niveau, prérequis, objectif observable, consigne originale, code initial incomplet, tests normaux et limites, indices gradués sans solution, erreurs fréquentes, justification attendue, critères d'accessibilité.
- Prévoir un mode enseignant avec références précises et correction séparée du mode élève.
- Préserver le vocabulaire du programme officiel : « variable de type entier », « affecter une valeur à une variable », « boucle bornée ».

## Portes de contrôle
G0 sources vérifiées ; G1 conception validée ; G2 implémentation ; G3 tests automatisés ; G4 recette humaine ; G5 publication (INTERDITE sans nouvelle autorisation).

Interdictions : fusion dans main, déploiement, publication de site, appel réel à l'API Albert, exposition de secrets. Cette branche distante de travail n'est pas un déploiement.

## Ressource pédagogique complémentaire fournie par l'enseignant
- Portail de révision : https://darksathili-jpg.github.io/pratique_2026/ (23 fiches de révision liées aux sujets pratiques 2026).
- Fiche sujet 01, codage RLE : https://darksathili-jpg.github.io/pratique_2026/sujet_1/fiche_rle_nsi_light.html — parcours de liste, codage/décodage, contre-exemples, limites de 255, tests d'aller-retour. RLE = Run-Length Encoding, codage par plages.
- Fiche sujet 15, cabinet vétérinaire : https://darksathili-jpg.github.io/pratique_2026/sujet_15/fiche_veto_nsi_light.html — chaînes, SQL, SQLite, dictionnaires, jeux de tests et débogage.
- Fiche sujet 21, cartes mémoire : https://darksathili-jpg.github.io/pratique_2026/sujet_21/fiche_cartes_leitner.html — programmation orientée objet et dictionnaires (à détailler après lecture intégrale).

Cette ressource constitue un **support de progression et d'analyse didactique**, pas une preuve indépendante du contenu réglementaire des sujets officiels. Confronter systématiquement chaque fiche à la banque nationale et tracer toute adaptation. Ne pas recopier les corrections dans l'espace élève : conserver des indices gradués et des tests observables. Les exemples du site peuvent être analysés, mais les activités MicroAlbert doivent être originales.
