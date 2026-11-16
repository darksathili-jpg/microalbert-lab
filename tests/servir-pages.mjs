import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = resolve("dist");
const prefix = "/microalbert-lab/";
const mime = {
  ".html": "text/html;charset=utf-8", ".mjs": "text/javascript;charset=utf-8",
  ".css": "text/css;charset=utf-8", ".json": "application/json", ".wasm": "application/wasm",
  ".png": "image/png", ".webp": "image/webp"
};

createServer(async (request, response) => {
  try {
    const path = new URL(request.url, "http://127.0.0.1").pathname;
    if (!path.startsWith(prefix)) throw new Error();
    const file = resolve(root, decodeURIComponent(path.slice(prefix.length)) || "index.html");
    if (!file.startsWith(root + sep)) throw new Error();
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(8780, "127.0.0.1");
