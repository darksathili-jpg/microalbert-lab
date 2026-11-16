import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tutor } from "./tuteur.mjs";

const host = "127.0.0.1";
const port = Number(process.env.MICROALBERT_PORT || 8765);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Port local invalide.");
const authority = host + ":" + port;
const origin = "http://" + authority;
const root = fileURLToPath(new URL("../site", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".py": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".zip": "application/zip",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".webp": "image/webp"
};
const credentials = {
  MICROALBERT_REAL_ACCESS_APPROVED: process.env.MICROALBERT_REAL_ACCESS_APPROVED,
  ALBERT_API_KEY: process.env.ALBERT_API_KEY,
  ALBERT_MODEL: process.env.ALBERT_MODEL
};
delete process.env.ALBERT_API_KEY;
delete process.env.ALBERT_MODEL;

function refuse(response, status) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(status === 404 ? "Page introuvable." : "Requête refusée.");
}

async function sendTutor(req, res, url) {
  const headers = new Headers(req.headers);
  const crossSite = headers.get("sec-fetch-site") === "cross-site";
  if (crossSite) {
    refuse(res, 403);
    return;
  }
  headers.set("oai-authenticated-user-id", "atelier-local");
  const request = new Request(url, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : Readable.toWeb(req),
    duplex: "half"
  });
  const answer = await tutor(request, credentials);
  res.writeHead(answer.status, Object.fromEntries(answer.headers));
  res.end(Buffer.from(await answer.arrayBuffer()));
}

async function sendFile(req, res, url) {
  if (!["GET", "HEAD"].includes(req.method)) {
    refuse(res, 405);
    return;
  }
  const name = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const path = resolve(root, "." + name);
  const contentType = types[extname(path)];
  if (!path.startsWith(root + sep) || !contentType) {
    refuse(res, 404);
    return;
  }
  const file = await stat(path).catch(() => null);
  if (!file?.isFile()) {
    refuse(res, 404);
    return;
  }
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": file.size,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-cache"
  });
  if (req.method === "HEAD") res.end();
  else {
    const stream = createReadStream(path);
    stream.on("error", () => res.destroy());
    res.on("close", () => stream.destroy());
    stream.pipe(res);
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.headers.host !== authority) {
      refuse(res, 403);
      return;
    }
    const url = new URL(req.url, origin);
    if (url.origin !== origin) {
      refuse(res, 403);
      return;
    }
    if (url.pathname === "/api/albert") await sendTutor(req, res, url);
    else await sendFile(req, res, url);
  } catch {
    if (res.headersSent) res.destroy();
    else refuse(res, 400);
  }
});

server.on("error", error => {
  if (error.code !== "EADDRINUSE") {
    console.error("Impossible de lancer le serveur local :", error.code || "erreur inconnue");
  } else {
    console.error("Le port " + port + " est déjà utilisé. Fermez toute autre fenêtre MicroAlbert et relancez.");
  }
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log("MicroAlbert est prêt :", origin);
  console.log(credentials.MICROALBERT_REAL_ACCESS_APPROVED === "yes" && credentials.ALBERT_API_KEY && credentials.ALBERT_MODEL ?
    "Connexion Albert configurée pour un essai local." : "Aide locale disponible. Albert est désactivé.");
  console.log("Laissez cette fenêtre ouverte pendant l’utilisation. Fermez-la pour arrêter l’atelier.");
  if (process.platform === "win32" && !process.argv.includes("--sans-navigateur")) {
    const browser = spawn("explorer.exe", [origin], {
      detached: true, stdio: "ignore", windowsHide: true
    });
    browser.on("error", () => console.log("Ouvrez l’adresse ci-dessus dans Edge ou Chrome."));
    browser.unref();
  }
});
