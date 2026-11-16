const { test, expect } = require('@playwright/test');
const preview = require('../../frontend/src/training-preview.json');

test('le pilote affiche deux activités et compare des tentatives par session', async ({ page }) => {
  const catalog = preview.map(entry => ({
    mission_id: entry.id, level: entry.level, title: entry.title, statement: entry.statement,
    starter_code: entry.examples[0].source, source_reference: entry.reference,
    source_url: 'https://example.invalid/annale.pdf', checks_to_design: entry.checks,
  }));
  let mission;
  let calls = 0;
  let sessionNumber = 0;
  const externalRequests = [];
  await page.route('**/*', route => {
    if (new URL(route.request().url()).origin === 'http://127.0.0.1:5173') return route.continue();
    externalRequests.push(route.request().url());
    return route.abort();
  });
  const tutorRequests = [];
  await page.route('**/api/secure/tutor/models', route =>
    route.fulfill({ json: { models: ['microalbert-simulation'] } }));
  await page.route('**/api/secure/tutor', route => {
    const request = route.request();
    expect(request.headers().authorization).toBe('Bearer faux-jeton-de-test');
    const body = request.postDataJSON();
    expect(body.session_id).toBe('test-session-' + sessionNumber);
    expect(body.mission_id).toBe(mission);
    expect(body.model_id).toBe('microalbert-simulation');
    tutorRequests.push(body);
    return route.fulfill({ json: { reply: 'Quel cas limite vérifier ?', warnings: [] } });
  });
  await page.route('**/api/secure/assessment**', route => {
    const request = route.request();
    expect(request.headers().authorization).toBe('Bearer faux-jeton-de-test');
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/activities')) return route.fulfill({ json: catalog });
    const body = request.postDataJSON();
    if (path.endsWith('/session')) {
      mission = body.mission_id;
      calls = 0;
      return route.fulfill({ json: { session_id: 'test-session-' + ++sessionNumber } });
    }
    expect(body.session_id).toBe('test-session-' + sessionNumber);
    expect(body.mission_id).toBe(mission);
    const example = preview.find(item => item.id === mission).examples[calls++];
    expect(body.source).toBe(example.source);
    return route.fulfill({ json: {
      next_question: example.question,
      findings: example.observations.map((question, index) => ({ code: String(index), function: null, question })),
      trend: { attempts_observed: example.attempt, resolved_findings: Array(example.resolved_diagnostics).fill('code') },
    } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('button', { name:'Enseignant', exact:true }).click();
  await page.getByLabel('Jeton du pilote enseignant').fill('faux-jeton-de-test');
  await page.getByRole('button', { name:'Charger les exercices' }).click();
  const selector = page.getByLabel('Activité', { exact:true });
  await expect(selector.locator('option')).toHaveCount(2);
  await page.getByRole('button', { name:'Ouvrir une session', exact:true }).click();
  await page.getByRole('button', { name:'Analyser la tentative' }).click();
  await expect(page.getByRole('heading', { name:'Tentative 1' })).toBeVisible();
  await page.locator('#teacher-training-source').fill(preview[0].examples[1].source);
  await page.getByRole('button', { name:'Analyser la tentative' }).click();
  await expect(page.getByRole('heading', { name:'Tentative 2' })).toBeVisible();
  await expect(page.getByText(/Diagnostics structurels disparus/)).toBeVisible();
  await expect(page.getByText('Comportement du programme non évalué.')).toBeVisible();
  await expect(page.getByLabel('Modèle du tuteur').locator('option')).toHaveText('Simulation locale');
  const message = page.getByLabel('Décrire la difficulté');
  const log = page.getByRole('log', { name: 'Échanges de la session' });
  for (const difficulty of ['Je bloque.', 'Je révise ma tentative.']) {
    await message.fill(difficulty);
    await page.getByRole('button', { name: 'Demander une relance' }).click();
    await expect(log).toContainText(difficulty);
  }
  await expect(log.getByText('Quel cas limite vérifier ?', { exact: false })).toHaveCount(2);
  expect(tutorRequests.map(request => request.source)).toEqual(Array(2).fill(preview[0].examples[1].source));
  await selector.selectOption(preview[1].id);
  await expect(page.locator('#teacher-training-source')).toHaveCount(0);
  await page.getByRole('button', { name:'Ouvrir une session', exact:true }).click();
  await page.getByRole('button', { name:'Analyser la tentative' }).click();
  await expect(page.getByRole('heading', { name:'Tentative 1' })).toBeVisible();
  await expect(page.getByText(/salles_accessibles.*renvoyer/)).toBeVisible();
  await expect(log).toBeEmpty();
  await expect(page.getByText(/Exercice original inspiré du sujet 26-NSIJ1ME1/)).toBeVisible();
  await expect(page.locator('.teacher-training a[href]')).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  for (const theme of ['light', 'dark', 'projector']) {
    await page.getByLabel('Affichage :').selectOption(theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  }
});
