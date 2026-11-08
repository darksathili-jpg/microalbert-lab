import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const source = resolve('node_modules/pyodide');
const destination = resolve('public/pyodide');
if (!existsSync(resolve(source, 'pyodide.js'))) {
 console.error('Pyodide absent : exécuter npm install dans frontend.');
 process.exit(1);
}
mkdirSync(destination, {recursive:true});
for (const filename of ['pyodide.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json']) {
 const from=resolve(source,filename);
 if(!existsSync(from)){console.error('Ressource Pyodide manquante : '+filename);process.exit(1);}
 cpSync(from,resolve(destination,filename));
}
console.log('Pyodide empaqueté localement dans public/pyodide');
