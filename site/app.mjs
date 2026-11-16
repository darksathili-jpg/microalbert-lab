import { defis, themes } from "./catalogue.mjs";
import { specialInputs, starters, testCases } from "./essais.mjs";
import { setTutorChallenge, setTutorExecution } from "./tuteur.mjs";

const $ = (id) => document.getElementById(id);
const code = $("code");
const stdin = $("stdin");
const status = $("status");
const consoleOut = $("console");
const canvas = $("drawing");
const draw = canvas.getContext("2d");
const engine = document.querySelector(".engine");
const key = "atelier-python-v1";
const free = {id:0, titre:"Console libre", consigne:"Écris et exécute ton propre programme. Pour les appels à `input()`, ajoute une valeur par ligne sous l’éditeur.", attention:"Appuie sur Ctrl + Entrée pour exécuter le programme.", theme:0};
const state = readState();
const openThemes = new Set();
let lastChallenge = 1;
let current;
let worker;
let ready = false;
let active;
let request = 0;
let drawing = [];
let activeTab = "console";
let outputLength = 0;
let pendingExample;

function readState() {
  try {
    return { drafts:{}, inputs:{}, done:{}, theme:"light", ...JSON.parse(localStorage.getItem(key) || "{}") };
  } catch {
    return { drafts:{}, inputs:{}, done:{}, theme:"light" };
  }
}

function save() {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* Le navigateur peut désactiver le stockage local. */ }
}

function fillMarkup(target, value) {
  target.replaceChildren();
  value.split("`").forEach((part, index) => {
    if (index % 2 === 0) target.append(part);
    else {
      const el = document.createElement("code");
      el.textContent = part;
      target.append(el);
    }
  });
}

function applyTheme() {
  const dark = state.theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("theme-toggle").textContent = dark ? "☀" : "☾";
  $("theme-toggle").setAttribute("aria-label", dark ? "Activer le mode clair" : "Activer le mode sombre");
}

function fold(value) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function pad(n) { return String(n).padStart(3, "0"); }

function renderNav() {
  const term = fold($("search").value.trim());
  const nav = $("nav");
  nav.replaceChildren();
  themes.forEach(([title, first, last], index) => {
    const matches = defis.slice(first - 1,last).filter(({id,titre,consigne}) => fold(pad(id)+" "+titre+" "+title+" "+consigne).includes(term));
    if (!matches.length) return;
    const group = document.createElement("details");
    group.open = Boolean(term) || openThemes.has(index) || current.theme === index;
    const summary = document.createElement("summary");
    const label = document.createElement("span");
    const count = document.createElement("span");
    label.textContent = title;
    count.className = "nav-count";
    count.textContent = first+"–"+last;
    summary.append(label,count);
    summary.addEventListener("click", () => {
      if (!term) {
        if (group.open) openThemes.delete(index);
        else openThemes.add(index);
      }
    });
    group.append(summary);
    for (const {id,titre} of matches) {
      const link = document.createElement("a");
      link.href = "#defi-"+pad(id);
      link.className = "nav-link";
      if (id === current.id) link.setAttribute("aria-current","page");
      const number = document.createElement("span");
      number.className = "nav-id";
      number.textContent = pad(id);
      link.append(number,titre);
      if (state.done[id]) {
        const tick = document.createElement("span");
        tick.className = "nav-done";
        tick.textContent = "✓";
        tick.setAttribute("aria-label","Terminé");
        link.append(tick);
      }
      link.addEventListener("click", () => {
        $("sidebar").dataset.open = "false";
        $("nav-toggle").setAttribute("aria-expanded","false");
      });
      group.append(link);
    }
    nav.append(group);
  });
  if (!nav.children.length) {
    const empty = document.createElement("p");
    empty.className = "nav-empty";
    empty.textContent = "Aucun défi trouvé.";
    nav.append(empty);
  }
}

function updateProgress() {
  const count = defis.filter(({id})=>state.done[id]).length;
  $("progress").value = count;
  $("progress-text").textContent = count+" / 150";
  $("complete").dataset.done = String(Boolean(state.done[current.id]));
  $("complete").textContent = state.done[current.id] ? "✓ Terminé · Annuler" : "✓ Marquer comme terminé";
}

function tab(name) {
  activeTab = name;
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.setAttribute("aria-pressed",String(button.dataset.tab === name));
    $("panel-"+button.dataset.tab).hidden = button.dataset.tab !== name;
  });
}

function engineStatus(name, message) {
  engine.dataset.state = name;
  $("engine-state").textContent = message;
}

function notice(message, type = "") {
  status.textContent = message;
  status.dataset.state = type;
}

function lines() {
  $("gutter").textContent = code.value.split("\n").map((_,i)=>i+1).join("\n");
  $("gutter").scrollTop = code.scrollTop;
}

function starter(id) {
  return starters[id] ?? (id === 0 ? '# Console libre\nprint("Bonjour !")\n' : "# Écris ton programme ici.\n");
}

function sample(id) {
  return specialInputs[id] ?? testCases[id]?.[0].entrees.join("\n") ?? "";
}

function updateFields() {
  const id = current.id;
  code.value = state.drafts[id] ?? starter(id);
  stdin.value = state.inputs[id] ?? sample(id);
  $("input-area").open = Boolean(stdin.value);
  lines();
}

function clearPreview() {
  $("preview-empty").hidden = false;
  $("interface").hidden = true;
  $("interface-image").hidden = true;
  $("interface-output").textContent = "";
  $("interface").style.background = "";
  canvas.hidden = true;
  drawing = [];
  draw.clearRect(0,0,canvas.width,canvas.height);
}

function clearResults() {
  setTutorExecution("");
  consoleOut.textContent = "La sortie du programme apparaîtra ici.";
  outputLength = 0;
  $("test-results").hidden = true;
  $("test-results").replaceChildren();
  clearPreview();
  tab("console");
}

function navigate(id) {
  location.hash = id === 0 ? "#console-libre" : "#defi-"+pad(id);
}

function route() {
  const hash = location.hash.slice(1);
  const match = /^defi-(\d{1,3})$/.exec(hash);
  const id = hash === "console-libre" ? 0 : Number(match?.[1] || 1);
  const selected = id === 0 ? free : defis[id - 1] ?? defis[0];
  if (current?.id === selected.id) return;
  if (active) stopWorker("Exécution arrêtée lors du changement de défi.");
  current = selected;
  setTutorChallenge(current);
  if (current.id) lastChallenge = current.id;
  const {titre, consigne, attention, theme} = current;
  const [label,,, goal,memo,example] = themes[theme];
  $("path-theme").textContent = current.id ? label : "Atelier de code";
  $("path-id").textContent = current.id ? "Défi "+pad(current.id) : "Console libre";
  $("hero-theme").textContent = current.id ? label.toUpperCase() : "ATELIER DE CODE";
  $("challenge-id").textContent = current.id ? "DÉFI "+pad(current.id) : "PYTHON";
  $("title").textContent = titre;
  $("goal").textContent = current.id ? goal : "Un espace pour expérimenter";
  $("file-label").textContent = current.id ? "defi_"+pad(current.id)+".py" : "console_libre.py";
  fillMarkup($("instruction"),consigne);
  fillMarkup($("hint-text"),attention);
  fillMarkup($("memo"),memo);
  $("example").textContent = example;
  $("graphic-guide").textContent = "";
  if (theme === 7) fillMarkup($("graphic-guide"),"Commandes disponibles : `forward`, `backward`, `left`, `right`, `goto`, `setheading`, `penup`, `pendown`, `color`, `fillcolor`, `begin_fill`, `end_fill`, `circle`.");
  if (theme === 15 || theme === 16 || current.id >= 149) fillMarkup($("graphic-guide"),"Interface web : `interface(champs, boutons, titre='…')`, `afficher(texte)`, `effacer(cle)`, `fond(couleur)`, `image(numero)`.");
  $("hint").open = false;
  $("reference").open = false;
  $("complete").hidden = current.id === 0;
  $("verify").hidden = !testCases[current.id];
  $("free-toggle").textContent = current.id ? "Console libre" : "Retour au défi";
  $("prev").disabled = current.id <= 1;
  $("next").disabled = current.id === 0 || current.id >= 150;
  $("file-preview").hidden = true;
  updateFields();
  clearResults();
  updateProgress();
  renderNav();
  notice("Prêt à exécuter");
  if (!current.id && pendingExample) runExample();
}

function setBusy(busy) {
  $("run").disabled = busy;
  $("verify").disabled = busy;
  $("reset").disabled = busy;
  $("stop").hidden = !busy;
  for (const item of document.querySelectorAll("#interface-buttons button, #files button")) item.disabled = busy;
}

function finish() {
  if (active) clearTimeout(active.timer);
  active = undefined;
  $("input-live").hidden = true;
  setBusy(false);
}

function stopWorker(message) {
  const hadFiles = $("files").children.length > 0;
  worker?.terminate();
  worker = undefined;
  ready = false;
  updateFiles([]);
  clearPreview();
  finish();
  engineStatus("", "Python dans le navigateur");
  notice(message + (hadFiles ? " Les fichiers temporaires ont été effacés." : ""), "bad");
}

function runtime() {
  if (!worker) {
    worker = new Worker(new URL("./python-worker.mjs",import.meta.url),{type:"module"});
    worker.onmessage = ({data}) => receive(data);
    worker.onerror = () => {
      stopWorker("Le moteur Python n’a pas pu démarrer. Vérifie ta connexion et réessaie.");
      engineStatus("error","Moteur indisponible");
    };
  }
  return worker;
}

function timeout(ms, message) {
  if (!active) return;
  clearTimeout(active.timer);
  active.timer = setTimeout(() => stopWorker(message), ms);
}

function dispatch(op, values = {}) {
  if (active) return;
  active = { id: ++request, op, code: values.code };
  setBusy(true);
  notice(ready ? "Exécution en cours…" : "Chargement de Python…");
  if (!ready) engineStatus("loading","Chargement de Python");
  timeout(ready ? 7000 : 45000,ready ? "Temps d’exécution dépassé. Le moteur a été arrêté." : "Le chargement de Python a dépassé 45 secondes. Réessaie.");
  try { runtime().postMessage({ op, request, ...values }); }
  catch {
    stopWorker("Le moteur Python est inaccessible depuis cette page.");
    engineStatus("error","Moteur indisponible");
  }
}

function startRun(verify = false) {
  if (active) return;
  clearResults();
  consoleOut.textContent = "";
  if (verify && testCases[current.id]) {
    dispatch("verify",{code:code.value, tests:testCases[current.id]});
  } else {
    let input = stdin.value.replace(/\r/g,"").split("\n");
    if (stdin.value === "") input = [];
    dispatch("run",{code:code.value,input});
  }
}

function appendConsole(value, error = false) {
  if (outputLength === 0) consoleOut.replaceChildren();
  outputLength += value.length;
  if (error) {
    const span = document.createElement("span");
    span.className = "error";
    span.textContent = value;
    consoleOut.append(span);
  } else consoleOut.append(value);
  consoleOut.scrollTop = consoleOut.scrollHeight;
}

function showTests(values) {
  const target = $("test-results");
  const successes = values.filter(item=>item.ok).length;
  target.hidden = false;
  consoleOut.textContent = successes + " / " + values.length + " tests réussis";
  for (const [index, test] of values.entries()) {
    const item = document.createElement("details");
    const title = document.createElement("summary");
    const body = document.createElement("pre");
    item.className = "test";
    item.dataset.ok = String(test.ok);
    title.textContent = "Test "+(index + 1)+(test.ok ? " · Réussi" : " · À corriger");
    body.textContent = "Saisies\n"+(test.entrees.join("\n") || "(aucune)")+"\n\nAttendu\n"+(test.attendu || "(aucune sortie)")+"\n\nObtenu\n"+(test.obtenu || "(aucune sortie)");
    item.append(title,body);
    target.append(item);
  }
  setTutorExecution(consoleOut.textContent, active.code);
  active.tested = true;
  active.passed = successes === values.length;
}

function updateFiles(items) {
  const list = $("files");
  list.replaceChildren();
  $("files-count").textContent = items.length ? " ("+items.length+")" : "";
  $("file-preview").hidden = true;
  for (const {name,size} of items) {
    const li = document.createElement("li");
    const label = document.createElement("span");
    const download = document.createElement("button");
    download.type = "button";
    download.className = "quiet small";
    download.textContent = "Télécharger";
    download.setAttribute("aria-label","Télécharger "+name);
    download.addEventListener("click",()=>dispatch("read",{name,download:true}));
    label.textContent = name + " · " + size + " o";
    li.append(label);
    if (/\.(txt|csv|json|py|log|md)$/i.test(name)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiet small";
      button.textContent = "Voir";
      button.setAttribute("aria-label","Voir "+name);
      button.addEventListener("click",()=>dispatch("read",{name,download:false}));
      li.append(button);
    }
    li.append(download);
    list.append(li);
  }
}

function download(name, content, type = "application/octet-stream") {
  const url = URL.createObjectURL(new Blob([content],{type}));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

const palette = { bleu:"#bcd2ff", vert:"#b9f1d2", rose:"#ffd5e5", jaune:"#fff0a4", rouge:"#f5a0ae", violet:"#e4c7ff" };
const images = [
  { name:"Montagne", art:"🏔️" },
  { name:"Soleil", art:"☀️" },
  { name:"Bateau", art:"⛵" }
];

function validColor(value) {
  return palette[value] ?? (CSS.supports("color", value) ? value : "#244ed1");
}

function paint() {
  const coords = drawing.flatMap(step=>step.type === "trait" ? [[step.x1,step.y1],[step.x2,step.y2]] : step.points);
  const xs = coords.map(([x])=>x);
  const ys = coords.map(([,y])=>y);
  const ex = Math.max(125,...xs.map(Math.abs));
  const ey = Math.max(96,...ys.map(Math.abs));
  const scale = Math.min((canvas.width-40)/(2*ex),(canvas.height-40)/(2*ey));
  const tx = x=>canvas.width/2+x*scale;
  const ty = y=>canvas.height/2-y*scale;
  draw.clearRect(0,0,canvas.width,canvas.height);
  for (const step of drawing.filter(item=>item.type==="polygone")) {
    draw.beginPath();
    for (const [x,y] of step.points) draw.lineTo(tx(x),ty(y));
    draw.closePath();
    draw.fillStyle = validColor(step.couleur);
    draw.fill();
  }
  draw.lineWidth = 2.4;
  draw.lineCap = "round";
  for (const step of drawing.filter(item=>item.type==="trait")) {
    draw.beginPath();
    draw.moveTo(tx(step.x1),ty(step.y1));
    draw.lineTo(tx(step.x2),ty(step.y2));
    draw.strokeStyle = validColor(step.couleur);
    draw.stroke();
  }
}

function showInterface(data) {
  $("interface").hidden = false;
  $("interface-title").textContent = data.titre;
  const fields = $("interface-fields");
  const buttons = $("interface-buttons");
  fields.replaceChildren();
  buttons.replaceChildren();
  for (const {cle,label,choix} of data.champs) {
    const wrapper = document.createElement("label");
    const field = document.createElement(choix ? "select" : "input");
    field.dataset.key = cle;
    if (!choix) field.autocomplete = "off";
    for (const option of choix ?? []) {
      const item = document.createElement("option");
      item.value = option;
      item.textContent = option;
      field.append(item);
    }
    wrapper.append(label,field);
    fields.append(wrapper);
  }
  for (const name of data.boutons) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary";
    button.textContent = name;
    button.disabled = Boolean(active);
    button.addEventListener("click",()=>{
      const values = Object.fromEntries([...fields.querySelectorAll("[data-key]")].map(el=>[el.dataset.key,el.value]));
      dispatch("action",{name,values});
    });
    buttons.append(button);
  }
}

function receive(data) {
  if (!active || data.request !== active.id) return;
  if (data.type === "ready") {
    ready = true;
    engineStatus("ready","Pyodide prêt");
    timeout(7000,"Temps d’exécution dépassé. Le moteur a été arrêté.");
    notice("Exécution en cours…");
  } else if (data.type === "input") {
    clearTimeout(active.timer);
    tab("console");
    $("input-prompt").textContent = data.prompt;
    $("input-answer").value = "";
    $("input-live").hidden = false;
    $("input-answer").focus();
    notice("Le programme attend une saisie.");
  } else if (data.type === "console") appendConsole(data.value,data.level === "error");
  else if (data.type === "tests") showTests(data.values);
  else if (data.type === "data") {
    if (data.download) download(data.name,data.bytes);
    else {
      $("file-preview").hidden = false;
      $("file-preview").textContent = new TextDecoder().decode(data.bytes);
    }
  } else if (data.type === "done") {
    if (active.op !== "read") updateFiles(data.files);
    if (drawing.length) paint();
    if (active.op === "run") {
      setTutorExecution("Exécution terminée", active.code);
      if (!outputLength) consoleOut.textContent = "Programme terminé sans sortie texte.";
    }
    if (active.tested) {
      if (active.passed && current.id) {
        state.done[current.id] = true;
        save();
        updateProgress();
        renderNav();
      }
      notice(active.passed ? "Défi validé" : "Certains tests restent à corriger", active.passed ? "good" : "bad");
    } else notice(active.op === "read" ? "Fichier disponible" : "Exécution terminée","good");
    finish();
  } else if (data.type === "failure") {
    if (!ready) {
      stopWorker("Impossible de charger Python. Réessaie avec une connexion active.");
      engineStatus("error","Moteur indisponible");
    } else {
      appendConsole((outputLength ? "\n" : "")+data.message+"\n",true);
      if (active.code !== undefined) {
        const type = /^([A-Za-z][A-Za-z0-9_]{0,40}(?:Error|Exception))(?=:|$)/m.exec(data.message)?.[1];
        const line = /line (\d{1,5})/.exec(data.message)?.[1];
        if (type) setTutorExecution(line && Number(line) > 0 ? "Ligne "+line+" · "+type : type, active.code);
      }
      if (drawing.length) paint();
      tab("console");
      notice("Exécution interrompue. Consulte la console.","bad");
      finish();
    }
  } else {
    if (["trait","polygone"].includes(data.type)) {
      drawing.push(data);
      canvas.hidden = false;
    } else if (data.type === "interface") showInterface(data);
    else if (data.type === "afficher") $("interface-output").textContent = data.texte;
    else if (data.type === "fond") $("interface").style.background = validColor(data.couleur);
    else if (data.type === "effacer") {
      if (data.cle === null) $("interface-output").textContent = "";
      else {
        const field = [...$("interface-fields").querySelectorAll("[data-key]")].find(element=>element.dataset.key===data.cle);
        if (field) field.value = "";
      }
    } else if (data.type === "image") {
      const element = $("interface-image");
      const image = images[data.numero - 1];
      element.setAttribute("role","img");
      element.setAttribute("aria-label",image.name);
      element.textContent = image.art;
      element.hidden = false;
    } else return;
    $("preview-empty").hidden = true;
    if (activeTab !== "aperçu") tab("aperçu");
  }
}

code.addEventListener("input",()=>{
  state.drafts[current.id] = code.value;
  save();
  lines();
});
code.addEventListener("scroll",()=>{ $("gutter").scrollTop = code.scrollTop; });
code.addEventListener("keydown",(event)=>{
  if (event.key === "Tab" && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    code.setRangeText("    ",code.selectionStart,code.selectionEnd,"end");
    code.dispatchEvent(new Event("input"));
  } else if (event.key === "Enter" && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    const line = code.value.slice(0,code.selectionStart).split("\n").at(-1);
    const indent = line.match(/^ */)[0] + (line.trimEnd().endsWith(":") ? "    " : "");
    if (indent) {
      event.preventDefault();
      code.setRangeText("\n"+indent,code.selectionStart,code.selectionEnd,"end");
      code.dispatchEvent(new Event("input"));
    }
  }
});
stdin.addEventListener("input",()=>{ state.inputs[current.id] = stdin.value; save(); });
$("input-live").addEventListener("submit",(event)=>{
  event.preventDefault();
  if (!active) return;
  worker.postMessage({op:"reply", request:active.id, value:$("input-answer").value});
  $("input-live").hidden = true;
  notice("Exécution en cours…");
  timeout(7000,"Temps d’exécution dépassé. Le moteur a été arrêté.");
});
$("run").addEventListener("click",()=>startRun());
$("verify").addEventListener("click",()=>startRun(true));
$("stop").addEventListener("click",()=>stopWorker("Exécution arrêtée."));
$("reset").addEventListener("click",()=>{
  delete state.drafts[current.id];
  delete state.inputs[current.id];
  save();
  updateFields();
  clearResults();
  notice("Code et saisies de départ restaurés.");
});
$("download-code").addEventListener("click",()=>download($("file-label").textContent,code.value,"text/x-python;charset=utf-8"));
$("complete").addEventListener("click",()=>{
  state.done[current.id] = !state.done[current.id];
  save();
  updateProgress();
  renderNav();
});
$("prev").addEventListener("click",()=>navigate(current.id - 1));
$("next").addEventListener("click",()=>navigate(current.id + 1));
$("search").addEventListener("input",renderNav);
$("free-toggle").addEventListener("click",()=>navigate(current.id ? 0 : lastChallenge));
function runExample() {
  const index = pendingExample;
  pendingExample = undefined;
  code.value = themes[index][5];
  stdin.value = index === 0 ? "15" : index === 5 ? "-1\n3" : "";
  $("input-area").open = Boolean(stdin.value);
  lines();
  startRun();
}

$("load-example").addEventListener("click",()=>{
  pendingExample = current.theme;
  if (current.id) navigate(0);
  else runExample();
});
$("theme-toggle").addEventListener("click",()=>{
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
  save();
});
$("nav-toggle").addEventListener("click",()=>{
  const open = $("sidebar").dataset.open !== "true";
  $("sidebar").dataset.open = String(open);
  $("nav-toggle").setAttribute("aria-expanded",String(open));
});
document.querySelectorAll("[data-tab]").forEach(button=>button.addEventListener("click",()=>tab(button.dataset.tab)));
document.addEventListener("keydown",(event)=>{
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    startRun();
  }
});
window.addEventListener("hashchange",route);
applyTheme();
route();
