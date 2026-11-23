export const labs = [
  [
    'Du texte aux tokens',
    'Les LLM · vue d’ensemble',
    'layers',
    'Décomposer le texte en unités, lire leurs identifiants et comprendre le rôle des vecteurs et des positions.',
    'Chaînes de caractères, entiers, coordonnées dans le plan.',
    'Transformer et attention',
  ],
  [
    'Transformer et attention',
    'Transformer et attention',
    'network',
    'Calculer une attention et expliquer le masque causal, les têtes et les couches.',
    'Vecteurs, matrices, produit scalaire, exponentielle.',
    'Logits et génération',
  ],
  [
    'Logits, softmax et génération',
    'Prédire un token',
    'chart',
    'Calculer des probabilités et comparer les stratégies de sélection du prochain token.',
    'Produit scalaire, exponentielle et probabilités.',
    'Apprentissage',
  ],
  [
    'Entraînement et apprentissage',
    'L’entraînement',
    'gear',
    'Calculer une perte et une mise à jour par descente de gradient.',
    'Fonction exponentielle, logarithme et dérivée.',
    'Post-entraînement',
  ],
  [
    'Du GPT préentraîné à ChatGPT',
    'De GPT à ChatGPT',
    'message',
    'Expliquer comment un modèle préentraîné devient un assistant et qui exécute les outils.',
    'Prédiction du prochain token et fonction de perte.',
    'Recherche documentaire',
  ],
  [
    'Paramètres, contexte et RAG',
    'Connaissances et RAG',
    'database',
    'Distinguer trois sources d’information et classer des documents par similarité.',
    'Vecteurs, produit scalaire et normes.',
    'Agents IA',
  ],
  [
    'Agent IA, outils et orchestrateur',
    'Les agents IA',
    'bot',
    'Suivre une machine à états et contrôler les permissions d’un tuteur.',
    'Affectation, boucle bornée, fonctions et tests Python.',
    'Projet MicroAlbert',
  ],
  [
    'Projet intégrateur · MicroAlbert',
    'Projet MicroAlbert',
    'rocket',
    'Exécuter Python, interpréter les preuves et guider un élève par indices progressifs.',
    'Ateliers précédents, programmation et tests en Python.',
    'Bilan du parcours',
  ],
] as const
export type QuizItem = {
  prompt: string
  options: string[]
  correct: number
  why: string
}
export const quiz: QuizItem[][] = [
  [
    {
      prompt: 'Dans l’expérience de découpage, quelles données sont fictives ?',
      options: [
        'Les segments et leurs identifiants',
        'La phrase que je saisis',
        'L’orthographe officielle de NSI',
      ],
      correct: 0,
      why: 'Le texte saisi est l’entrée réelle. Le découpage et les identifiants proviennent de nos règles, propres à cet atelier.',
    },
    {
      prompt:
        'Pourquoi « chat » et « chat » précédé d’un espace peuvent-ils être des tokens différents ?',
      options: [
        'Certains tokeniseurs associent l’espace initial au fragment',
        'Un espace change toujours le sens du mot',
        'Un identifiant représente le nombre de lettres',
      ],
      correct: 0,
      why: 'Un espace initial peut faire partie de l’unité encodée et donner une entrée distincte dans le vocabulaire.',
    },
    {
      prompt:
        'Pourquoi connaître le vocabulaire ne suffit-il pas à produire une réponse ?',
      options: [
        'Le vocabulaire indique déjà la meilleure réponse',
        'Il faut contextualiser les tokens et prédire les suivants',
        'Il faut trier les identifiants',
      ],
      correct: 1,
      why: 'Le vocabulaire associe unités et identifiants. Le modèle utilise aussi ses paramètres et les positions dans le contexte pour calculer une distribution sur les tokens suivants.',
    },
    {
      prompt:
        'Transfert · Deux textes ont les mêmes tokens dans un ordre différent. Qu’est-ce qui doit changer ?',
      options: [
        'La liste des positions associées aux tokens',
        'La signification intrinsèque des identifiants',
        'Les paramètres appris',
      ],
      correct: 0,
      why: 'Les positions changent avec l’ordre. Le vocabulaire et les paramètres peuvent rester identiques.',
    },
  ],
  [
    {
      prompt: 'Calculez [1,1] · [1,0] puis [1,1] · [1,1].',
      options: ['1 et 2', '2 et 1', '1 et 1'],
      correct: 0,
      why: 'Multipliez les composantes correspondantes puis additionnez les produits.',
    },
    {
      prompt: 'Pourquoi diviser par la racine de la dimension des clés ?',
      options: [
        'Pour limiter l’amplitude des scores et la saturation du softmax',
        'Pour trier les tokens',
        'Pour calculer une norme des valeurs',
      ],
      correct: 0,
      why: 'Sous des hypothèses de composantes indépendantes de variance unitaire, le produit scalaire a une variance proportionnelle à la dimension.',
    },
    {
      prompt:
        'Transfert · Au deuxième token, quelle clé masque-t-on en génération causale ?',
      options: ['La première', 'La deuxième', 'La troisième'],
      correct: 2,
      why: 'La troisième position est dans le futur. Un poids élevé sur un token autorisé indique une contribution au calcul, sans certifier la vérité de la réponse.',
    },
  ],
  [
    {
      prompt: 'Quel logit donne [2,1] · [2,1] ?',
      options: ['3', '5', '1'],
      correct: 1,
      why: 'Le logit est le score brut 2 × 2 + 1 × 1 = 5. Une probabilité exige la normalisation.',
    },
    {
      prompt:
        'Quelle est la somme des probabilités ? Que fait une température plus élevée ?',
      options: [
        '1 et elle aplatit la distribution',
        '1 et elle la concentre',
        'Elle dépend du nombre de tokens',
      ],
      correct: 0,
      why: 'La division par la somme des exponentielles normalise la distribution. Une température plus élevée rapproche les scores relatifs.',
    },
    {
      prompt:
        'Transfert · Un token est sélectionné. Que sait-on de sa vérité ?',
      options: [
        'Sa vérité dépend de son rang',
        'La sélection n’établit aucune vérité',
        'Une probabilité élevée certifie sa vérité',
      ],
      correct: 1,
      why: 'La probabilité est conditionnelle au contexte et aux paramètres du modèle. Une vérification externe peut être nécessaire.',
    },
  ],
  [
    {
      prompt: 'Combien vaut −ln(0,1) ?',
      options: ['1', '≈ 2,302585', '0,1'],
      correct: 1,
      why: 'ln(0,1) = −ln(10), où ln est le logarithme népérien.',
    },
    {
      prompt:
        'Avec w = −2, η = 0,5 et un gradient de −0,880797, calculez w après une mise à jour.',
      options: ['≈ −1,559601', '≈ −2,440399', '≈ 0,440399'],
      correct: 0,
      why: 'w devient w − η × gradient. Le gradient négatif fait augmenter w et donc la probabilité de la cible.',
    },
    {
      prompt: 'Transfert · En inférence, que fait-on des paramètres ?',
      options: [
        'On les met à jour à chaque réponse',
        'On les utilise avec le contexte pour calculer les sorties',
        'On les remplace par le contexte',
      ],
      correct: 1,
      why: 'Une session d’inférence ordinaire utilise des paramètres déjà appris.',
    },
  ],
  [
    {
      prompt: 'Dans la perte supervisée, que représente yᵢ ?',
      options: [
        'Le vrai token de réponse à la position i',
        'Une préférence utilisateur',
        'La température',
      ],
      correct: 0,
      why: 'La perte mesure la probabilité du token cible, conditionnée sur x et les vrais tokens cibles précédents.',
    },
    {
      prompt: 'Une instruction de style modifie quoi ?',
      options: ['Les paramètres appris', 'Le contexte', 'Le vocabulaire'],
      correct: 1,
      why: 'Une instruction est une entrée supplémentaire. Le réglage fin est une opération d’entraînement qui modifie les paramètres.',
    },
    {
      prompt:
        'Transfert · Pour faire expliciter un raisonnement à un élève, quel style choisir ?',
      options: [
        'Réponse brute',
        'Indice suivi d’une question ciblée',
        'Répéter la question',
      ],
      correct: 1,
      why: 'Un indice et une question demandent à l’élève de produire et vérifier son raisonnement.',
    },
  ],
  [
    {
      prompt: 'Pour u = (1,2) et v = (2,4), que vaut le cosinus ?',
      options: ['10', '1', '0'],
      correct: 1,
      why: 'Le produit scalaire vaut 10 et le produit des normes vaut aussi 10.',
    },
    {
      prompt:
        'D’où vient une définition ajoutée seulement dans votre message ?',
      options: [
        'D’une mise à jour des poids',
        'Du contexte',
        'D’une recherche automatique dans le corpus',
      ],
      correct: 1,
      why: 'La définition est fournie dans l’entrée et sa portée dépend de la consigne.',
    },
    {
      prompt:
        'Transfert · Que faire après la mise à jour d’un document du corpus ?',
      options: [
        'Mettre à jour son index et rechercher à nouveau',
        'Réentraîner obligatoirement le modèle',
        'Garder les anciennes citations',
      ],
      correct: 0,
      why: 'La recherche travaille sur le corpus indexé. Un document mis à jour peut être réindexé indépendamment des paramètres.',
    },
  ],
  [
    {
      prompt: 'Pourquoi ce programme affiche-t-il 4 ?',
      options: [
        'La borne 5 est incluse',
        'Chaque affectation remplace somme par i',
        'Python additionne automatiquement',
      ],
      correct: 1,
      why: 'La boucle bornée visite 0 à 4 et la dernière affectation fixe somme à 4.',
    },
    {
      prompt: 'Quel premier indice aide sans livrer la correction ?',
      options: [
        'Fais un tableau des valeurs de somme à chaque tour',
        'Recopie un programme corrigé',
        'Demande à publier le code',
      ],
      correct: 0,
      why: 'Le tableau rend visible que la valeur précédente n’intervient dans aucun calcul.',
    },
    {
      prompt:
        'Transfert · L’outil dépasse son délai. Que doit faire l’orchestrateur ?',
      options: [
        'Réessayer indéfiniment',
        'Bloquer avec un motif et arrêter',
        'Inventer une sortie',
      ],
      correct: 1,
      why: 'Le délai et le budget sont des critères d’arrêt. La sortie doit venir de l’exécution ou être signalée comme indisponible.',
    },
  ],
  [
    {
      prompt: 'Quelle donnée décrit l’observation réelle ?',
      options: [
        'La phrase du tuteur',
        'La sortie capturée par le worker',
        'Le score de similarité',
      ],
      correct: 1,
      why: 'La sortie et l’erreur viennent du programme exécuté. Une question de tutorat s’appuie sur cette observation.',
    },
    {
      prompt:
        'Quelle première aide proposer après une sortie différente de l’objectif ?',
      options: [
        'Publier le code',
        'Donner le programme corrigé',
        'Demander de tracer les valeurs intermédiaires',
      ],
      correct: 2,
      why: 'La trace aide à formuler une hypothèse vérifiable et laisse la modification à l’élève.',
    },
    {
      prompt: 'Transfert · Quand passer à TERMINE ?',
      options: [
        'Quand une exécution satisfait l’oracle et que l’élève explique la correction',
        'Quand une sortie quelconque apparaît',
        'Dès le premier indice',
      ],
      correct: 0,
      why: 'Le projet combine preuve d’exécution et vérification de la compréhension.',
    },
  ],
]
