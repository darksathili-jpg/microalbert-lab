import React, { useState } from 'react';
import './PythonLab.css';

const initial = `def enfiler(file, valeur):
    # Ajouter une valeur à la fin de la file
    pass

def defiler(file):
    # Retirer et renvoyer le premier élément ; None si la file est vide
    pass
`;

const stages = [
 {name:'Découverte', question:'Pourquoi une file respecte-t-elle l’ordre « premier entré, premier sorti » ?'},
 {name:'Recherche', question:'Quelle opération sur une liste permet d’ajouter une valeur en fin de file ?'},
 {name:'Implémentation', question:'Écris les deux fonctions. Quels cas particuliers dois-tu prévoir ?'},
 {name:'Vérification', question:'Propose un appel de fonction et indique la valeur renvoyée attendue.'},
 {name:'Bilan', question:'Quelle différence observes-tu entre une file et une pile ?'}
] as const;

export default function PythonLab() {
 const [source, setSource] = useState(initial);
 const [step, setStep] = useState(0);
 const [feedback, setFeedback] = useState('Écris personnellement les fonctions puis propose des tests.');
 const [hintCount, setHintCount] = useState(0);
 const [testNotes, setTestNotes] = useState('');
 const [view, setView] = useState<'code'|'tests'>('code');
 function inspect() {
  const names = ['enfiler','defiler'].filter(name => new RegExp('^\\s*def\\s+'+name+'\\s*\\(', 'm').test(source));
  if (names.length < 2) setFeedback('Vérifie que les fonctions enfiler et defiler sont définies.');
  else if (/^\s*pass\s*$/m.test(source)) setFeedback('Les deux fonctions sont présentes, mais des instructions pass restent à remplacer.');
  else setFeedback('Les deux fonctions semblent présentes. Cette vérification textuelle ne prouve ni la syntaxe ni la correction : prépare des tests.');
 }
 function hint() {
  if (hintCount >= 3) { setFeedback('Budget d’indices atteint. Montre une tentative et demande une intervention de l’enseignant.'); return; }
  const hints = [
   'Pense aux deux extrémités de la file : où insère-t-on et où retire-t-on ?',
   'Teste d’abord une file vide, puis une file contenant deux valeurs distinctes.',
   'Décris la différence entre modifier une liste et renvoyer une valeur.'
  ];
  setFeedback(hints[hintCount]);setHintCount(n=>n+1);
 }
 return <section className="python-lab" aria-labelledby="lab-heading">
  <h2 id="lab-heading">Mission Terminale NSI · Une file de messages</h2>
  <p>Objectif : implémenter une file représentée par une liste Python. Tu écris le code ; le tuteur questionne ta démarche sans livrer le corrigé.</p>
  <nav className="lab-steps" aria-label="Étapes de la mission">{stages.map((s,i)=><button key={s.name} type="button" aria-current={step===i?'step':undefined} onClick={()=>setStep(i)}>{i+1}. {s.name}</button>)}</nav>
  <p className="lab-question"><strong>Question du tuteur :</strong> {stages[step].question}</p>
  <div className="lab-tabs" role="group" aria-label="Outils de travail"><button type="button" aria-pressed={view==='code'} onClick={()=>setView('code')}>Code Python</button><button type="button" aria-pressed={view==='tests'} onClick={()=>setView('tests')}>Mes tests</button></div>
  {view==='code'?<><label htmlFor="lab-code">Éditeur Python — ton programme</label><textarea id="lab-code" className="lab-code" spellCheck={false} value={source} onChange={e=>setSource(e.target.value)} aria-describedby="lab-execution-note"/><p id="lab-execution-note" className="lab-notice">Éditeur local sans exécution Python. Le contrôle proposé ci-dessous est uniquement textuel, pas un test du programme.</p><div className="lab-actions"><button type="button" onClick={inspect}>Vérifier la structure (sans exécuter)</button><button type="button" onClick={hint} disabled={hintCount>=3}>Demander un indice ({3-hintCount} restants)</button></div></>:<><p>Prépare les appels et les résultats attendus avant de lancer un interpréteur Python sécurisé.</p><pre className="lab-examples">{'f = []\nenfiler(f, 7)\nenfiler(f, 4)\nprint(f)  # attendu : [7, 4]\nprint(defiler(f))  # attendu : 7\nprint(defiler([])) # attendu : None'}</pre><label htmlFor="lab-notes">Mes observations et justifications</label><textarea id="lab-notes" className="lab-notes" value={testNotes} onChange={e=>setTestNotes(e.target.value)} placeholder="Décris tes tests, les valeurs attendues et ce que tu dois vérifier." /></>}
  <p className="lab-feedback" role="status">{feedback}</p>
  <p className="lab-notice">Prototype pédagogique hors ligne : aucun code envoyé à Albert API, aucun corrigé automatique, aucune sauvegarde des travaux.</p>
 </section>;
}
