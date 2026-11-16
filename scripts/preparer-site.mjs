import { copyFile, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const site = resolve(root, "site");
const files = [
  "pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm",
  "pyodide-lock.json", "python_stdlib.zip"
];

const mode = process.argv[2];
if (mode !== "--local" && mode !== "--pages") throw new Error("Choisir --local ou --pages.");

const runtime = resolve(site, "pyodide");
await mkdir(runtime, { recursive: true });
const installed = resolve(root, "node_modules/pyodide");
await Promise.all(files.map(name => copyFile(resolve(installed, name), resolve(runtime, name))));
await copyFile(resolve(root, "licences/PYODIDE.txt"), resolve(runtime, "LICENSE.txt"));

if (mode === "--pages") {
  const dist = resolve(root, "dist");
  await rm(dist, { recursive: true, force: true });
  await cp(site, dist, { recursive: true });
  await writeFile(resolve(dist, "hebergement.mjs"), "export const albertLocal = false;\n");
  await writeFile(resolve(dist, ".nojekyll"), "");
}
