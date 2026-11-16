const distribution = new URL("./pyodide/", import.meta.url).href;
const home = "/home/atelier";
let active;
let sent = 0;
let graphics = 0;
let reply;
const decoder = new TextDecoder();

function emit(message, transfer = []) {
  postMessage({ request: active, ...message }, transfer);
}

function write(bytes, level) {
  if (sent < 24000) {
    const value = decoder.decode(bytes);
    sent += value.length;
    emit({ type: "console", value, level });
    if (sent >= 24000) emit({ type: "console", value: "\nSortie limitée à 24 000 caractères.\n" });
  }
  return bytes.length;
}

globalThis.atelier_ask = (prompt) => new Promise((resolve) => {
  reply = resolve;
  emit({ type: "input", prompt });
});

globalThis.atelier_event = (raw) => {
  if (graphics++ < 2400) emit(JSON.parse(raw));
};

const ready = (async () => {
  const { loadPyodide } = await import(distribution + "pyodide.mjs");
  const runtime = await loadPyodide({ indexURL: distribution });
  runtime.setStdout({ write: (bytes) => write(bytes, "normal") });
  runtime.setStderr({ write: (bytes) => write(bytes, "error") });
  runtime.setStdin({ error: true });
  const file = await fetch(new URL("./runtime.py", import.meta.url));
  if (!file.ok) throw new Error("Le module pédagogique n’a pas pu être chargé.");
  const module = runtime.toPy({ __name__: "__atelier__" });
  runtime.runPython(await file.text(), { globals: module, filename: "atelier.py" });
  return { runtime, module };
})();

async function call(runtime, module, name, args, promising = false) {
  const fn = module.get(name);
  const values = args.map((arg) => typeof arg === "object" ? runtime.toPy(arg) : arg);
  try {
    return promising ? await fn.callPromising(...values) : fn(...values);
  } finally {
    fn.destroy();
    values.forEach((value) => value?.destroy?.());
  }
}

self.onmessage = async ({ data }) => {
  if (data.op === "reply") {
    if (active === data.request && reply) {
      const resolve = reply;
      reply = undefined;
      resolve(data.value);
    }
    return;
  }
  active = data.request;
  try {
    const { runtime, module } = await ready;
    emit({ type: "ready" });
    sent = 0;
    graphics = 0;
    const fs = runtime.FS;
    const interactif = typeof WebAssembly.Suspending === "function" && typeof WebAssembly.promising === "function";
    if (data.op === "run") await call(runtime, module, "executer", [data.code, data.input, interactif], interactif);
    if (data.op === "verify") emit({ type: "tests", values: JSON.parse(await call(runtime, module, "verifier", [data.code, data.tests])) });
    if (data.op === "action") await call(runtime, module, "cliquer", [data.name, data.values], interactif);
    if (data.op === "read") {
      const path = home + "/" + data.name;
      if (!fs.isFile(fs.lstat(path).mode)) throw new Error("Ce fichier ne peut pas être ouvert.");
      const bytes = fs.readFile(path);
      if (bytes.length > 4 * 1024 * 1024) throw new Error("Ce fichier dépasse 4 Mio.");
      emit({ type: "data", name: data.name, bytes, download: data.download }, [bytes.buffer]);
    }
    const files = fs.readdir(home).filter((name) => !name.startsWith(".")).flatMap((name) => {
      const stat = fs.lstat(home + "/" + name);
      return fs.isFile(stat.mode) ? [{ name, size: stat.size }] : [];
    }).sort((a, b) => a.name.localeCompare(b.name));
    emit({ type: "done", files });
  } catch (error) {
    const message = String(error.message || error);
    const trace = message.split("\n");
    const visible = trace.filter((line) => line.includes('<ton programme>'));
    emit({ type: "failure", message: [visible.at(-1)?.trim(), trace.map(line=>line.trim()).filter(Boolean).at(-1)].filter(Boolean).join("\n") });
  }
};
