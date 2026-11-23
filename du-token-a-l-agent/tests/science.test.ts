import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  tokenize,
  question,
  attention,
  softmax,
  dot,
  loss,
  gradient,
  probability,
  sftLoss,
  cosine,
  sample,
} from '../src/science.ts'
const close = (a: number, b: number, e = 1e-9) =>
  assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`)
test('L01 découpage sans perte, espaces et identifiants', () => {
  for (const s of [
    question,
    '',
    'chat chat chat',
    '🌟 aé\n\t',
    '  Montréal !',
    'e\u0301',
  ]) {
    const parts = tokenize(s)
    assert.equal(parts.map((t) => t.token).join(''), s)
    assert.deepEqual(
      parts.map((t) => t.position),
      parts.map((_, i) => i),
    )
  }
  assert.deepEqual(
    tokenize('chat chat chat').map((t) => t.id),
    [4, 5, 5],
  )
  assert.equal(tokenize(question).find((t) => t.token === ' NSI')?.id, 1)
})
test('SCI-01/02 normalisation stable et température', () => {
  assert.deepEqual(
    softmax([2, 0, -1, 1]).weights.map((w) => w.toFixed(6)),
    ['0.643914', '0.087144', '0.032059', '0.236883'],
  )
  for (const t of [0.01, 0.5, 1, 2])
    close(
      softmax([10000, 9999, -10000], t).weights.reduce((a, b) => a + b),
      1,
      1e-10,
    )
  assert.throws(() => softmax([1], 0))
  assert.deepEqual(
    [
      [2, 1],
      [0, 2],
      [1, 0],
      [-1, 1],
    ].map((v) => dot(v, [2, 1])),
    [5, 2, 2, -1],
  )
  const w = softmax([2, 0, -1, 1]).weights
  assert.deepEqual(sample(w, 123), sample(w, 123))
})
test('SCI-03/04 attention, masque et dimensions', () => {
  const v = [
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    a = attention([1, 1], v, v)
  assert.deepEqual(a.products, [1, 1, 2])
  a.scores.forEach((s, i) =>
    close(s, [0.70710678, 0.70710678, 1.41421356][i], 1e-8),
  )
  close(
    a.weights.reduce((x, y) => x + y),
    1,
  )
  assert.deepEqual(attention(v[0], v, v, 0).weights, [1, 0, 0])
  close(a.output[0], a.weights[0] + a.weights[2])
  assert.throws(() => dot([1], [1, 2]))
})
test('SCI-05 à 09 pertes et dérivées', () => {
  close(sftLoss([0.1]), 2.302585093)
  close(loss(-2), 2.126928011)
  close(gradient(-2), -0.880797078)
  const updated = -2 - 0.5 * gradient(-2)
  close(updated, -1.559601461)
  close(probability(updated), 0.1737038422073385)
  close((loss(-2 + 1e-5) - loss(-2 - 1e-5)) / 2e-5, gradient(-2))
  assert.ok(loss(updated) < loss(-2))
  close(sftLoss([0.8, 0.6, 0.2]), 2.3434070875143007)
})
test('SCI-10/11 similarité et vecteur nul', () => {
  close(cosine([1, 2], [2, 4])!, 1)
  close(cosine([-1, -2], [2, 4])!, -1)
  assert.equal(cosine([0, 0], [2, 4]), null)
})
import { permitted, transition } from '../src/agent.ts'
test('Autorisations et états imposés par l’orchestrateur', () => {
  const p = { lecture: true, cours: true, python: false, validation: false }
  assert.ok(permitted('lecture', p))
  for (const a of ['python', 'modifier', 'supprimer', 'publier'] as const)
    assert.equal(permitted(a, p), false)
  assert.ok(permitted('modifier', { ...p, validation: true }))
  assert.equal(transition('VERIFICATION', 'échoué'), 'BLOQUE')
  assert.equal(transition('BLOQUE'), 'BLOQUE')
  assert.equal(transition('ATTENTE_ELEVE', 'attente'), 'GUIDAGE')
})
test('Les fonctions mathématiques signalent les dimensions et domaines invalides', () => {
  assert.throws(
    () =>
      attention(
        [1, 0],
        [
          [1, 0],
          [0, 1],
        ],
        [[1, 0]],
      ),
    RangeError,
  )
  assert.throws(
    () =>
      attention(
        [1, 0],
        [
          [1, 0],
          [0, 1],
        ],
        [[1], [1, 1]],
      ),
    RangeError,
  )
  assert.throws(() => softmax([-Infinity]), RangeError)
  assert.throws(() => softmax([]), RangeError)
})
