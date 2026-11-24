import { embeddings, vocabulaire, tests, corpus } from './donnees.mjs';
import { appliquer, clone, differences, epsilon, eta, etape, importer, initialiser, mesurer, noms, propager } from './moteur.mjs';
import { etapes, livret } from './exercices.mjs';

const $ = id => document.getElementById(id);
const fmt = x => x.toLocaleString('fr-FR', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
const precision = x => x.toLocaleString('fr-FR', { minimumFractionDigits: 9, maximumFractionDigits: 9 });
const vec = x => '[' + x.map(fmt).join(' ; ') + ']';
const capitaliser = x => x[0]?.toUpperCase() + x.slice(1);
const escape = x => String(x).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const table = (heads, rows, extra = '') => '<div class="table-scroll ' + extra + '"><table><thead><tr>' +
  heads.map(x => '<th scope="col">' + x + '</th>').join('') + '</tr></thead><tbody>' +
  rows.map(row => '<tr>' + row.map(x => '<td>' + x + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const charger = (id, fallback) => {
  try { return JSON.parse(localStorage.getItem('attention-lab:' + id)) ?? fallback; } catch { return fallback; }
};
const sauver = (id, data) => {
  try { localStorage.setItem('attention-lab:' + id, JSON.stringify(data)); } catch { /* Stockage facultatif. */ }
};
const feedback = message => { $('status').textContent = message; };
const fiche = (titre, contenu) => '<h3>' + titre + '</h3>' + contenu;
const para = x => '<p>' + x + '</p>';
const chips = tokens => tokens.map(x => '<span class="chip">' + escape(x) + '</span>').join('');
const debut = () => initialiser();

let theme = charger('theme', 'nuit');
const ancienLivret = Object.fromEntries(Object.entries(charger('reponses', {})).filter(([id]) => /^livret\d+$/.test(id)));
let reponses = charger('reponses-v2', ancienLivret);
let mode = 'guide';
let numero = 0;
let origine = 'reference';
let graine = 12;
let W = debut();
let libre = clone(W);
let libreMeta = { origine, graine };
let historique = [mesurer(W).moyenne];
let exemple = 'nsi';
let phraseLibre = tests[0][0];
let actif = false;
let file = 0;
let minuterie;
let iteration = 0;
let cellule = 0;
let cacheDifferences;
let filtreQuiz = livret.map((_, i) => i);
for (let i = filtreQuiz.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [filtreQuiz[i], filtreQuiz[j]] = [filtreQuiz[j], filtreQuiz[i]];
}

function poids() { return mode === 'free' ? libre : W; }
function entree() {
  if (exemple === 'web') return tests[1];
  if (exemple === 'papier') return corpus[0];
  if (exemple === 'libre') return [phraseLibre, undefined];
  return tests[0];
}
function phraseAffichee() {
  if (exemple === 'nsi') return 'En NSI, tu vas programmer en';
  if (exemple === 'web') return 'En web, tu vas programmer en';
  return capitaliser(entree()[0]);
}
function analyser() {
  const [phrase, cible] = entree();
  return propager(poids(), phrase, cible, $('ablation').checked);
}
function visible(step) { return mode !== 'guide' || etapes.slice(0, step+1).every((_, i) => Object.hasOwn(reponses, 'etape'+i)) || $('prof').checked; }
function accessible(step) { return step === 0 || visible(step-1); }
function poser(pose) { $('mascotte').dataset.pose = pose; }
const invitations = [
  'Repère les unités que le modèle reçoit.', 'Retrouve la représentation du dernier mot.',
  'Observe les coefficients conservés d’une phrase à l’autre.', 'Suis une ligne et une colonne.',
  'Repère les vecteurs qui interviennent dans la comparaison.', 'Observe comment les scores deviennent des poids.',
  'Suis le trajet des valeurs.', 'Compare les deux chemins qui se rejoignent.',
  'Repère les scores qui servent à choisir un mot.', 'Compare les probabilités avant de conclure.'
];
function argmax(p) { return p[0] >= p[1] ? 0 : 1; }
function prediction(p) { return p[0] === p[1] ? 'Égalité' : vocabulaire[argmax(p)]; }
function reglageTheme() {
  $('theme').value = theme;
  document.documentElement.dataset.theme = theme;
}
function matrices() {
  return '<div class="matrix-grid">' + poids().map((matrix, m) => '<div class="matrix"><strong>W<sub>' + noms[m] + '</sub></strong><table aria-label="Matrice W' + noms[m] + '">' +
    matrix.map((row, i) => '<tr>' + row.map((value, j) => '<td>' + (mode === 'free'
      ? '<input type="number" step="any" min="-1000000" max="1000000" data-cell="' + [m,i,j].join(',') + '" aria-label="W' + noms[m] + ' ligne ' + (i+1) + ' colonne ' + (j+1) + '" value="' + value + '">'
      : fmt(value)) + '</td>').join('') + '</tr>').join('') + '</table></div>').join('') + '</div>';
}

function petiteVue(d, refaireMatrices) {
  const tokens = d.tokens.map((x, i) => i ? x : capitaliser(x));
  $('hero-tokens').innerHTML = visible(0) ? chips(tokens) : escape(phraseAffichee()) + '…';
  $('hero-output').textContent = visible(9) ? prediction(d.p) : '?';
  $('guide-title').textContent = numero === 0 ? 'Bienvenue dans le labo !' : 'Indice de MicroAlbert';
  $('guide-text').textContent = invitations[numero];
  $('guide-phrase').textContent = '« ' + phraseAffichee() + ' … ? »';
  $('tokens').innerHTML = !visible(0) ? para('Propose un découpage de la phrase pour afficher les tokens.') : para('On découpe la phrase en tokens.') + '<div class="tokens">' + chips(tokens) + '</div>' +
    para('Nombre de tokens <strong>' + tokens.length + '</strong>') + '<p class="tip">💡 Un token est une unité de texte traitée par le modèle.</p>';
  $('embeddings').innerHTML = !visible(1) ? para('Les vecteurs apparaissent après ta réponse à l’étape Embeddings.') : para('Chaque token est représenté par un vecteur <em>x</em> à deux coordonnées.') +
    table(['Token', 'x'], tokens.map((t, i) => [escape(t), '[' + d.X[i].join(' ; ') + ']']), 'mini');
  if (refaireMatrices) {
    const etat = mode === 'free' ? 'Coefficients de simulation manuelle.' : iteration ? 'Paramètres après ' + iteration + ' mise(s) à jour.' : 'Paramètres initialisés avant apprentissage.';
    $('matrices').innerHTML = !visible(2) ? para('Les matrices apparaissent après ta réponse à l’étape Paramètres.') : para(etat) + matrices() +
      (mode === 'free' ? para('Valide une cellule pour recalculer les activations.') : '<button data-mode="free">Modifier en simulation</button>');
  }
  $('apercu').innerHTML = visible(5) ? para('Poids α de la dernière requête (0 à 1)') +
    '<div class="plot">' + d.attention.map((w, i) => '<div class="bar"><span>' + (100 * w).toFixed(1) + ' %</span><div class="bar-track" aria-hidden="true"><i style="height:' + (w*100) + '%"></i></div><span>' + escape(tokens[i]) + '</span></div>').join('') + '</div>' :
    para('Poids d’attention de la dernière requête') + '<div class="plot" aria-hidden="true">' +
    tokens.map(t => '<div class="bar"><span>·</span><div class="bar-track"></div><span>' + escape(t) + '</span></div>').join('') + '</div>' + para('Valeurs à l’étape Softmax.');
  $('resultat').innerHTML = '<strong>◎　Résultat de la prédiction</strong><span class="sentence">' +
    escape(phraseAffichee()) + ' <mark>' + (visible(9) ? prediction(d.p) + '.' : '… ?') + '</mark></span>' +
    (visible(8) ? '<span>Probabilités finales</span>' + d.p.map((p, i) => '<span class="chip">' + vocabulaire[i] + ' · ' + fmt(p * 100) + ' %</span>').join('') : '');
}

function calcul(d) {
  const rows = d.tokens.map((x, i) => (i+1) + ' · ' + escape(x));
  if (numero === 0) return para('Le découpage convertit en minuscules et remplace la ponctuation par des séparateurs. Deux tokens identiques à deux positions gardent le même ID.') +
    table(['Position', 'Token', 'ID (indice du vocabulaire)'], rows.map((r,i) => [i+1, escape(d.tokens[i]), Object.keys(embeddings).indexOf(d.tokens[i])]));
  if (numero === 1) return para('Chaque ID donne accès à une ligne fixe. X est le tableau des embeddings, de taille nombre de tokens × 2. Le codage opposé de NSI et web est fourni par l’auteur.') +
    table(['Position', 'Vecteur x'], rows.map((r,i) => [r, vec(d.X[i])]));
  if (numero === 2) return para('Les 12 coefficients de WQ, WK et WV sont les paramètres ajustables. Chaque matrice a deux lignes et deux colonnes. X, Q, K et V sont des tableaux recalculés pour la phrase. Change d’exemple pour comparer les entrées avec les mêmes paramètres.');
  if (numero === 3) return para('Pour chaque ligne x et colonne j, la cellule vaut x₁ × W₁ⱼ + x₂ × W₂ⱼ. Les trois tableaux obtenus ont la taille nombre de tokens × 2.') +
    noms.map((nom, m) => fiche(nom + ' = X × W' + nom, table(['Position', 'Colonne 1', 'Colonne 2'], rows.map((r,i) =>
      [r, ...[0,1].map(j => fmt(d.X[i][0]) + ' × (' + fmt(poids()[m][0][j]) + ') + ' +
        fmt(d.X[i][1]) + ' × (' + fmt(poids()[m][1][j]) + ') = ' + fmt(d[nom][i][j]))])))).join('');
  if (numero === 4) return para('q est la dernière requête ' + vec(d.q) + '. Chaque clé k est comparée à q. Le score est un nombre sans unité, divisé par √2 car les vecteurs ont deux coordonnées.') +
    table(['Position', '(q₁ × k₁ + q₂ × k₂) / √2'], rows.map((r,i) => [r, '(' + fmt(d.q[0]) + ' × (' +
      fmt(d.K[i][0]) + ') + ' + fmt(d.q[1]) + ' × (' + fmt(d.K[i][1]) + ')) / √2 = ' + fmt(d.scores[i])]));
  if (numero === 5) return para('On soustrait le maximum m = ' + fmt(d.contexte.max) +
    ' à chaque score. Le facteur commun e⁻ᵐ s’annule dans le quotient et évite le débordement numérique.') +
    para('Dénominateur commun = ' + d.contexte.numerateurs.map(fmt).join(' + ') + ' = ' + fmt(d.contexte.somme) + '.') +
    table(['Position', 'Exponentielle', 'Poids α'], rows.map((r,i) => [r,
      'exp(' + fmt(d.scores[i]) + ' − (' + fmt(d.contexte.max) + ')) = ' + fmt(d.contexte.numerateurs[i]),
      fmt(d.contexte.numerateurs[i]) + ' / ' + fmt(d.contexte.somme) + ' = ' + fmt(d.attention[i])]));
  if (numero === 6) return para('Chaque poids α multiplie les deux coordonnées de la valeur v. La somme des vecteurs obtenus donne deux coordonnées.') +
    table(['Position', 'Produit α × v'], rows.map((r,i) => [r, fmt(d.attention[i]) + ' × ' + vec(d.V[i]) + ' = ' + vec(d.produits[i])])) +
    para('Somme par coordonnée = [' + [0,1].map(j => d.produits.map(v => '(' + fmt(v[j]) + ')').join(' + ')).join(' ; ') + '].') +
    para('Somme calculée = ' + vec(d.sommeValeurs) + '.') +
    para($('ablation').checked ? 'Ablation : on force ensuite z = ' + vec(d.z) + '.' : 'z reçoit cette somme : ' + vec(d.z) + '.');
  if (numero === 7) return para('Le chemin résiduel conserve la contribution du dernier embedding. Les deux vecteurs sont de taille 2.') +
    para('h = x final + z = ' + vec(d.X.at(-1)) + ' + ' + vec(d.z) + ' = ' + vec(d.h) + '.');
  if (numero === 8) return para('La projection fixe prend h₂ pour Python et −h₂ pour HTML. Le softmax s’applique aux deux logits. Son maximum m vaut ' +
    fmt(d.sortie.max) + ' et son dénominateur vaut ' + d.sortie.numerateurs.map(fmt).join(' + ') + ' = ' + fmt(d.sortie.somme) + '.') +
    table(['Candidat', 'Logit', 'Exponentielle', 'Probabilité'], vocabulaire.map((x,i) => [x, fmt(d.logits[i]),
      'exp(' + fmt(d.logits[i]) + ' − (' + fmt(d.sortie.max) + ')) = ' + fmt(d.sortie.numerateurs[i]),
      fmt(d.sortie.numerateurs[i]) + ' / ' + fmt(d.sortie.somme) + ' = ' + fmt(d.p[i])]));
  return para('Argmax de ' + vec(d.p) + ' → ' + vocabulaire[argmax(d.p)] + (d.p[0] === d.p[1] ? ' (égalité, premier candidat par convention).' : '.') +
    ' Un tirage selon les probabilités pourrait sélectionner l’autre candidat.') +
    (d.loss === undefined ? '' : '<details><summary>Révéler la cible et la perte</summary>' +
      para('Cible ' + vocabulaire[entree()[1]] + ' · Perte = −ln(p cible) = ' + fmt(d.loss) +
      '. Forme stable utilisée : m − logit cible + ln(dénominateur du softmax).') + '</details>');
}

function question(item, id) {
  const [titre, indice, choix, raison] = item;
  const resultat = reponses[id];
  const ordre = choix.map((_, i) => i);
  // Rotation déterministe pour préserver les choix lors des rafraîchissements.
  ordre.push(...ordre.splice(0, [...id].reduce((n,c) => n+c.charCodeAt(0), 0) % ordre.length));
  return '<form data-question="' + id + '"><fieldset' + (resultat !== undefined ? ' disabled' : '') +
    '><legend>' + titre + '</legend>' + ordre.map(i => '<label><input type="radio" required name="choix" value="' + i + '"' +
    (resultat === i ? ' checked' : '') + '> ' + choix[i] + '</label>').join('') + '<button>Valider ma réponse</button></fieldset>' +
    '<details><summary>Indice</summary>' + para(indice) + '</details>' +
    (resultat !== undefined || $('prof').checked ? '<p class="tip">' +
      (resultat === undefined ? 'Correction professeur' : resultat === 0 ? 'Correct.' : 'À revoir.') + ' ' + raison + '</p>' : '') + '</form>';
}

function dessinerQuiz() {
  if (!visible(9)) {
    $('quiz-contenu').innerHTML = para('Le quiz s’ouvre après ta tentative à l’étape Prédiction.');
    return;
  }
  $('quiz-contenu').innerHTML = para('Une tentative par question. Le corrigé explique le résultat après validation. Les réponses restent dans ce navigateur.') +
    filtreQuiz.map(i => '<details><summary>' + (i < 20 ? 'Livret ' + (i+1) : 'Transfert') + ' · ' + livret[i][0] +
      (reponses['livret'+i] !== undefined ? ' ✓' : '') + '</summary>' + question(livret[i], 'livret'+i) + '</details>').join('');
}
function progression() {
  const nombre = livret.slice(0,20).filter((_,i) => reponses['livret'+i] !== undefined).length;
  $('progression').value = nombre;
  $('progression-label').textContent = nombre + ' / 20 questions traitées';
}

function chaine() {
  const boutons = etapes.map(([nom, sous], i) => '<button data-step="' + i + '"' +
    (i === numero ? ' aria-current="step"' : '') + (accessible(i) ? '' : ' disabled') + '>' + nom + '<small>' + sous + '</small></button>');
  $('chaine').innerHTML = [[0],[1],[2,3],[4],[5],[6,7],[8,9]].map(indices =>
    '<span class="chain-group">' + indices.map(i => boutons[i]).join('') + '</span>').join('');
  $('precedent').disabled = numero === 0;
  $('suivant').disabled = $('suivant-calcul').disabled = numero === etapes.length - 1 || !accessible(numero+1);
}
function comparaison() {
  if (!visible(9)) {
    $('comparaison-contenu').innerHTML = para('La comparaison apparaît à l’étape Prédiction. Les phrases de test restent hors corpus.');
    return;
  }
  const donnees = tests.map(([s, y]) => {
    const d = propager(poids(), s, y, $('ablation').checked);
    return [s, vec(d.X.at(-1)), vec(d.z), vec(d.h), ...d.p.map(fmt), prediction(d.p), vocabulaire[y]];
  });
  $('comparaison-contenu').innerHTML = para('Même dernier token, mêmes paramètres pendant les deux propagations. Deux exemples ne permettent pas d’établir une généralisation linguistique.') +
    table(['Phrase hors corpus', 'Dernier x', 'z', 'h', ...vocabulaire, 'Argmax', 'Cible'], donnees) +
    '<p><button data-exemple="nsi">Inspecter NSI</button> <button data-exemple="web">Inspecter web</button></p>';
}

function dessinerTrace() {
  if (mode !== 'train') return;
  const reveler = $('cibles').checked || $('prof').checked;
  const donnees = mesurer(W);
  $('trace').innerHTML = fiche('Itération ' + iteration + ' / 20 · graine ' + graine,
    table(['Contexte', 'Prédiction', 'Cible', 'Probabilité cible', 'Perte'], donnees.exemples.map(d =>
      [d.phrase, prediction(d.p), reveler ? vocabulaire[d.cible] : 'Masquée', reveler ? fmt(d.p[d.cible]) : '—', reveler ? fmt(d.loss) : '—']))) +
    (reveler ? para('Moyenne = (' + donnees.exemples.map(d => fmt(d.loss)).join(' + ') + ') / 4 = ' + fmt(donnees.moyenne)) : '');
  for (const button of document.querySelectorAll('[data-pas]')) button.disabled = actif || iteration === 20;
  $('pause').disabled = !actif;
  if (!reveler) return;
  const pas = $('papier').checked ? 0.1 : epsilon;
  const poidsDetail = iteration === 20 && !$('papier').checked ? matricesHistoriques[19] : W;
  if (cacheDifferences?.W !== poidsDetail || cacheDifferences?.pas !== pas) {
    cacheDifferences = { W: poidsDetail, pas, details: differences(poidsDetail, pas) };
  }
  const details = cacheDifferences.details;
  const liste = details.flat(2);
  const etiquette = i => 'W' + noms[Math.floor(i/4)] + ' ' + (Math.floor(i/2)%2+1) + ',' + (i%2+1);
  const d = liste[cellule];
  $('trace').insertAdjacentHTML('beforeend', fiche('Différences finies centrées',
    para($('papier').checked ? 'Estimation papier, ε = 0,1. Les valeurs proposées ici ne sont pas appliquées à la trace.'
      : 'Pas de calcul ε = 0,00001. Les 12 gradients partagent le même état de départ. Taux d’apprentissage η = 0,5.' +
        (iteration === 20 ? ' Dernière mise à jour, de 19 à 20.' : ' Mise à jour suivante.')) +
    table(['Coefficient', 'Ancien', 'Ancien − ε', 'Ancien + ε', 'L(−)', 'L(+)', 'Gradient', 'Nouveau'],
      liste.map((x,i) => ['<button data-gradient="' + i + '" aria-pressed="' + (i === cellule) + '">' + etiquette(i) + '</button>',
        fmt(x.ancien), fmt(x.ancien-pas), fmt(x.ancien+pas), fmt(x.moins.moyenne), fmt(x.plus.moyenne), fmt(x.gradient), fmt(x.nouveau)])) +
    fiche('Influence de ' + etiquette(cellule), para(
      (cellule < 4 ? 'WQ → requête finale → scores → α → z' : cellule < 8 ? 'WK → clés → scores → α → z' : 'WV → valeurs → z, avec α inchangé') +
      ' → h → logits → probabilités → perte.') +
      table(['Exemple', 'z −', 'z +', 'p cible −', 'p cible +', 'Perte −', 'Perte +'], d.moins.exemples.map((x,i) => {
        const y = d.plus.exemples[i];
        return [x.phrase, vec(x.z), vec(y.z), fmt(x.p[x.cible]), fmt(y.p[y.cible]), fmt(x.loss), fmt(y.loss)];
      })) +
      para('Gradient ≈ (' + precision(d.plus.moyenne) + ' − ' + precision(d.moins.moyenne) + ') / (2 × ' + pas +
        ') = ' + fmt(d.gradient) + '. Nouveau = ' + fmt(d.ancien) + ' − ' + eta + ' × (' + fmt(d.gradient) + ') = ' + fmt(d.nouveau) +
        '. Les calculs utilisent les valeurs non arrondies.') +
      para('Dans ce corpus, la seconde ligne de WQ ne change pas la dernière requête. La première colonne de WV influe uniquement sur la première coordonnée de h, ignorée en sortie.'))));
  $('trace').insertAdjacentHTML('beforeend', fiche('Historique de la perte moyenne', '<canvas class="history" id="graphique" width="720" height="110" aria-hidden="true"></canvas>' +
    '<details><summary>Valeurs du graphique</summary>' + table(['Itération', 'Perte'], historique.map((p,i) => [i,fmt(p)])) + '</details>'));
  const ctx = $('graphique').getContext('2d');
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--cyan');
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 3;
  const min = Math.min(...historique);
  const amplitude = Math.max(0.01, Math.max(...historique) - min);
  ctx.beginPath();
  historique.forEach((p,i) => {
    const x = 18 + i * 34;
    const y = 92 - 74 * (p-min)/amplitude;
    if (i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
  historique.forEach((p,i) => {
    ctx.beginPath();
    ctx.arc(18+i*34,92-74*(p-min)/amplitude,3,0,2*Math.PI);
    ctx.fill();
  });
}

let matricesHistoriques = [W];
function draw({ matrices: redo = true, trace = true } = {}) {
  const d = analyser();
  petiteVue(d, redo);
  chaine();
  $('calcul').hidden = !$('details').checked;
  $('etape-titre').textContent = (numero+1) + ' · ' + etapes[numero][0];
  $('calcul-contenu').innerHTML = question(etapes[numero].slice(2), 'etape'+numero) +
    (visible(numero)
      ? '<details id="operation" open><summary>Voir le calcul pour le contexte choisi</summary>' + calcul(d) + '</details>'
      : para('Valide une réponse pour ouvrir le calcul et l’étape suivante.'));
  $('entrainement').hidden = mode !== 'train';
  if (trace) dessinerTrace();
  comparaison();
  progression();
}

function aller(n) {
  if (!accessible(n)) return;
  numero = Math.max(0, Math.min(etapes.length-1, n));
  poser('explication');
  draw({trace:false});
  if (!$('calcul').hidden) $('etape-titre').focus();
  else $('chaine').querySelector('[aria-current]').focus();
}

function changerMode(nouveau) {
  if (nouveau !== 'train') suspendre();
  mode = nouveau;
  if (!accessible(numero)) numero = etapes.findIndex((_, i) => !visible(i));
  poser('explication');
  for (const button of document.querySelectorAll('.modes button')) button.setAttribute('aria-pressed', button.dataset.mode === mode);
  draw();
  dessinerQuiz();
}
function choisirExemple(value) {
  $('exemple').value = exemple = value;
  $('phrase-form').hidden = value !== 'libre';
  $('phrase').value = phraseLibre;
  draw({trace:false});
}
function suspendre() { window.clearTimeout(minuterie); actif = false; file = 0; }
function entrainer(nombre) {
  if (actif || iteration >= 20) return;
  actif = true;
  file = Math.min(nombre, 20-iteration);
  dessinerTrace();
  const pasSuivant = () => {
    if (!actif) return;
    W = etape(W);
    iteration++;
    historique.push(mesurer(W).moyenne);
    matricesHistoriques.push(W);
    if (--file === 0) suspendre();
    draw();
    feedback('Itération ' + iteration + ' sur 20.');
    if (actif) minuterie = window.setTimeout(pasSuivant, 90);
  };
  minuterie = window.setTimeout(pasSuivant, 90);
}
function repartir(nouvelleOrigine, nouvelleGraine) {
  suspendre();
  origine = nouvelleOrigine;
  graine = nouvelleGraine;
  W = initialiser(graine, origine);
  libre = clone(W);
  libreMeta = { origine, graine };
  iteration = 0;
  numero = 0;
  poser('explication');
  historique = [mesurer(W).moyenne];
  matricesHistoriques = [W];
  $('ablation').checked = false;
  choisirExemple('nsi');
  draw();
}
function exportable() {
  return { version:1, corpus:'microalbert-attention-v1',
    ...(mode === 'free' ? libreMeta : {origine, graine}),
    iteration:mode === 'free' ? 0 : iteration,
    type:mode === 'free' ? 'manuel' : 'entrainement', W:poids() };
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-mode], [data-step], [data-pas], [data-gradient], [data-exemple]');
  if (!target) return;
  const data = target.dataset;
  if (data.mode) {
    changerMode(data.mode);
    if (target.tagName === 'BUTTON' && data.mode === 'train') $('entrainement').scrollIntoView();
    if (target.tagName === 'BUTTON' && data.mode === 'free' && !target.isConnected) $('matrices').querySelector('input').focus();
  }
  if (data.step !== undefined) aller(Number(data.step));
  if (data.pas) entrainer(Number(data.pas));
  if (data.gradient !== undefined) {
    cellule = Number(data.gradient);
    dessinerTrace();
    document.querySelector('[data-gradient="' + cellule + '"]').focus();
  }
  if (data.exemple) {
    choisirExemple(data.exemple);
    $('exemple').focus();
  }
});
document.addEventListener('submit', event => {
  const id = event.target.dataset.question;
  if (!id) return;
  event.preventDefault();
  if (reponses[id] !== undefined) return;
  reponses[id] = Number(new FormData(event.target).get('choix'));
  sauver('reponses-v2', reponses);
  if (id.startsWith('livret')) {
    const wrapper = event.target.closest('details');
    const i = Number(id.slice(6));
    wrapper.querySelector('summary').textContent += ' ✓';
    event.target.outerHTML = question(livret[i], id);
  } else {
    poser('validation');
    draw({trace:false});
    if (numero === 9) dessinerQuiz();
  }
  progression();
  const correction = document.querySelector('[data-question="' + id + '"] .tip');
  correction?.setAttribute('tabindex', '-1');
  correction?.focus();
});
$('phrase-form').addEventListener('submit', event => {
  event.preventDefault();
  const phrase = $('phrase').value;
  try {
    propager(libre, phrase);
    phraseLibre = phrase;
    draw({trace:false});
    feedback('Phrase calculée.');
  } catch (error) { feedback(error.message); }
});
$('matrices').addEventListener('change', event => {
  if (!event.target.matches('[data-cell]')) return;
  const input = event.target;
  const [m,i,j] = input.dataset.cell.split(',').map(Number);
  const value = input.valueAsNumber;
  if (!Number.isFinite(value) || !input.validity.valid) {
    input.value = libre[m][i][j];
    feedback('Coefficient invalide. La valeur précédente est conservée.');
    return;
  }
  libre[m][i][j] = value;
  draw({matrices:false,trace:false});
  feedback('Coefficient manuel recalculé.');
});
for (const id of ['suivant','suivant-calcul']) $(id).addEventListener('click', () => aller(numero+1));
$('precedent').addEventListener('click', () => aller(numero-1));
$('exemple').addEventListener('change', e => choisirExemple(e.target.value));
$('ablation').addEventListener('change', () => draw({matrices:false,trace:false}));
$('details').addEventListener('change', () => { $('calcul').hidden = !$('details').checked; });
$('prof').addEventListener('change', () => {
  if (!accessible(numero)) numero = etapes.findIndex((_, i) => !visible(i));
  poser('explication');
  draw();
  dessinerQuiz();
});
$('calcul-contenu').addEventListener('change', event => {
  if (event.target.matches('[type=radio]')) poser('reflexion');
});
$('calcul-contenu').addEventListener('toggle', event => {
  if (event.target.open && event.target.matches('form details')) poser('reflexion');
}, true);
for (const id of ['cibles','papier']) $(id).addEventListener('change', dessinerTrace);
$('pause').addEventListener('click', () => { suspendre(); dessinerTrace(); feedback('Entraînement en pause.'); });
$('reset').addEventListener('click', () => {
  if (!window.confirm('Revenir à la graine 12 et effacer les modifications et la progression locale ?')) return;
  reponses = {};
  sauver('reponses-v2', reponses);
  repartir('reference', 12);
  dessinerQuiz();
  feedback('État de référence restauré.');
});
$('aleatoire').addEventListener('click', () => {
  const reponse = window.prompt('Nouvelle graine entière (0 à 4 294 967 295). Cette initialisation remplace les matrices et la trace. La réussite des tests dépend de la graine.', String(crypto.getRandomValues(new Uint32Array(1))[0]));
  if (reponse === null) return;
  if (!/^\d{1,10}$/.test(reponse) || Number(reponse) > 0xffffffff) { feedback('Graine invalide.'); return; }
  repartir('alternative', Number(reponse));
  feedback('Graine ' + graine + ' · autre initialisation. Réussite des tests variable.');
});
$('theme').addEventListener('change', event => { theme = event.target.value; sauver('theme', theme); reglageTheme(); dessinerTrace(); });
$('export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(exportable(), null, 2)], {type:'application/json'}));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = 'microalbert-attention.json';
  lien.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('import').addEventListener('change', async event => {
  const input = event.target;
  const fichier = input.files[0];
  if (!fichier) return;
  try {
    if (fichier.size > 65536) throw new Error('Fichier trop volumineux.');
    const data = importer(JSON.parse(await fichier.text()));
    if (!window.confirm('Remplacer les matrices du mode importé ?')) return;
    if (data.type === 'manuel') {
      libre = data.W;
      libreMeta = { origine:data.origine, graine:data.graine };
      changerMode('free');
    } else {
      repartir(data.origine, data.graine);
      while (iteration < data.iteration) {
        W = etape(W);
        iteration++;
        historique.push(mesurer(W).moyenne);
        matricesHistoriques.push(W);
      }
      changerMode('train');
    }
    feedback('État importé.');
  } catch (error) { feedback('Import refusé. ' + error.message); }
  finally { input.value = ''; }
});
$('imprimer').addEventListener('click', () => window.print());

reglageTheme();
dessinerQuiz();
draw();
