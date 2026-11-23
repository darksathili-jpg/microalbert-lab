import { test, expect } from '@playwright/test'
import axe from 'axe-core'
import { labs } from '../src/data'
test('G1 découpage, vecteurs, correction et sauvegarde', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Aller au contenu' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await page.getByRole('link', { name: 'Commencer le parcours' }).click()
  await expect(
    page.getByRole('heading', { name: 'Du texte aux tokens' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Comparer/ }).click()
  await expect(
    page
      .getByRole('list', { name: 'Sortie du découpage' })
      .getByRole('listitem'),
  ).toHaveCount(2)
  await expect(page.getByText('ID 5 · pos. 1')).toBeVisible()
  await page
    .getByRole('slider', { name: 'Fenêtre de contexte miniature' })
    .focus()
  await page.keyboard.press('Home')
  await expect(page.getByText(/1 token\(s\) hors fenêtre/)).toBeVisible()
  await page
    .getByRole('slider', { name: 'x', exact: false })
    .filter({ visible: true })
    .last()
    .focus()
  await page.keyboard.press('End')
  await expect(page.getByText('E[1] = (2 ; 1)')).toBeVisible()
  await expect(
    page.getByRole('img', { name: /Plan des embeddings.*NSI: 2, 1/ }),
  ).toBeVisible()
  for (const answer of [
    'Les segments et leurs identifiants',
    'Certains tokeniseurs associent l’espace initial au fragment',
    'Il faut contextualiser les tokens et prédire les suivants',
    'La liste des positions associées aux tokens',
  ]) {
    await page.getByRole('radio', { name: answer }).check()
  }
  await page.getByRole('button', { name: 'Vérifier les réponses' }).click()
  await expect(page.getByText('4/4 · Séance validée')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Séance validée', { exact: true })).toBeVisible()
  await page.goto('/#progression')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter la progression' }).click()
  expect((await download).suggestedFilename()).toBe(
    'microalbert-progression.json',
  )
  await page
    .getByLabel('Importer une progression JSON')
    .setInputFiles({
      name: 'progression.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version":1,"completed":[1,2],"last":2}'),
    })
  await expect(page.getByText('2 séance(s) validée(s) sur 8.')).toBeVisible()
  expect(errors).toEqual([])
})
for (const [name, width, height, mode] of [
  ['ordinateur', 1440, 950, 'sombre'],
  ['tablette', 820, 1180, 'clair'],
  ['telephone', 390, 844, 'vidéoprojecteur'],
] as const) {
  test('G1 captures, clavier et accessibilité · ' + name, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.getByLabel('Mode d’affichage').selectOption(mode)
    await expect(page.locator('html')).toHaveAttribute('data-mode', mode)
    await page.screenshot({
      path: `verification/accueil-${name}.png`,
      fullPage: true,
    })
    await page.keyboard.press('Control+k')
    await expect(page.getByRole('searchbox')).toBeFocused()
    await page.getByRole('searchbox').fill('tokens')
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('heading', { name: 'Du texte aux tokens' }),
    ).toBeVisible()
    await page.addScriptTag({ content: axe.source })
    const audit = await page.evaluate(
      async () =>
        await (window as unknown as { axe: typeof axe }).axe.run({
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        }),
    )
    expect(
      audit.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]),
    ).toEqual([])
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width)
    await page.screenshot({
      path: `verification/l01-${name}.png`,
      fullPage: true,
    })
  })
}
test('G3 navigation, calculs et scénarios L02 à L07', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  for (let id = 1; id <= 8; id++) {
    await expect(page.getByRole('heading', { name: /Bienvenue/ })).toBeVisible()
    await page
      .locator('.lab-map')
      .first()
      .locator('a')
      .nth(id - 1)
      .click()
    await expect(
      page.getByRole('heading', { name: labs[id - 1][0], exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Évaluation et transfert' }),
    ).toBeVisible()
    await page.goto('/#accueil')
  }
  await page.goto('/#laboratoire-2')
  await expect(
    page.getByRole('cell', { name: '0,7071', exact: true }),
  ).toHaveCount(2)
  const masked = page.getByRole('row', { name: /^NSI 1 0 × 0 ×/ })
  await expect(masked).toBeVisible()
  await page.getByLabel('Appliquer le masque causal').uncheck()
  await expect(masked).toHaveCount(0)
  await page.getByLabel('Q lycée composante 1').fill('2')
  await expect(
    page.getByRole('cell', { name: '2,1213', exact: true }),
  ).toBeVisible()
  await page.goto('/#laboratoire-3')
  await page.getByLabel('Utiliser l’exemple B de référence').check()
  await expect(
    page.getByRole('cell', { name: '0,643914', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Ajouter un token' }).click()
  await expect(page.getByText('Fenêtre affichée : Numérique')).toBeVisible()
  await page.goto('/#laboratoire-4')
  await page.getByRole('button', { name: 'Une itération' }).click()
  await expect(
    page.getByRole('cell', { name: '-1,559601', exact: true }),
  ).toBeVisible()
  await page.goto('/#laboratoire-5')
  await expect(page.getByText(/2,343407088/)).toHaveCount(2)
  await page.getByLabel('Style demandé').selectOption('tuteur')
  await expect(page.getByText(/Que désignent les lettres/)).toBeVisible()
  await page.getByRole('button', { name: 'Avancer l’appel' }).click()
  await expect(page.getByText(/vérifie le schéma/)).toBeVisible()
  await page.goto('/#laboratoire-6')
  await page.getByLabel('Requête documentaire').fill('range')
  await page.getByRole('button', { name: 'Rechercher dans le corpus' }).click()
  await expect(
    page.getByRole('heading', { name: 'Passage ajouté au contexte' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Contrôle du flux en Python/ }),
  ).toBeVisible()
  for (const axis of ['x', 'y']) {
    await page
      .getByRole('slider', { name: 'Vecteur question · ' + axis })
      .focus()
    await page.keyboard.press('Home')
    for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowRight')
  }
  await expect(
    page.getByRole('cell', { name: 'Non défini', exact: true }),
  ).toHaveCount(3)
  await page.goto('/#laboratoire-7')
  await page.getByLabel('Outil proposé').selectOption('publier')
  for (let n = 0; n < 3; n++)
    await page.getByRole('button', { name: 'Avancer la machine' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'actions restantes' }),
  ).toContainText('BLOQUE')
  await expect(page.getByText('Refus de l’orchestrateur.')).toBeVisible()
  expect(errors).toEqual([])
})
test('G4 Pyodide local, autorisation, oracle, exception, sortie longue et récupération', async ({
  page,
}) => {
  const remote: string[] = []
  const errors: string[] = []
  page.on('request', (r) => {
    if (
      !r.url().startsWith('http://127.0.0.1:4173/') &&
      !r.url().startsWith('blob:')
    )
      remote.push(r.url())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/#laboratoire-8')
  const execute = page.getByRole('button', { name: 'Exécuter', exact: true }),
    out = page.getByLabel('Sortie Python')
  await execute.click()
  await expect(page.getByText(/Autorisation d’exécution requise/)).toBeVisible()
  await page
    .getByLabel('Autoriser l’exécution de ce code dans mon navigateur')
    .check()
  await execute.click()
  await expect(out).toHaveText('4', { timeout: 24000 })
  await expect(page.getByText(/quelle valeur de somme est lue/)).toBeVisible()
  await page.getByLabel('Éditeur Python').fill('raise ValueError("test")')
  await execute.click()
  await expect(out).toContainText('ValueError: test', { timeout: 24000 })
  await page.getByLabel('Éditeur Python').fill('print("a" * 8000)')
  await execute.click()
  await expect(out).toContainText('[sortie tronquée]', { timeout: 24000 })
  await page.getByLabel('Éditeur Python').fill('while True:\n    pass')
  await execute.click()
  await expect(out).toContainText('Délai maximal dépassé', { timeout: 24000 })
  await page
    .getByLabel('Éditeur Python')
    .fill('somme = 0\nfor i in range(5):\n    somme += i\nprint(somme)')
  await execute.click()
  await expect(out).toHaveText('10', { timeout: 24000 })
  await page
    .getByLabel('Expliquez votre correction')
    .fill('J’accumule le total en ajoutant i à la valeur précédente.')
  await page.getByRole('button', { name: 'Vérifier la compréhension' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Essais' }),
  ).toContainText('TERMINE')
  expect(remote).toEqual([])
  expect(errors).toEqual([])
})
test('G3–G4 affichage mobile et captures des laboratoires', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (let id = 2; id <= 8; id++) {
    await page.goto('/#laboratoire-' + id)
    await expect(
      page.getByRole('heading', { name: labs[id - 1][0], exact: true }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390)
    const clipped = await page
      .locator('main')
      .evaluate((main) => main.scrollWidth > main.clientWidth)
    expect(clipped, 'Débordement L0' + id).toBe(false)
    await page.screenshot({
      path: `verification/l0${id}-telephone.png`,
      fullPage: true,
    })
  }
})
test('G4 vérifie les oracles des six scénarios', async ({ page }) => {
  test.setTimeout(90000)
  await page.goto('/#laboratoire-8')
  const examples = [
    ['Somme incorrecte', 'print(sum(range(5)))', '10', '4'],
    [
      'Liste vide',
      'notes = []\nprint(notes[0] if notes else "vide")',
      'vide',
      'IndexError',
    ],
    ['Maximum de nombres négatifs', 'print(max([-8, -3, -6]))', '-3', '0'],
    [
      'Borne exclue de range',
      'for n in range(1, 6):\n    print(n)',
      '1\n2\n3\n4\n5',
      '1\n2\n3\n4',
    ],
    [
      'Récursivité sans cas de base',
      'def f(n):\n    return 1 if n == 0 else n * f(n-1)\nprint(f(3))',
      '6',
      'RecursionError',
    ],
    [
      'Pile ou file vide',
      'pile = []\nprint(pile.pop() if pile else "vide")',
      'vide',
      'IndexError',
    ],
  ]
  for (const [label, code, expected, initial] of examples) {
    await page
      .getByRole('combobox', { name: 'Scénario', exact: true })
      .selectOption({ label })
    await page
      .getByLabel('Autoriser l’exécution de ce code dans mon navigateur')
      .check()
    await page.getByRole('button', { name: 'Exécuter', exact: true }).click()
    await expect(page.getByLabel('Sortie Python')).toContainText(initial, {
      timeout: 24000,
    })
    await expect(page.getByLabel('Expliquez votre correction')).toHaveCount(0)
    await page.getByLabel('Éditeur Python').fill(code)
    await page.getByRole('button', { name: 'Exécuter', exact: true }).click()
    await expect(page.getByLabel('Sortie Python')).toHaveText(expected, {
      timeout: 24000,
    })
    await expect(page.getByLabel('Expliquez votre correction')).toBeVisible()
    await page.getByLabel('Éditeur Python').fill(code + '\n# modification')
    await expect(page.getByLabel('Expliquez votre correction')).toHaveCount(0)
  }
})
test('Audit des huit laboratoires dans les trois modes d’affichage', async ({
  page,
}) => {
  test.setTimeout(90000)
  for (const [name, width, height, mode] of [
    ['ordinateur', 1440, 950, 'sombre'],
    ['tablette', 820, 1180, 'clair'],
    ['projection-mobile', 390, 844, 'vidéoprojecteur'],
  ] as const) {
    await page.setViewportSize({ width, height })
    for (let id = 1; id <= 8; id++) {
      await page.goto('/?audit=' + id + '#laboratoire-' + id)
      await page.getByLabel('Mode d’affichage').selectOption(mode)
      await expect(page.locator('html')).toHaveAttribute('data-mode', mode)
      await expect(
        page.getByRole('heading', { name: labs[id - 1][0], exact: true }),
      ).toBeVisible()
      const overflow = await page
        .locator('main')
        .evaluate((main) => main.scrollWidth > main.clientWidth)
      expect(overflow, `Débordement l0${id} ${mode}`).toBe(false)
      await page.addScriptTag({ content: axe.source })
      const violations = await page.evaluate(
        async () =>
          await (window as unknown as { axe: typeof axe }).axe.run({
            runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'],
          }),
      )
      expect(
        violations.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]),
        `l0${id} ${mode}`,
      ).toEqual([])
      if (id !== 1)
        await page.screenshot({
          path: `verification/l0${id}-${name}.png`,
          fullPage: true,
        })
    }
  }
})
