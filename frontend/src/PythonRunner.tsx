import React, {useEffect,useRef,useState} from 'react';
import './PythonRunner.css';
import {guideExecution, type PedagogicalGuidance} from './pedagogicalFeedback';
type Line={stream:'stdout'|'stderr';text:string};
type Result={type:'result';id:number;output:Line[];truncated?:boolean;success:boolean;error?:string};
const TIMEOUT_MS=8000;
export default function PythonRunner({source}:{source:string}){
 const [state,setState]=useState<'idle'|'running'|'success'|'error'|'stopped'|'timeout'>('idle');
 const [lines,setLines]=useState<Line[]>([]);
 const [error,setError]=useState('');
 const [guidance,setGuidance]=useState<PedagogicalGuidance|null>(null);
 const worker=useRef<Worker|null>(null);
 const generation=useRef(0);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 function clear(){
  if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}
  worker.current?.terminate();worker.current=null;
 }
 useEffect(()=>()=>{generation.current++;clear();},[]);
 function stop(reason:'stopped'|'timeout'){
  generation.current++;clear();setState(reason);setGuidance(guideExecution(reason));setError(reason==='timeout'?'Exécution interrompue : délai de 8 secondes dépassé.':'Exécution arrêtée par l’élève.');
 }
 function run(){
  generation.current++;clear();const id=generation.current;
  setLines([]);setError('');setGuidance(null);setState('running');
  try{
   const current=new Worker(new URL('./python-runtime.worker.js',import.meta.url),{type:'classic'});
   worker.current=current;
   current.onmessage=(event:MessageEvent<Result>)=>{
    if(id!==generation.current||event.data?.type!=='result'||event.data.id!==id)return;
    clear();setLines(event.data.output||[]);
    setError([event.data.error,event.data.truncated?'Sortie tronquée à 16 000 caractères.':undefined].filter(Boolean).join('\n'));
    setState(event.data.success?'success':'error');
    setGuidance(guideExecution(event.data.success?'success':'error',event.data.error||''));
   };
   current.onerror=()=>{if(id!==generation.current)return;clear();setError('Erreur du moteur Python local. Vérifier les ressources Pyodide.');setGuidance(guideExecution('engine-error'));setState('error');};
   timer.current=setTimeout(()=>{if(id===generation.current)stop('timeout');},TIMEOUT_MS);
   current.postMessage({type:'run',id,source});
  }catch(e){clear();setError('Impossible de démarrer le moteur Python : '+String(e));setGuidance(guideExecution('engine-error'));setState('error');}
 }
 return <section className="python-runner" aria-labelledby="python-runner-title">
  <h3 id="python-runner-title">Exécution Python locale</h3>
  <p>Le programme s’exécute dans un fil d’exécution distinct du navigateur (Web Worker). Ce mécanisme ne constitue pas un bac à sable pour du code hostile. Délai maximal : 8 secondes, chargement initial compris.</p>
  <div className="python-runner-actions">
   <button type="button" onClick={run} disabled={state==='running'}>Exécuter le code</button>
   <button type="button" onClick={()=>stop('stopped')} disabled={state!=='running'}>Arrêter l’exécution</button>
  </div>
  <p role="status" aria-live="polite">{({idle:'Prêt (aucun programme exécuté)',running:'Exécution en cours…',success:'Exécution terminée',error:'Exécution en erreur',stopped:'Exécution arrêtée',timeout:'Délai dépassé'} as const)[state]}</p>
  <div className="python-runner-output" aria-label="Résultats de l’exécution">{lines.length===0&&!error?<span>Aucune sortie pour le moment.</span>:lines.map((line,i)=><pre key={i} className={line.stream}>{line.text}</pre>)}{error&&<pre className="error">{error}</pre>}</div>
  {guidance&&<aside className="python-pedagogical-guidance" aria-label="Retour pédagogique après exécution"><h4>Retour du tuteur · {guidance.category}</h4><p><strong>Question :</strong> {guidance.question}</p><p><strong>À essayer :</strong> {guidance.nextStep}</p><p className="lab-notice">Ce retour ne certifie pas la correction de ton programme.</p></aside>}
  <p className="lab-notice">Le code n’est pas envoyé à Albert API. Aucune correction automatique de la mission n’est effectuée.</p>
 </section>;
}
