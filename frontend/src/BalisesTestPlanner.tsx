import React, {useState} from 'react';

type Case = {id:string;label:string;input:string;expected:string;question:string};
const cases:Case[]=[
 {id:'vide',label:'Liste vide',input:'regrouper([])',expected:'[]',question:'Ton programme accède-t-il à un élément avant de vérifier que la liste n’est pas vide ?'},
 {id:'unique',label:'Une seule valeur',input:"regrouper(['ON'])",expected:"[('ON', 1)]",question:'Comment enregistres-tu la dernière plage après le parcours ?'},
 {id:'alternance',label:'Valeurs non consécutives',input:"regrouper(['OFF','ON','OFF'])",expected:"[('OFF', 1), ('ON', 1), ('OFF', 1)]",question:'Deux valeurs identiques séparées par une autre appartiennent-elles à la même plage ?'},
 {id:'longue',label:'Plage longue',input:"regrouper(['ON'] * 256)",expected:"[('ON', 256)]",question:'La consigne impose-t-elle une limite artificielle à 255 pour l’effectif ?'}
];
export default function BalisesTestPlanner(){
 const [predictions,setPredictions]=useState<Record<string,string>>({});
 const [revealed,setRevealed]=useState<Record<string,boolean>>({});
 return <section aria-labelledby="balises-tests-heading">
  <h3 id="balises-tests-heading">Préparer des tests de comportement</h3>
  <p>Avant de consulter un résultat attendu, écris ta prédiction. Ces comparaisons ne lancent pas ton programme et ne prouvent pas sa correction : exécute ensuite les appels dans l’éditeur Python.</p>
  {cases.map(c=><div className="lab-test-case" key={c.id}>
   <h4>{c.label}</h4><pre className="lab-examples">{c.input}</pre>
   <label htmlFor={'prediction-'+c.id}>Résultat que tu prévois</label>
   <textarea id={'prediction-'+c.id} className="lab-notes" rows={2} value={predictions[c.id]||''} onChange={e=>setPredictions(p=>({...p,[c.id]:e.target.value}))} placeholder="Écris le résultat prévu avant de comparer."/>
   <button type="button" disabled={!(predictions[c.id]||'').trim()} onClick={()=>setRevealed(p=>({...p,[c.id]:true}))}>Comparer avec le résultat attendu</button>
   {revealed[c.id]&&<div role="note"><p><strong>Résultat attendu :</strong> <code>{c.expected}</code></p><p><strong>Question du tuteur :</strong> {c.question}</p><p>Compare également avec le résultat effectivement obtenu lors de ton exécution.</p></div>}
  </div>)}
 </section>;
}
