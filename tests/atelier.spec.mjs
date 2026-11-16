import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

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

test("l’éditeur clair colore le Python et conserve la saisie, le défilement et le thème sombre", async ({ page }) => {
  await page.goto("./");
  const input = page.getByRole("textbox", { name: "Code Python" });
  const syntax = page.locator("#code-couleurs");
  const legend = page.getByRole("list", { name: "Couleurs du code Python" });
  await expect(legend).toBeVisible();
  const program = [
    "def saluer(prenom):",
    '    """Repère',
    '    sur deux lignes."""',
    "    for fois in range(3):",
    '        print(f"Bonjour, {prenom} !")  # commentaire',
    "    return True",
    'texte = "<b># chaîne</b>"',
    'inachevee = "encore'
  ].join("\n");
  await input.fill(program);
  await expect(syntax.locator(".py-keyword").first()).toHaveText("def");
  await expect(syntax.locator(".py-function").filter({ hasText: /^saluer$/ })).toBeVisible();
  await expect(syntax.locator(".py-value").filter({ hasText: /^3$/ })).toBeVisible();
  await expect(syntax.locator(".py-value").filter({ hasText: /^True$/ })).toBeVisible();
  await expect(syntax.locator(".py-string").filter({ hasText: /sur deux lignes/ })).toHaveCount(1);
  await expect(syntax.locator(".py-string").filter({ hasText: /<b># chaîne<\/b>/ })).toHaveCount(1);
  await expect(syntax.locator(".py-string").filter({ hasText: /inachevee/ })).toHaveCount(0);
  await expect(syntax.locator(".py-string").filter({ hasText: /"encore/ })).toHaveCount(1);
  await expect(syntax.locator(".py-string").filter({ hasText: /Bonjour/ })).toHaveCount(1);
  await expect(syntax.locator(".py-comment")).toHaveText("# commentaire");
  await expect(syntax.locator("b")).toHaveCount(0);
  expect(await syntax.textContent()).toBe(program);

  async function checkPalette() {
    const palette = await page.locator(".editor").evaluate(el => {
      const convert = color => (color.match(/\d+/g) ?? []).slice(0, 3).map(Number);
      return {
        background: convert(getComputedStyle(el).backgroundColor),
        colors: Array.from(el.querySelectorAll("#code-couleurs span"), token => convert(getComputedStyle(token).color))
      };
    });
    const luminance = channels => channels.reduce((sum, channel, index) => {
      const v = channel / 255;
      return sum + [0.2126, 0.7152, 0.0722][index] * (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    }, 0);
    const background = luminance(palette.background);
    for (const color of palette.colors) {
      const foreground = luminance(color);
      expect((Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05)).toBeGreaterThan(4.5);
    }
    expect(new Set(palette.colors.map(color => color.join(","))).size).toBeGreaterThanOrEqual(6);
    return background;
  }
  expect(await checkPalette()).toBeGreaterThan(0.9);
  await page.getByRole("button", { name: "Activer le mode sombre" }).click();
  expect(await checkPalette()).toBeLessThan(0.1);
  await expect(input).toHaveValue(program);

  await input.fill("if True:");
  await input.press("End");
  await input.press("Enter");
  await input.press("Tab");
  await expect(input).toHaveValue("if True:\n        ");
  const longProgram = Array.from({ length: 80 }, (_, i) => "valeur_" + i + " = " + "1".repeat(120)).join("\n") + "\n";
  await input.fill(longProgram);
  await input.evaluate(el => { el.scrollTop = 800; el.scrollLeft = 250; });
  await expect.poll(() => input.evaluate(el => {
    const paint = new DOMMatrix(getComputedStyle(document.querySelector(".editor-paint")).transform);
    const gutter = new DOMMatrix(getComputedStyle(document.querySelector("#gutter span")).transform);
    return el.scrollTop > 0 && el.scrollLeft > 0 && el.scrollTop === -paint.f && el.scrollTop === -gutter.f && el.scrollLeft === -paint.e;
  })).toBe(true);
  expect(await page.locator("#gutter span").textContent()).toMatch(/\n81$/);
  expect(await syntax.textContent()).toBe(longProgram);

  await input.fill("print(6 * 7)");
  await page.getByRole("button", { name: "Exécuter", exact: true }).click();
  await expect(page.getByLabel("Sortie Python")).toHaveText("42", { timeout: 30_000 });
  await page.reload();
  await expect(input).toHaveValue("print(6 * 7)");
  await expect(syntax.locator(".py-function")).toHaveText("print");
});

test("la zone de code reste lisible si le module de coloration est indisponible", async ({ page }) => {
  await page.route("**/coloration-python.mjs", route => route.abort());
  await page.goto("./");
  const input = page.getByRole("textbox", { name: "Code Python" });
  await input.fill("print(42)");
  await expect(input).toHaveValue("print(42)");
  await expect(input).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
  await expect(page.locator(".editor")).not.toHaveAttribute("data-coloration");
});

test("l’aide Albert présente les services officiels et revient au défi en cours", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#defi-004");
  await page.getByRole("button", { name: "Activer le mode sombre" }).click();
  const editor = page.getByRole("textbox", { name: "Code Python" });
  await editor.fill("print(4)");
  await page.getByRole("link", { name: "Aide Albert", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Découvrir l’IA Albert" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Créer une clé API" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  for (const [name, href] of [
    ["Ouvrir L’Assistant", "https://assistant.numerique.gouv.fr/"],
    ["Ouvrir Nuage", "https://nuage.apps.education.fr/"],
    ["Ouvrir la console Albert API", "https://albert.playground.etalab.gouv.fr/"],
    ["Quotas du compte", "https://guides.ia.numerique.gouv.fr/albert-api/compte-and-usage/quotas"]
  ]) {
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
  await expect(page.locator("input, textarea, form")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("link", { name: /Retour à l’atelier/ }).filter({ hasText: /Retour/ }).click();
  await expect(page).toHaveURL(/#defi-004$/);
  await expect(editor).toHaveValue("print(4)");

  await page.goto("./aide-albert.html?retour=https%3A%2F%2Fexample.com");
  await expect(page.locator("#help-return")).toHaveAttribute("href", "./");
});

test("le guide Thonny s’ouvre sur mobile et permet de reprendre et d’exporter le programme", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("./#defi-004");
  await page.getByRole("button", { name: "Activer le mode sombre" }).click();
  const editor = page.getByRole("textbox", { name: "Code Python" });
  const code = 'print("Bonjour, MicroAlbert !")';
  await editor.fill(code);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await page.getByRole("link", { name: "Guide Thonny", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Installer Thonny", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("link", { name: "Télécharger l’installateur Windows x64" }))
    .toHaveAttribute("href", /^https:\/\/github\.com\/thonny\/thonny\/releases\/download\/.+x64\.exe$/);
  await expect(page.getByRole("link", { name: "Télécharger Thonny portable (.zip)" }))
    .toHaveAttribute("href", /^https:\/\/github\.com\/thonny\/thonny\/releases\/download\/.+windows-portable-x64\.zip$/);
  await expect(page.getByRole("heading", { name: "Vérifier que Python fonctionne" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await page.getByRole("link", { name: "← Retour à l’atelier", exact: true }).click();
  await expect(page).toHaveURL(/#defi-004$/);
  await expect(editor).toHaveValue(code);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger le programme" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.py$/);
  expect(await readFile(await download.path(), "utf8")).toBe(code);
});
