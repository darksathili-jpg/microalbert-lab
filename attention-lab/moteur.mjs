import { embeddings, initial, corpus } from './donnees.mjs';

export const epsilon = 1e-5;
export const eta = 0.5;
export const noms = ['Q', 'K', 'V'];
export const clone = W => W.map(matrix => matrix.map(row => [...row]));

export function tokeniser(phrase) {
  return phrase.toLowerCase().replace(/\p{P}/gu, ' ').trim().split(/\s+/u).filter(Boolean);
}

export function valider(W) {
  if (!Array.isArray(W) || W.length !== 3 || !W.every(matrix =>
    Array.isArray(matrix) && matrix.length === 2 && matrix.every(row =>
      Array.isArray(row) && row.length === 2 && row.every(x => Number.isFinite(x) && Math.abs(x) <= 1e6)))) {
    throw new Error('Indique 3 matrices 2 × 2, avec des nombres finis entre −10⁶ et 10⁶.');
  }
  return W;
}

export function normaliser(values) {
  const max = Math.max(...values);
  const numerateurs = values.map(value => Math.exp(value - max));
  const somme = numerateurs.reduce((a, b) => a + b, 0);
  return { max, numerateurs, somme, p: numerateurs.map(value => value / somme) };
}

export function propager(W, phrase, cible, ablation = false) {
  valider(W);
  const tokens = tokeniser(phrase);
  if (!tokens.length || tokens.length > 32) throw new Error('Saisis entre 1 et 32 tokens.');
  const inconnus = [...new Set(tokens.filter(token => !Object.hasOwn(embeddings, token)))];
  if (inconnus.length) throw new Error('Tokens sans vecteur : ' + inconnus.join(', '));
  if (cible !== undefined && cible !== 0 && cible !== 1) throw new Error('Cible inconnue.');
  const X = tokens.map(token => [...embeddings[token]]);
  const [Q, K, V] = W.map(matrix => X.map(([x, y]) =>
    [0, 1].map(j => x * matrix[0][j] + y * matrix[1][j])));
  const q = Q.at(-1);
  const scores = K.map(k => (k[0] * q[0] + k[1] * q[1]) / Math.sqrt(2));
  const contexte = normaliser(scores);
  const attention = contexte.p;
  const produits = V.map((v, i) => v.map(value => value * attention[i]));
  const sommeValeurs = [0, 1].map(j => produits.reduce((sum, row) => sum + row[j], 0));
  const z = ablation ? [0, 0] : sommeValeurs;
  const h = X.at(-1).map((value, j) => value + z[j]);
  const logits = [h[1], -h[1]];
  const sortie = normaliser(logits);
  const p = sortie.p;
  const loss = cible === undefined ? undefined : (sortie.max - logits[cible]) + Math.log(sortie.somme);
  return { tokens, X, Q, K, V, q, scores, contexte, attention, produits, sommeValeurs, z, h, logits, sortie, p, loss };
}

export function mesurer(W) {
  const exemples = corpus.map(([phrase, cible]) => ({ phrase, cible, ...propager(W, phrase, cible) }));
  return { exemples, moyenne: exemples.reduce((sum, sample) => sum + sample.loss, 0) / exemples.length };
}

export function differences(W, pas = epsilon) {
  return W.map((matrix, m) => matrix.map((row, i) => row.map((ancien, j) => {
    const moins = clone(W);
    const plus = clone(W);
    moins[m][i][j] -= pas;
    plus[m][i][j] += pas;
    const bas = mesurer(moins);
    const haut = mesurer(plus);
    const gradient = (haut.moyenne - bas.moyenne) / (2 * pas);
    return { ancien, moins: bas, plus: haut, gradient, nouveau: ancien - eta * gradient };
  })));
}

export const appliquer = details => details.map(matrix => matrix.map(row => row.map(cell => cell.nouveau)));
export const etape = W => appliquer(differences(W));

export function initialiser(graine = 12, origine = 'reference') {
  if (!Number.isInteger(graine) || graine < 0 || graine > 0xffffffff) throw new Error('Graine entière non signée attendue.');
  if (origine === 'reference') return clone(initial);
  let state = graine;
  return initial.map(matrix => matrix.map(row => row.map(() => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state >= 0x80000000 ? 0.5 : -0.5;
  })));
}

export function importer(data) {
  if (data?.version !== 1 || data.corpus !== 'microalbert-attention-v1' ||
    !['reference', 'alternative'].includes(data.origine) ||
    (data.origine === 'reference' && data.graine !== 12) ||
    !Number.isInteger(data.iteration) || data.iteration < 0 || data.iteration > 20 ||
    !['manuel', 'entrainement'].includes(data.type) || (data.type === 'manuel' && data.iteration !== 0)) {
    throw new Error('État incompatible avec cette version ou ce corpus.');
  }
  const depart = initialiser(data.graine, data.origine);
  const W = valider(data.W);
  if (data.type === 'manuel') return { ...data, W: clone(W) };
  let attendu = depart;
  for (let i = 0; i < data.iteration; i++) attendu = etape(attendu);
  if (attendu.flat(2).some((value, i) => Math.abs(value - W.flat(2)[i]) > 1e-10)) {
    throw new Error('Les matrices divergent de la trace d’entraînement déclarée.');
  }
  return { ...data, W: attendu };
}
