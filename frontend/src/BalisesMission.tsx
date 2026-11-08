import React, {useState} from 'react';
import PythonEditor from './PythonEditor';
import PythonRunner from './PythonRunner';
import BalisesTestPlanner from './BalisesTestPlanner';

const starter = `def regrouper(etats):
    # Compléter les instructions nécessaires.
    pass
`;
const questions = [
 'Que représente une plage de valeurs identiques consécutives ?',
 'Comment reconnaître le début d’une nouvelle plage ?',
 'Écris la fonction regrouper. Que doit-elle renvoyer pour une liste vide ?',
 'Quels appels permettent de distinguer une solution correcte d’une simple exécution sans exception ?',
 'Pourquoi une même valeur peut-elle figurer dans plusieurs couples distincts ?'
];
const hints = [
 'Commence par prévoir le résultat lorsque la liste est vide.',
 'Compare chaque état à celui de la plage en cours : quelle information dois-tu mémoriser ?',
 'À quel moment faut-il enregistrer la plage terminée ? Et la dernière plage ?'
];
const examples = `print(regrouper([]))  # attendu : []
print(regrouper(['ON']))  # attendu : [('ON', 1)]
print(regrouper(['ON','ON','OFF','OFF','ON']))
# attendu : [('ON', 2), ('OFF', 2), ('ON', 1)]
print(regrouper(['OFF','ON','OFF']))
# attendu : [('OFF', 1), ('ON', 1), ('OFF', 1)]`;

export default function BalisesMission(){
 const [source,setSource]=useState(starter);
 const [stage,setStage]=useState(0);
 const [hintIndex,setHintIndex]=useState(0);
 const [feedback,setFeedback]=useState('Écris toi-même les instructions puis confronte ton résultat aux exemples.');
 const [notes,setNotes]=useState('');
 const [tab,setTab]=useState<'code'|'tests'>('code');
 function inspect(){
  if(!/^\s*def\s+regrouper\s*\(\s*etats\s*\)\s*:/m.test(source)){setFeedback('Vérifie la définition de la fonction regrouper(etats).');return;}
  if(/^\s*pass\s*$/m.test(source)){setFeedback('Une instruction pass reste à remplacer : la structure seule ne suffit pas.');return;}
  setFeedback('La définition semble présente. Ce contrôle textuel ne valide ni la syntaxe ni les résultats : exécute des exemples et cherche un contre-exemple.');
 }
 function requestHint(){
  if(hintIndex>=hints.length)return;
  setFeedback(hints[hintIndex]);setHintIndex(i=>i+1);
 }
 return <section aria-labelledby="balises-heading">
  <h2 id="balises-heading">Mission Terminale NSI · Balises lumineuses</h2>
  <p>Mission originale inspirée des compétences de codage par plages. Le dispositif relève des états lumineux « ON » et « OFF ». Écris une fonction qui renvoie une liste de couples (état, effectif) pour chaque plage consécutive. Une liste vide doit produire une liste vide. Ne modifie pas la liste reçue.</p>
  <p className="lab-notice">RLE (Run-Length Encoding) : codage par plages. Cette activité n’est pas l’énoncé d’une épreuve certificative.</p>
  <nav className="lab-steps" aria-label="Étapes de la mission Balises lumineuses">{['Découverte','Recherche','Implémentation','Vérification','Bilan'].map((name,i)=><button type="button" key={name} aria-current={stage===i?'step':undefined} onClick={()=>setStage(i)}>{i+1}. {name}</button>)}</nav>
  <p className="lab-question"><strong>Question du tuteur :</strong> {questions[stage]}</p>
  <div className="lab-tabs" role="group" aria-label="Outils Balises lumineuses"><button type="button" aria-pressed={tab==='code'} onClick={()=>setTab('code')}>Code Python</button><button type="button" aria-pressed={tab==='tests'} onClick={()=>setTab('tests')}>Mes tests</button></div>
  {tab==='code'?<><label htmlFor="balises-code">Éditeur Python — ton programme</label><PythonEditor id="balises-code" value={source} onChange={setSource}/><PythonRunner source={source}/><div className="lab-actions"><button type="button" onClick={inspect}>Vérifier la structure (sans exécuter)</button><button type="button" disabled={hintIndex>=3} onClick={requestHint}>Demander un indice ({3-hintIndex} restants)</button></div></>:<><p>Prévois les résultats avant de les exécuter. Ajoute les appels à la fin de ton programme dans l’onglet Code Python.</p><pre className="lab-examples">{examples}</pre><BalisesTestPlanner/><label htmlFor="balises-notes">Mes observations et justifications</label><textarea id="balises-notes" className="lab-notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Note un cas limite, une hypothèse et le résultat observé."/></>}
  <p className="lab-feedback" role="status">{feedback}</p>
  <p className="lab-notice">Une exécution sans exception ne certifie pas la correction de la fonction. Aucun code n’est transmis à l’API Albert ; aucune sauvegarde des travaux.</p>
 </section>;
}
