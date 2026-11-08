import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('node_modules/pyodide');
const destination = resolve('public/pyodide');
const required = ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip'];

for (const filename of required) {
  if (!existsSync(resolve(source, filename))) {
    console.error('Ressource Pyodide manquante : ' + filename + '. Exécuter npm install dans frontend.');
    process.exit(1);
  }
}

mkdirSync(destination, { recursive: true });
// Copy the complete runtime distribution so pyodide.js can load its sidecar
// files without a CDN. This also avoids missing runtime dependencies.
for (const filename of readdirSync(source)) {
  if (filename.endsWith('.js') || filename.endsWith('.wasm') ||
      filename.endsWith('.zip') || filename.endsWith('.json') ||
      filename.endsWith('.data')) {
    cpSync(resolve(source, filename), resolve(destination, filename));
  }
}
console.log('Ressources Pyodide locales copiées dans public/pyodide');
