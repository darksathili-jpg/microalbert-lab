const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const guide = pathToFileURL(path.resolve(__dirname, '../../docs/enseignants/guide-installation.html')).href;

test.beforeEach(async ({ page }) => { await page.goto(guide); });

test('GE-01: sections and local navigation', async ({ page }) => {
  await expect(page).toHaveTitle(/MicroAlbert Lab/);
  for (const id of ['acces','cle','test','demarrage','depannage','recette']) {
    await expect(page.locator('#' + id)).toBeVisible();
  }
  await page.getByRole('link', {name:/6\. Recette/}).click();
  await expect(page).toHaveURL(/#recette$/);
});

test('GE-03: projector has no dark surfaces', async ({ page }) => {
  await page.locator('#theme').selectOption('projector');
  const selectors = ['body','header','section','pre','aside','nav a'];
  for (const selector of selectors) {
    const backgrounds = await page.locator(selector).evaluateAll(nodes => nodes.map(n => getComputedStyle(n).backgroundColor));
    for (const bg of backgrounds) {
      if (bg === 'rgba(0, 0, 0, 0)') continue;
      const rgb = bg.match(/\d+/g).slice(0,3).map(Number);
      expect(Math.min(...rgb), selector + ' has dark background: ' + bg).toBeGreaterThanOrEqual(240);
    }
  }
});

test('GE-04: no horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('GE-06 and GE-07: checklist and reset', async ({ page }) => {
  const checks = page.locator('#checks input[type=checkbox]');
  await expect(checks).toHaveCount(5);
  for (let i=0;i<5;i++) await checks.nth(i).check();
  await expect(page.locator('#count')).toHaveText('5 / 5 contrôles cochés');
  await page.getByRole('button',{name:'Réinitialiser la fiche'}).click();
  await expect(page.locator('#count')).toHaveText('0 / 5 contrôles cochés');
  for (let i=0;i<5;i++) await expect(checks.nth(i)).not.toBeChecked();
});

test('GE-02 and GE-05: focus and theme switch', async ({ page }) => {
  await page.locator('#theme').selectOption('dark');
  await expect(page.locator('body')).toHaveAttribute('data-theme','dark');
  await page.locator('#theme').selectOption('light');
  await expect(page.locator('body')).toHaveAttribute('data-theme','light');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.tagName)).not.toBe('BODY');
});

for (const theme of ['light','dark','projector']) {
  for (const [width,height] of [[1536,1024],[1366,768],[390,844]]) {
    test('capture '+theme+' '+width+'x'+height, async ({page}) => {
      test.setTimeout(60000); // Captures pleine page sur navigateur mobile : délai distinct des assertions fonctionnelles.
      await page.setViewportSize({width,height});
      await page.locator('#theme').selectOption(theme);
      await page.screenshot({path:'artifacts/guide-'+theme+'-'+width+'x'+height+'.png',fullPage:true});
    });
  }
}
