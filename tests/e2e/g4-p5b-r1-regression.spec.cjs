const { test, expect } = require('@playwright/test');

test.beforeEach(async ({page}) => {
  await page.goto('http://127.0.0.1:5173/');
});
async function execute(page, source) {
  await page.locator('#lab-code').fill(source);
  await page.getByRole('button', {name:'Exécuter le code'}).click();
}
test('R1 : interpreter reset between executions', async ({page}) => {
  await execute(page, 'secret_de_test = 42\nprint(secret_de_test)');
  await expect(page.getByText('Exécution terminée')).toBeVisible({timeout:30000});
  await expect(page.locator('.python-runner-output')).toContainText('42');
  await execute(page, 'print(secret_de_test)');
  await expect(page.getByText('Exécution en erreur')).toBeVisible({timeout:30000});
  await expect(page.locator('.python-runner-output')).toContainText('NameError');
});
test('R1 : syntax errors remain visible', async ({page}) => {
  await execute(page, 'def incomplete(');
  await expect(page.getByText('Exécution en erreur')).toBeVisible({timeout:30000});
  await expect(page.locator('.python-runner-output')).toContainText('SyntaxError');
});
test('R1 : stdout is truncated', async ({page}) => {
  await execute(page, 'print("x" * 25000)');
  await expect(page.getByText('Exécution terminée')).toBeVisible({timeout:30000});
  await expect(page.locator('.python-runner-output')).toContainText('Sortie tronquée');
});
test('R1 : no Albert or external requests during simple Python execution', async ({page}) => {
  const external = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (!['127.0.0.1','localhost'].includes(url.hostname)) external.push(request.url());
    if (/albert/i.test(url.pathname) && /\/api\//.test(url.pathname)) external.push(request.url());
  });
  await execute(page, 'print(7)');
  await expect(page.getByText('Exécution terminée')).toBeVisible({timeout:30000});
  expect(external).toEqual([]);
});
