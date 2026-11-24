import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { corpus, tests as horsCorpus } from '../attention-lab/donnees.mjs';
import { differences, etape, importer, initialiser, mesurer, normaliser, propager, tokeniser } from '../attention-lab/moteur.mjs';

const ref = JSON.parse(readFileSync(new URL('./attention-reference/reference.json', import.meta.url)));
function proche(a, b, tolerance, context) {
  if (Array.isArray(b)) {
    assert.equal(a.length, b.length, context);
    b.forEach((value, i) => proche(a[i], value, tolerance, context + '[' + i + ']'));
  } else assert.ok(Math.abs(a-b) <= tolerance, context + ' : ' + a + ' / ' + b);
}

test('21 états et 126 propagations comparés au moteur NumPy', () => {
  let W = initialiser();
  for (const state of ref.trace) {
    const diff = differences(W);
    proche(W, state.W, 1e-6, 'W ' + state.step);
    proche(diff.map(m => m.map(r => r.map(x => x.gradient))), state.gradient, 1e-6, 'gradient ' + state.step);
    proche(mesurer(W).moyenne, state.loss, 1e-6, 'moyenne ' + state.step);
    for (const sample of [...state.train, ...state.test]) {
      const d = propager(W, sample.text, sample.target);
      for (const key of ['X','Q','K','V','scores','attention','z','h','logits','p','loss']) {
        proche(d[key], sample[key], 1e-8, key + ' ' + state.step + ' ' + sample.text);
      }
      for (const a of [d.p, d.attention]) proche(a.reduce((x,y) => x+y), 1, 1e-12, 'normalisation');
    }
    W = etape(W);
  }
});
test('ablation, invariance à V, gradients nuls, mise à jour simultanée, inférence pure', () => {
  const W = initialiser();
  for (const [s,y] of horsCorpus) {
    assert.ok(!corpus.some(([phrase]) => phrase === s));
    assert.deepEqual(propager(W,s,y,true).p, [.5,.5]);
    const altered = initialiser();
    altered[2][1][1] = 1;
    assert.deepEqual(propager(W,s).attention, propager(altered,s).attention);
    assert.notDeepEqual(propager(W,s).p, propager(altered,s).p);
  }
  const grad = differences(W);
  for(const [m,i,j] of [[0,1,0],[0,1,1],[2,0,0],[2,1,0]]) assert.equal(grad[m][i][j].gradient,0);
  const apres = etape(W);
  assert.deepEqual(W, ref.trace[0].W);
  assert.deepEqual(apres, grad.map((m,a) => m.map((r,b) => r.map((x,c) => W[a][b][c] - .5*x.gradient))));
});
test('stabilité, tokenisation et entrées invalides', () => {
  assert.deepEqual(normaliser([1e12,-1e12]).p,[1,0]);
  assert.deepEqual(tokeniser('En NSI, tu vas programmer en…'), ['en','nsi','tu','vas','programmer','en']);
  assert.throws(() => propager(initialiser(), 'En latin'));
  assert.throws(() => propager(initialiser(), ''));
  assert.throws(() => propager([], 'en'));
  assert.throws(() => propager(initialiser(), 'en', 2));
  assert.throws(() => initialiser(-1, 'alternative'));
  const W = initialiser();
  W[2][0][1] = 1e6;
  assert.ok(Number.isFinite(propager(W, 'en', 1).loss));
});
test('graine reproductible et import versionné sans falsifier la provenance', () => {
  const base = {version:1, corpus:'microalbert-attention-v1', origine:'reference', graine:12, iteration:1, type:'entrainement', W:etape(initialiser())};
  assert.deepEqual(importer(JSON.parse(JSON.stringify(base))), base);
  for (const invalid of [{version:2},{W:initialiser()},{graine:11},{corpus:'externe'},{iteration:21},{type:'manuel'}]) {
    assert.throws(() => importer({...base,...invalid}));
  }
  assert.deepEqual(initialiser(42,'alternative'), initialiser(42,'alternative'));
  assert.deepEqual(initialiser(), ref.trace[0].W);
});
