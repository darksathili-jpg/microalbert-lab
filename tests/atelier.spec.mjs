import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    expect(url.origin).toBe("http://127.0.0.1:8780");
    expect(url.pathname).toMatch(/^\/microalbert-lab\//);
    expect(url.pathname).not.toContain("/api/");
    await route.continue();
  });
});

test("ouvre le catalogue, exécute et vérifie un programme Python", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Premier dialogue" })).toBeVisible();
  await expect(page.locator("#nav a")).toHaveCount(150);
  await expect(page.locator("#albert-controls")).toBeVisible();
  await page.getByRole("button", { name: "Aller à droite" }).click();
  await expect(page.locator("#albert-position")).toContainText("vers la droite");
  await page.getByRole("textbox", { name: "Code Python" }).fill('prenom = input()\nprint(f"Bonjour, {prenom} !")');
  await page.getByRole("button", { name: "Exécuter", exact: true }).click();
  await expect(page.getByLabel("Sortie Python")).toContainText("Bonjour, Lina !", { timeout: 30_000 });
  await page.getByRole("button", { name: "Vérifier", exact: true }).click();
  await expect(page.getByLabel("Sortie Python")).toContainText("2 / 2 tests réussis");
  await expect(page.locator("#progress-text")).toHaveText("1 / 150");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Code Python" })).toHaveValue(/prenom = input/);
  await expect(page.locator("#progress-text")).toHaveText("1 / 150");
  await page.getByText("Aide pour ce défi").click();
  await page.getByLabel("De quoi as-tu besoin ?").selectOption("test");
  await page.getByRole("button", { name: "Afficher l’aide locale" }).click();
  await expect(page.locator("#tutor-source")).toHaveText("Aide locale de l’atelier");
  await expect(page.locator("#tutor-question")).toContainText("Quel exemple court");
});

test("ouvre et exécute SQLite avec les seules ressources servies par Pages", async ({ page }) => {
  await page.goto("./#defi-139");
  await expect(page.locator("#challenge-id")).toHaveText("DÉFI 139");
  await page.getByRole("textbox", { name: "Code Python" })
    .fill('import sqlite3\nwith sqlite3.connect(":memory:") as base:\n    print(base.execute("SELECT 42").fetchone()[0])');
  await page.getByRole("button", { name: "Exécuter", exact: true }).click();
  await expect(page.getByLabel("Sortie Python")).toHaveText("42", { timeout: 30_000 });
});

test("recherche et ouvre un défi sur mobile, puis bascule en thème sombre", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.getByRole("button", { name: "Parcours", exact: true }).click();
  await page.getByRole("searchbox", { name: "Rechercher un défi" }).fill("Addition à deux nombres");
  await page.getByRole("link", { name: /Addition à deux nombres/ }).click();
  await expect(page.getByRole("heading", { name: "Addition à deux nombres" })).toBeVisible();
  await page.getByRole("button", { name: "Activer le mode sombre" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
