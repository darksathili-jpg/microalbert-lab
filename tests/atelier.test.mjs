import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import { defis, themes } from "../site/catalogue.mjs";
import { testCases } from "../site/essais.mjs";
import { tutor } from "../serveur/tuteur.mjs";

test("les 150 défis se répartissent sur des thèmes contigus et les tests référencent le catalogue", () => {
  assert.deepEqual(defis.map(defi => defi.id), Array.from({ length: 150 }, (_, i) => i + 1));
  let next = 1;
  themes.forEach(([, first, last], index) => {
    assert.equal(first, next);
    assert.ok(defis.slice(first - 1, last).every(defi => defi.theme === index && defi.titre && defi.consigne));
    next = last + 1;
  });
  assert.equal(next, 151);
  for (const [id, cases] of Object.entries(testCases)) {
    assert.equal(defis[Number(id) - 1].id, Number(id));
    assert.ok(cases.length && cases.every(item => Array.isArray(item.entrees) && typeof item.sortie === "string"));
  }
});

test("l’artefact Pages contient le moteur et les images, avec Albert local désactivé", async () => {
  const root = new URL("../dist/", import.meta.url);
  const entries = await readdir(root);
  assert.ok(entries.includes(".nojekyll"));
  for (const forbidden of ["serveur", ".env", "node.exe", "node_modules"]) assert.ok(!entries.includes(forbidden));
  assert.match(await readFile(new URL("hebergement.mjs", root), "utf8"), /albertLocal = false/);
  for (const name of ["index.html", "pyodide/pyodide.asm.wasm", "pyodide/python_stdlib.zip",
    "assets/laboratoire-microalbert.webp", "assets/microalbert-einstein-sprites.png"]) {
    assert.ok((await readFile(new URL(name, root))).length > 0);
  }
});

const address = "http://127.0.0.1:8765";
const fakeEnvironment = { ALBERT_API_KEY: "fictif", ALBERT_MODEL: "modele-test", MICROALBERT_REAL_ACCESS_APPROVED: "yes" };
const payload = { defi: 1, mode: "erreur", code: "print(prenom)", diagnostic: "NameError" };

function request({ origin = address, user = "recette", data = payload } = {}) {
  const headers = { origin, "content-type": "application/json" };
  if (user) headers["oai-authenticated-user-id"] = user;
  return new Request(address + "/api/albert", { method: "POST", headers, body: JSON.stringify(data) });
}

test("Albert reste fermé sans accord explicite et bloque les demandes hors origine", async () => {
  const unreachable = () => assert.fail("Le fournisseur ne doit pas être appelé");
  assert.equal((await tutor(request(), { ...fakeEnvironment, MICROALBERT_REAL_ACCESS_APPROVED: "" }, unreachable)).status, 503);
  assert.equal((await tutor(request({ origin: "https://example.org" }), fakeEnvironment, unreachable)).status, 403);
  assert.equal((await tutor(request({ user: "" }), fakeEnvironment, unreachable)).status, 403);
  assert.equal((await tutor(request({ data: { ...payload, code: "a".repeat(2201) } }), fakeEnvironment, unreachable)).status, 400);
});

test("le tuteur transmet le contexte utile et filtre une réponse de type corrigé", async () => {
  const mocked = async (url, init) => {
    assert.match(url, /^https:\/\/albert\.api\.etalab\.gouv\.fr\//);
    assert.equal(init.redirect, "error");
    const context = JSON.parse(JSON.parse(init.body).messages[1].content);
    assert.equal(context.defi, "Premier dialogue");
    assert.equal(context.diagnostic, "NameError");
    assert.equal(context.tentative, "print(prenom)");
    return Response.json({ choices: [{ message: { content: JSON.stringify({
      piste: "Cherche où le nom reçoit une valeur.",
      question: "Quelle instruction s’exécute avant l’affichage ?"
    }) } }] });
  };
  assert.equal((await tutor(request(), fakeEnvironment, mocked)).status, 200);
  const correction = async () => Response.json({ choices: [{ message: { content: JSON.stringify({
    piste: 'print("Voici le corrigé")', question: "Peux-tu le copier ?"
  }) } }] });
  assert.equal((await tutor(request(), fakeEnvironment, correction)).status, 502);
});
