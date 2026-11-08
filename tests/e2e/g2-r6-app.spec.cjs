const { test, expect } = require('@playwright/test');

// Prérequis : frontend Vite actif sur http://127.0.0.1:5173.
// API simulée interceptée : aucun serveur Albert, aucune donnée personnelle.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/chat', async route => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        reply: 'Réponse locale simulée pour ' + body.mode,
        model_id: 'microalbert-mock',
        request_id: 'g2-r6-test-' + body.mode,
        finish_reason: 'stop', warnings: []
      })
    });
  });
  await page.goto('http://127.0.0.1:5173/');
});

test('G2-R6 : trois espaces distincts et aucun résultat avant interrogation', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Espace Élève' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Interroger le simulateur' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Enseignant' }).click();
  await expect(page.getByRole('heading', { name: 'Espace Enseignant' })).toBeVisible();
  await expect(page.getByText('Activité de référence')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Interroger le simulateur' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Audit' }).click();
  await expect(page.getByRole('heading', { name: 'Espace Audit' })).toBeVisible();
  await expect(page.getByText('Limites de la preuve')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Interroger le simulateur' })).toBeVisible();
  await expect(page.getByText('Activité de référence')).toHaveCount(0);
});

test('G4-P6-G : simulateur réservé à Audit et réponse masquée dans les autres espaces', async ({ page }) => {
  await page.getByRole('button', { name: 'Audit' }).click();
  await page.getByRole('button', { name: 'Interroger le simulateur' }).click();
  await expect(page.getByText('Réponse locale simulée pour audit')).toBeVisible();
  await expect(page.getByText(/Mode envoyé : audit/)).toBeVisible();
  await page.getByRole('button', { name: 'Élève' }).click();
  await expect(page.getByText('Réponse locale simulée pour audit')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Interroger le simulateur' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Enseignant' }).click();
  await expect(page.getByRole('button', { name: 'Interroger le simulateur' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Audit' }).click();
  await expect(page.getByText('Aucune interrogation effectuée dans cet espace.')).toBeVisible();
});

test('G2-R6 : trois thèmes et aucune surface sombre dans les panneaux projecteur', async ({ page }) => {
  const theme = page.getByLabel('Affichage :');
  for (const value of ['light', 'dark', 'projector']) {
    await theme.selectOption(value);
    await expect(page.locator('.app')).toHaveAttribute('data-theme', value);
  }
  await expect(page.locator('.logo .brand-icon')).toBeHidden();
  await page.getByRole('button', { name: 'Audit' }).click();
  for (const selector of ['.sheet', '.simulation-result', '.topbar']) {
    const bg = await page.locator(selector).first().evaluate(el => getComputedStyle(el).backgroundColor);
    // A white/transparent surface is required; no dark backgrounds.
    expect(['rgb(255, 255, 255)', 'rgba(0, 0, 0, 0)']).toContain(bg);
  }
});

test('G2-R6 : mobile sans débordement horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const label of ['Élève', 'Enseignant', 'Audit']) {
    await page.getByRole('button', { name: label }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, 'Débordement horizontal dans ' + label).toBe(false);
  }
});
