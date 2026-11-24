import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.env.LAB_BASE_URL ?? 'http://127.0.0.1:8384/microalbert-lab/';
const captures = process.env.LAB_CAPTURES ?? '/tmp/microalbert-captures';
await mkdir(captures, { recursive:true });
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined, args:['--no-sandbox']});
try {
  const page = await browser.newPage({viewport:{width:1672,height:941}});
  const anomalies = [];
  page.on('pageerror', error => anomalies.push(String(error)));
  page.on('console', event => { if (event.type() === 'error' || event.type() === 'warning') anomalies.push(event.text() + " " + event.location().url); });
  page.on('response', response => { if (response.status() >= 400) anomalies.push(response.status() + ' ' + response.url()); });
  await page.goto(base);
  await page.getByRole('link',{name:'Laboratoire d’attention'}).click();
  const text = selector => page.locator(selector).textContent();
  assert.match(await text('#tokens'), /Nombre de tokens\s*6/);
  assert.doesNotMatch(await text('#resultat'), /Python|HTML/);
  async function capture(name) {
    await page.evaluate(() => window.scrollTo(0,0));
    await page.screenshot({path:captures+'/'+name+'.png'});
  }
  for (const [width,height] of [[1672,941],[1440,900],[1280,720],[390,844]]) {
    await page.setViewportSize({width,height});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth),width);
    await capture(width+'x'+height+'-nuit');
  }
  await page.locator('.overview').scrollIntoViewIfNeeded();
  await page.screenshot({path:captures+'/mobile-cartes.png'});
  await page.setViewportSize({width:1672,height:941});
  for (const theme of ['clair','projecteur']) {
    await page.locator('#theme').selectOption(theme);
    await capture('1672x941-'+theme);
  }
  await page.locator('#theme').selectOption('nuit');
  await page.locator('#suivant').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id),'etape-titre');
  for (let i=1;i<10;i++) {
    await page.locator('[data-step="'+i+'"]').click();
    assert.match(await text('#etape-titre'), new RegExp('^'+(i+1)));
    await page.locator('#operation > summary').click();
    assert.ok(await page.locator('#operation table, #operation p').first().isVisible());
    if ([3,5,8].includes(i)) await page.locator('#calcul').screenshot({path:captures+'/calcul-'+(i+1)+'.png'});
  }
  await page.locator('#precedent').click();
  assert.match(await text('#etape-titre'), /^9/);
  await page.locator('.modes [data-mode=free]').click();
  const valeur = page.locator('[data-cell="2,1,1"]');
  const pAvant = await text('#resultat');
  const alpha = await text('#apercu');
  await valeur.fill('2');
  await valeur.press('Tab');
  assert.notEqual(await text('#resultat'),pAvant);
  assert.equal(await text('#apercu'),alpha);
  await page.locator('#exemple').selectOption('libre');
  await page.locator('#phrase').fill('En latin');
  await page.locator('#phrase-form button').click();
  assert.match(await text('#status'),/Tokens sans vecteur/);
  await page.locator('#exemple').selectOption('nsi');
  await page.locator('.modes [data-mode=train]').click();
  await page.locator('#cibles').check();
  assert.match(await text('#trace'),/0,82571/);
  await page.locator('#papier').check();
  assert.match(await text('#trace'),/Estimation papier/);
  await page.locator('#papier').uncheck();
  await page.locator('[data-gradient="11"]').click();
  assert.match(await text('#trace'),/WV → valeurs → z/);
  await page.locator('[data-pas="5"]').click();
  await page.locator('#pause').click();
  const pause = (await text('#trace')).match(/Itération \d+ \/ 20/)[0];
  await page.waitForTimeout(220);
  assert.match(await text('#trace'), new RegExp(pause));
  await page.locator('[data-pas="20"]').click();
  await page.waitForFunction(()=>document.querySelector('#trace').textContent.includes('Itération 20 / 20'));
  assert.match(await text('#trace'),/0,40603/);
  assert.match(await text('#comparaison-contenu'),/0,60295.*0,64925/s);
  await page.locator('#ablation').check();
  assert.equal((await text('#comparaison-contenu')).match(/0,50000/g).length,4);
  await page.locator('#ablation').uncheck();
  await capture('entrainement-20');
  await page.locator('#entrainement h2').scrollIntoViewIfNeeded();
  await page.screenshot({path:captures+'/trace-20.png'});
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#export').click();
  const exportPath = await (await downloadEvent).path();
  const saved = await readFile(exportPath);
  assert.equal(JSON.parse(saved).iteration,20);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#reset').click();
  assert.match(await text('#trace'),/0,82571/);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#import').setInputFiles({name:'etat.json',mimeType:'application/json',buffer:saved});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('État importé'));
  assert.match(await text('#trace'),/0,40603/);
  await page.locator('#prof').check();
  assert.ok(await page.locator('#operation').evaluate(x=>x.open));
  const quiz = page.locator('[data-question="livret0"]');
  await quiz.locator('xpath=..').locator('summary').first().click();
  await quiz.locator('input[value="0"]').check();
  await quiz.getByRole('button').click();
  assert.match(await quiz.locator('.tip').textContent(),/Correct/);
  assert.ok(await quiz.getByRole('button').isDisabled());
  await page.reload();
  assert.match(await text('#progression-label'), /1 \/ 20/);
  for (const link of await page.locator('a[href]').all()) {
    const url = new URL(await link.getAttribute('href'), page.url());
    if (url.hash) assert.equal(await page.locator(url.hash).count(),1);
    else {
      const response = await page.request.get(url.href);
      assert.ok(response.ok(), url.href);
      if (url.pathname.endsWith('.pdf')) assert.equal((await response.body()).subarray(0,4).toString(),'%PDF');
    }
  }
  const pdfDownload = page.waitForEvent('download');
  await page.getByRole('link',{name:'Livret élève (PDF)'}).click();
  assert.equal((await pdfDownload).suggestedFilename(),'01_Livret_eleve.pdf');
  await page.setViewportSize({width:390,height:844});
  await page.locator('.modes [data-mode=free]').click();
  await page.locator('[data-cell="0,0,0"]').fill('1');
  await page.locator('[data-cell="0,0,0"]').press('Tab');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth),390);
  await page.goto(new URL('missions-albert/',base).href);
  assert.equal(await page.locator('h1').count(),1);
  await page.locator('#run').click();
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent === 'Mission réussie !');
  assert.ok(await page.locator('#board .target .albert').isVisible());
  if (process.env.AXE_PATH) {
    await page.setViewportSize({width:1440,height:900});
    await page.goto(new URL('attention-lab/',base).href);
    await page.addScriptTag({path:process.env.AXE_PATH});
    for (const theme of ['nuit','clair','projecteur']) {
      await page.locator('#theme').selectOption(theme);
      for (const mode of ['guide','free','train']) {
        await page.locator('.modes [data-mode='+mode+']').click();
        if (mode === 'train') await page.locator('#cibles').check();
        const violations = await page.evaluate(async () => {
          const { violations } = await axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});
          return violations.map(v => ({id:v.id, targets:v.nodes.map(n => n.target)}));
        });
        assert.deepEqual(violations,[],theme+' / '+mode);
      }
    }
    console.log('axe-core : aucune violation automatisée sur neuf combinaisons de thèmes et de modes.');
  }
  assert.deepEqual(anomalies,[]);
  console.log('Chromium : parcours, clavier, modes, calculs, pause, 20 pas, ablation, comparaison, quiz, import/export, PDF, routes et mobile validés.');
} finally {
  await browser.close();
}
