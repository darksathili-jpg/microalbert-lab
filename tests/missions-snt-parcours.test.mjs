import test from 'node:test';
import assert from 'node:assert/strict';
import { interpreterProgramme } from '../site/missions-albert/interpreteur.mjs';
import { MISSIONS_SNT } from '../site/missions-albert/parcours-snt.mjs';
test('catalogue : vingt missions et identifiants uniques',()=>{
 assert.equal(MISSIONS_SNT.length,20);
 assert.deepEqual(MISSIONS_SNT.map(m=>m.id),Array.from({length:20},(_,i)=>i+1));
});
test('séquence et boucle bornée',()=>{
 assert.deepEqual(interpreterProgramme('for i in range(3):\n    albert.avancer()').commands,['avancer','avancer','avancer']);
});
test('condition if/else : une seule branche exécutée',()=>{
 const code='distance = 2\nif distance == 2:\n    albert.avancer()\nelse:\n    albert.tourner_gauche()';
 const result=interpreterProgramme(code);
 assert.deepEqual(result.commands,['avancer']);assert.equal(result.hasCondition,true);
});
test('elif : sélection de la deuxième branche',()=>{
 const code='choix = 2\nif choix == 1:\n    albert.tourner_gauche()\nelif choix == 2:\n    albert.avancer()\nelse:\n    albert.tourner_droite()';
 assert.deepEqual(interpreterProgramme(code).commands,['avancer']);
});
test('booléens et and',()=>{
 const code='pret = True\nenergie = 4\nif pret and energie >= 3:\n    albert.avancer()';
 assert.deepEqual(interpreterProgramme(code).commands,['avancer']);
});
test('while : compteur incrémenté et arrêt',()=>{
 const code='pas = 0\nwhile pas < 3:\n    albert.avancer()\n    pas += 1';
 const result=interpreterProgramme(code);
 assert.deepEqual(result.commands,['avancer','avancer','avancer']);assert.equal(result.hasWhile,true);
});
test('while : compteur décrémenté',()=>{
 const code='energie = 3\nwhile energie > 0:\n    albert.avancer()\n    energie -= 1';
 assert.equal(interpreterProgramme(code).commands.length,3);
});
test('while infinie : interruption de sécurité',()=>{
 assert.throws(()=>interpreterProgramme('pas = 0\nwhile pas < 2:\n    albert.avancer()',10),/limite de sécurité|Limite de 10 commandes/);
});
test('rejet de code non autorisé',()=>{
 assert.throws(()=>interpreterProgramme('import os'),/Instruction non reconnue/);
});
