export const question =
  "Que signifie l'acronyme NSI pour la spécialité du lycée ?"
export const vocabulary = ['Que', ' NSI', ' lycée', ' ?']
export const vector = [
  [1, 0.5],
  [-1, 1],
  [0.5, -1],
  [-0.5, -0.5],
]
export function tokenize(text: string) {
  const ids = new Map(vocabulary.map((token, index) => [token, index]))
  return (
    text.match(
      /[\p{Zs}]?(?:[\p{L}\p{M}\p{N}]{1,5}|[^\s\p{L}\p{M}\p{N}])|\s/gu,
    ) ?? []
  ).map((token, position) => {
    if (!ids.has(token)) ids.set(token, ids.size)
    return { token, position, id: ids.get(token)! }
  })
}
export const dot = (u: number[], v: number[]) => {
  if (u.length !== v.length) throw new RangeError('Dimensions incompatibles')
  return u.reduce((sum, x, i) => sum + x * v[i], 0)
}
export function softmax(logits: number[], temperature = 1) {
  if (!Number.isFinite(temperature) || temperature <= 0)
    throw new RangeError('Température strictement positive')
  if (
    !logits.length ||
    logits.some((x) => Number.isNaN(x) || x === Infinity) ||
    logits.every((x) => x === -Infinity)
  ) {
    throw new RangeError('Au moins un score fini est nécessaire')
  }
  const max = logits.reduce((a, b) => Math.max(a, b), -Infinity)
  const exps = logits.map((z) => Math.exp((z - max) / temperature))
  const sum = exps.reduce((a, b) => a + b, 0)
  return { weights: exps.map((x) => x / sum), exps, sum, max }
}
export function attention(
  q: number[],
  keys: number[][],
  values: number[][],
  last = keys.length - 1,
) {
  if (
    !q.length ||
    keys.length !== values.length ||
    !values[0]?.length ||
    values.some((v) => v.length !== values[0].length)
  ) {
    throw new RangeError('Dimensions incompatibles pour l’attention')
  }
  const products = keys.map((k) => dot(q, k))
  const scores = products.map((value, i) =>
    i <= last ? value / Math.sqrt(q.length) : -Infinity,
  )
  const result = softmax(scores)
  const output = values[0].map((_, i) =>
    dot(
      result.weights,
      values.map((v) => v[i]),
    ),
  )
  return { ...result, products, scores, output }
}
export const loss = (w: number) =>
  Math.max(0, -w) + Math.log1p(Math.exp(-Math.abs(w)))
export const probability = (w: number) => Math.exp(-loss(w))
export const gradient = (w: number) => -probability(-w)
export const sftLoss = (p: number[]) =>
  p.reduce((sum, x) => sum - Math.log(x), 0)
export function cosine(u: number[], v: number[]) {
  const scale = Math.hypot(...u) * Math.hypot(...v)
  return scale === 0 ? null : Math.max(-1, Math.min(1, dot(u, v) / scale))
}
export function sample(weights: number[], seed: number) {
  const nextSeed = (Math.imul(1664525, seed) + 1013904223) >>> 0
  const draw = nextSeed / 4294967296
  let cumulative = 0
  const index = weights.findIndex((weight) => (cumulative += weight) > draw)
  return { index: index < 0 ? weights.length - 1 : index, nextSeed }
}
export const fmt = (n: number, digits = 4) =>
  Number.isFinite(n)
    ? n.toLocaleString('fr-FR', { maximumFractionDigits: digits })
    : '−∞'
