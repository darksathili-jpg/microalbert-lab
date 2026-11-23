export const program =
  'somme = 0\nfor i in range(5):\n    somme = i\nprint(somme)'
export const states = [
  'RECEPTION',
  'ANALYSE',
  'VERIFICATION',
  'GUIDAGE',
  'ATTENTE_ELEVE',
  'TERMINE',
  'BLOQUE',
] as const
export type State = (typeof states)[number]
export type Action =
  'lecture' | 'python' | 'cours' | 'modifier' | 'supprimer' | 'publier'
export type Permissions = {
  lecture: boolean
  python: boolean
  cours: boolean
  validation: boolean
}
export function permitted(action: Action, p: Permissions) {
  if (action === 'modifier') return p.validation
  if (action === 'supprimer' || action === 'publier') return false
  return p[action]
}
export function transition(
  state: State,
  outcome: 'suivant' | 'attente' | 'échoué' = 'suivant',
): State {
  if (state === 'TERMINE' || state === 'BLOQUE') return state
  if (outcome === 'échoué') return 'BLOQUE'
  if (state === 'ATTENTE_ELEVE' && outcome === 'attente') return 'GUIDAGE'
  return states[states.indexOf(state) + 1]
}
export const cases = [
  {
    title: 'Somme incorrecte',
    task: 'Afficher la somme des entiers de 0 à 4.',
    code: program,
    result: '10',
    observed: '4',
    hint: 'À chaque tour, quelle valeur de somme est lue avant la nouvelle affectation ?',
    verify: 'Comment faire intervenir l’ancienne valeur de somme ?',
    key: /accumul|précéden|ancienne|addition|ajout/i,
  },
  {
    title: 'Liste vide',
    task: 'Afficher « vide » quand la liste de notes est vide.',
    code: 'notes = []\nprint(notes[0])',
    result: 'vide',
    observed: 'IndexError',
    hint: 'Quelles positions une liste de longueur zéro possède-t-elle ?',
    verify: 'Quel test peut précéder un accès à l’indice 0 ?',
    key: /vide|longueur|len/i,
  },
  {
    title: 'Maximum de nombres négatifs',
    task: 'Afficher le maximum de [−8, −3, −6].',
    code: 'nombres = [-8, -3, -6]\nmaximum = 0\nfor n in nombres:\n    if n > maximum:\n        maximum = n\nprint(maximum)',
    result: '-3',
    observed: '0',
    hint: 'La valeur initiale du maximum appartient-elle aux données ?',
    verify:
      'Pourquoi l’initialisation fonctionne-t-elle aussi avec des listes entièrement négatives ?',
    key: /premier|initial|négatif|élément/i,
  },
  {
    title: 'Borne exclue de range',
    task: 'Afficher les entiers de 1 à 5 inclus, un par ligne.',
    code: 'for n in range(1, 5):\n    print(n)',
    result: '1\n2\n3\n4\n5',
    observed: '1\n2\n3\n4',
    hint: 'Quelle est la dernière valeur réellement parcourue ?',
    verify: 'Comment relier l’argument final à la dernière valeur affichée ?',
    key: /exclu|borne|6/i,
  },
  {
    title: 'Récursivité sans cas de base',
    task: 'Calculer et afficher 3! = 6.',
    code: 'def factorielle(n):\n    return n * factorielle(n - 1)\nprint(factorielle(3))',
    result: '6',
    observed: 'RecursionError',
    hint: 'Que se passe-t-il lorsque n atteint 0 ?',
    verify: 'Quel cas arrête les appels et quelle valeur renvoie-t-il ?',
    key: /base|arrêt|zéro|0/i,
  },
  {
    title: 'Pile ou file vide',
    task: 'Afficher « vide » en l’absence d’élément à dépiler.',
    code: 'pile = []\nprint(pile.pop())',
    result: 'vide',
    observed: 'IndexError',
    hint: 'Quel est le nombre d’éléments avant le dépilement ?',
    verify: 'Quel test évite une opération sur une structure vide ?',
    key: /vide|longueur|len/i,
  },
]
