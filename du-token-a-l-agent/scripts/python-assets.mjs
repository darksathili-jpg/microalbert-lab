import { cp, mkdir } from 'node:fs/promises'
const target = new URL('../public/python/', import.meta.url)
await mkdir(target, { recursive: true })
for (const file of [
  'pyodide.mjs',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'pyodide-lock.json',
  'python_stdlib.zip',
]) {
  await cp(
    new URL('../node_modules/pyodide/' + file, import.meta.url),
    new URL(file, target),
  )
}
