import test from 'node:test';
import assert from 'node:assert/strict';
import { executerMission, MISSION_DECOUVERTE } from '../missions-albert/moteur.mjs';

test('atteindre la cible après des déplacements réels', () => {
  const resultat = executerMission(MISSION_DECOUVERTE, ['avancer', 'avancer', 'tourner_gauche', 'avancer']);
  assert.equal(resultat.reussite, true);
  assert.deepEqual(resultat.position, { x: 2, y: 1, direction: 'nord' });
  assert.equal(resultat.trace.length, 5);
});
test('un programme incomplet ne valide pas la mission', () => {
  assert.equal(executerMission(MISSION_DECOUVERTE, ['avancer']).reussite, false);
});
test('les obstacles bloquent la position', () => {
  const r = executerMission(MISSION_DECOUVERTE, ['avancer', 'tourner_gauche', 'avancer']);
  assert.match(r.erreur, /Obstacle/);
  assert.deepEqual([r.position.x, r.position.y], [1, 2]);
  assert.equal(r.reussite, false);
});
test('sortir de la grille est interdit', () => {
  const r = executerMission(MISSION_DECOUVERTE, ['tourner_gauche', 'tourner_gauche', 'avancer']);
  assert.match(r.erreur, /limite/);
});
test('une commande inconnue et une séquence trop longue sont refusées', () => {
  assert.match(executerMission(MISSION_DECOUVERTE, ['teleporter']).erreur, /inconnue/);
  assert.match(executerMission(MISSION_DECOUVERTE, Array(21).fill('avancer')).erreur, /limite/);
});
test('les données de mission ne sont pas modifiées', () => {
  const avant = JSON.stringify(MISSION_DECOUVERTE);
  executerMission(MISSION_DECOUVERTE, ['avancer', 'tourner_droite']);
  assert.equal(JSON.stringify(MISSION_DECOUVERTE), avant);
});
