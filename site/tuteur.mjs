import { albertLocal } from "./hebergement.mjs";

const endpoint = new URL("./api/albert", import.meta.url);
const $ = id => document.getElementById(id);
const panel = $("tutor-panel");
const form = $("tutor-form");
const confirmation = $("tutor-review");
const message = $("tutor-status");
const excerpt = $("tutor-code");
const diagnosticField = $("tutor-diagnostic");
const result = $("tutor-result");

const localQuestions = {
  indice: "Avec un exemple simple, quelles données reçois-tu et quel résultat veux-tu obtenir ?",
  erreur: "Quelle est la première valeur ou instruction que tu peux vérifier pour isoler cette erreur ?",
  test: "Quel exemple court, avec un résultat que tu peux calculer à la main, permettrait de vérifier ton programme ?"
};
const errors = {
  SyntaxError: "Repère les guillemets, les parenthèses et les deux-points autour de la ligne signalée.",
  IndentationError: "Compare les retraits des instructions appartenant au même bloc.",
  NameError: "Vérifie le nom signalé et l’instruction qui lui affecte une valeur.",
  TypeError: "Vérifie le type des valeurs utilisées dans l’instruction signalée.",
  ValueError: "Vérifie si la valeur fournie convient à l’opération demandée.",
  IndexError: "Compare l’indice utilisé à la longueur de la séquence.",
  ZeroDivisionError: "Cherche à quel moment le diviseur prend la valeur zéro."
};
let challenge;
let execution;
let available = false;
let checking = albertLocal;
let request;

function setStatus(text) {
  message.textContent = text;
}

export function setTutorChallenge(defi) {
  request?.abort();
  request = undefined;
  challenge = defi;
  execution = undefined;
  panel.hidden = !defi?.id;
  confirmation.hidden = true;
  result.hidden = true;
  $("tutor-confirm").disabled = false;
  $("tutor-prepare").disabled = checking;
  if (!checking) setConnectionStatus();
  form.reset();
}

export function setTutorExecution(diagnostic, code) {
  execution = diagnostic ? { diagnostic, code } : undefined;
  confirmation.hidden = true;
}

function currentDiagnostic() {
  return execution?.code === $("code").value ? execution.diagnostic : "";
}

function showAnswer(source, piste, question) {
  $("tutor-source").textContent = source;
  $("tutor-hint").textContent = piste;
  $("tutor-question").textContent = question;
  result.hidden = false;
}

function showLocal(mode) {
  const diagnostic = currentDiagnostic();
  const type = diagnostic.split(" · ").at(-1);
  const hint = mode === "erreur" && Object.hasOwn(errors, type) ? errors[type] :
    mode === "erreur" && !diagnostic ? "Exécute ta tentative pour obtenir un diagnostic Python." :
    challenge.attention.replaceAll("`", "");
  confirmation.hidden = true;
  showAnswer("Aide locale de l’atelier", hint, localQuestions[mode]);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!challenge?.id || request) return;
  const mode = $("tutor-mode").value;
  if (!albertLocal || !available) {
    showLocal(mode);
    return;
  }
  result.hidden = true;
  const code = $("code").value;
  excerpt.value = code.slice(0, excerpt.maxLength);
  $("tutor-code-size").textContent = code.length > excerpt.maxLength ?
    "Les 2 200 premiers caractères sont présélectionnés. Tu peux remplacer cet extrait." : "";
  diagnosticField.checked = false;
  diagnosticField.disabled = !currentDiagnostic();
  $("tutor-diagnostic-text").textContent = currentDiagnostic() || "aucun diagnostic pour cette version du code";
  confirmation.hidden = false;
  excerpt.focus();
});

$("tutor-cancel").addEventListener("click", () => {
  confirmation.hidden = true;
  $("tutor-prepare").focus();
});
$("tutor-local").addEventListener("click", () => showLocal($("tutor-mode").value));
$("tutor-confirm").addEventListener("click", async () => {
  if (!albertLocal || !challenge?.id || request || !available || confirmation.hidden) return;
  const controller = new AbortController();
  request = controller;
  const mode = $("tutor-mode").value;
  const payload = {
    defi: challenge.id,
    mode,
    code: excerpt.value.slice(0, excerpt.maxLength),
    diagnostic: diagnosticField.checked ? currentDiagnostic() : ""
  };
  confirmation.hidden = true;
  result.hidden = true;
  $("tutor-confirm").disabled = true;
  $("tutor-prepare").disabled = true;
  setStatus("Albert prépare une piste…");
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const body = await response.json();
    if (request !== controller) return;
    if (response.ok && body.piste && body.question) {
      showAnswer("Réponse d’Albert", body.piste, body.question);
      setStatus("Réponse reçue.");
    } else {
      setStatus(response.status === 429 ? "Limite de demandes atteinte. Voici une aide locale." : "Albert est indisponible. Voici une aide locale.");
      showLocal(mode);
    }
  } catch {
    if (request !== controller) return;
    setStatus("Albert est indisponible. Voici une aide locale.");
    showLocal(mode);
  } finally {
    if (request === controller) {
      request = undefined;
      $("tutor-prepare").disabled = false;
      $("tutor-confirm").disabled = false;
    }
  }
});

function setConnectionStatus() {
  const offline = albertLocal ? "Aide locale disponible. Albert s’active sur le serveur local après vérification du compte." :
    "Aide locale de l’atelier. Ton programme reste dans ce navigateur.";
  setStatus(available ? "Albert est activé. Vérifie le contenu avant de l’envoyer." : offline);
}

async function checkConnection() {
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3500)
    });
    available = response.ok && (await response.json()).disponible === true;
  } catch {
    available = false;
  }
  checking = false;
  if (available) $("tutor-title").firstChild.textContent = "Aide avec Albert ";
  $("tutor-prepare").textContent = available ? "Préparer la demande" : "Afficher l’aide locale";
  $("tutor-local").hidden = !available;
  $("tutor-prepare").disabled = false;
  setConnectionStatus();
}

if (albertLocal) {
  checkConnection();
} else {
  $("tutor-prepare").textContent = "Afficher l’aide locale";
  $("tutor-prepare").disabled = false;
  setConnectionStatus();
}
