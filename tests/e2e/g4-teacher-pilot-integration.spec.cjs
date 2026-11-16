const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const { test, expect } = require('@playwright/test');

const origin = 'http://127.0.0.1:5173';
let server;
let credential;

test.beforeAll(async ({ request }) => {
  server = spawn('python', ['-m', 'app.local_teacher_pilot', '--simulate-tutor'], {
    env: { ...process.env, PYTHONPATH: 'backend' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  credential = await new Promise((resolve, reject) => {
    const lines = createInterface({ input: server.stdout });
    lines.on('line', line => {
      const match = /^Jeton temporaire .* : ([\w-]+)$/.exec(line);
      if (match) resolve(match[1]);
    });
    server.once('error', reject);
    server.once('exit', code => reject(new Error('Le pilote local s’est arrêté avec le code ' + code)));
  });
  await expect.poll(async () => {
    try {
      return (await request.get(origin + '/api/health', { timeout: 1500 })).ok();
    } catch { return false; }
  }).toBe(true);
});

test.afterAll(() => {
  server?.kill();
});

const preview = require('../../frontend/src/training-preview.json');
const questions = {
  'premiere-somme-filtree': ['égalité avec le seuil', 'total prévu et le total observé'],
  'terminale-parcours-graphe': ['deux chemins', 'ordres prévu et observé'],
};

test('pilote enseignant, du programme au test justifié puis à la relance sur les deux niveaux', async ({ browser }) => {
  // This configuration disables traces because the browser uses an ephemeral teacher token.
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const external = [];
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      external.push(url.origin);
      return route.abort();
    });
    await page.goto(origin);
    await page.getByRole('button', { name: 'Enseignant', exact: true }).click();
    await page.getByLabel('Jeton du pilote enseignant').fill(credential);
    await page.getByRole('button', { name: 'Charger les exercices' }).click();
    const selector = page.getByLabel('Activité', { exact: true });
    const difficulty = page.getByLabel('Décrire la difficulté');
    const ask = page.getByRole('button', { name: 'Demander une relance' });
    const log = page.getByRole('log', { name: 'Échanges de la session' });

    for (const practice of preview) {
      const [firstQuestion, testQuestion] = questions[practice.id];
      const revision = practice.examples[1].source;
      const testCase = practice.test_case;
      await selector.selectOption(practice.id);
      await page.getByRole('button', { name: 'Ouvrir une session', exact: true }).click();
      await expect(log).toBeEmpty();
      await difficulty.fill('Je bloque sur le choix d’un cas.');
      await ask.click();
      await expect(log).toContainText(firstQuestion);

      await page.locator('#teacher-training-source').fill(revision);
      await page.getByRole('button', { name: 'Analyser la tentative' }).click();
      await expect(page.getByText('Comportement du programme non évalué.')).toBeVisible();

      await page.getByText('Préparer et justifier un cas de test', { exact: true }).click();
      await expect(page.getByLabel('Résultat observé')).toHaveValue('');
      await page.getByLabel('Appel Python à tester').fill(testCase.expression);
      await page.getByLabel('Résultat attendu').fill(testCase.expected);
      await page.getByLabel('Pourquoi ce cas de test ?').fill(testCase.justification);
      const runner = page.locator('.teacher-training .python-runner');
      await runner.getByRole('button', { name: 'Exécuter le code' }).click();
      await expect(runner.getByRole('status')).toHaveText('Exécution terminée', { timeout: 10000 });
      await expect(runner.getByLabel('Résultats de l’exécution')).toHaveText(testCase.observed);
      await difficulty.fill('Comment exploiter cet écart ?');
      await expect(ask).toBeDisabled();
      await page.getByLabel('Résultat observé').fill(testCase.observed);

      const reply = page.waitForResponse(r => new URL(r.url()).pathname === '/api/secure/tutor');
      await ask.click();
      const response = await reply;
      expect(response.status()).toBe(200);
      expect(response.request().postDataJSON()).toMatchObject({
        mission_id: practice.id, phase: 'verification',
        test_case: testCase,
      });
      await expect(log).toContainText(testQuestion);
      await expect(log).toContainText('Simulation locale');

      await page.locator('#teacher-training-source').fill(revision + '# Nouvelle tentative\n');
      await expect(page.getByLabel('Résultat observé')).toHaveValue('');
      await expect(runner.getByRole('status')).toContainText('aucun programme exécuté');
    }
    expect(external).toEqual([]);
  } finally {
    await context.close();
  }
});
