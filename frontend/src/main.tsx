import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Mode = 'eleve' | 'enseignant' | 'audit';
type Theme = 'light' | 'dark' | 'projector';
type Reply = { reply: string; model_id: string; finish_reason: string | null; request_id: string; warnings: string[] };
function App() {
 const [mode,setMode]=useState<Mode>('eleve');
 const [theme,setTheme]=useState<Theme>('light');
 const [message,setMessage]=useState('Explique la boucle bornée en Python, avec un exemple, puis propose un petit exercice.');
 const [reply,setReply]=useState<Reply|null>(null);
 const [error,setError]=useState('');
 const [pending,setPending]=useState(false);
 const [mascotReady,setMascotReady]=useState(true);
 async function send() {
  if(!message.trim()||pending)return;
  setPending(true);setError('');setReply(null);
  const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),10000);
  try {
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,model_id:'microalbert-mock',message}),signal:controller.signal});
   if(!response.ok)throw new Error('HTTP '+response.status);
   setReply(await response.json() as Reply);
  }catch{setError('Serveur local indisponible ou délai dépassé.');}
  finally{window.clearTimeout(timeout);setPending(false);}
 }
 return <div className="app" data-theme={theme}>
  <header className="topbar"><div className="logo"><span className="atom" aria-hidden="true">⚛</span><div><div className="logo-title">Micro<span className="yellow">Albert</span> <span className="orange">Lab</span></div><div className="logo-sub">Laboratoire pédagogique local · Première et Terminale · Expérimentation non certifiée</div></div></div><div className="edition">Albert NSI · V0.1</div><label>Affichage : <select value={theme} onChange={e=>setTheme(e.target.value as Theme)}><option value="light">Clair</option><option value="dark">Sombre</option><option value="projector">Vidéoprojecteur</option></select></label></header>
  <div className="stage"><aside className="mascot-panel" aria-label="Illustration de MicroAlbert">{mascotReady?<img src="/microalbert-reference-left.png" alt="MicroAlbert au tableau, avec son ordinateur et des livres de NSI" onError={()=>setMascotReady(false)}/>:<div className="mascot-fallback">Illustration MicroAlbert à installer dans frontend/public/microalbert-reference-left.png</div>}</aside>
   <main className="workspace"><div className="tabs" role="group" aria-label="Mode de travail">{(['eleve','enseignant','audit'] as const).map(m=><button key={m} type="button" aria-pressed={mode===m} onClick={()=>setMode(m)}>{m==='eleve'?'🎓 Élève':m==='enseignant'?'Enseignant':'Audit'}</button>)}</div>
    <section className="sheet"><div className="model-row"><label htmlFor="model">Modèle Albert</label><select id="model" value="microalbert-mock" disabled><option value="microalbert-mock">microalbert-mock (G1)</option></select><span className="hint">ⓘ Les modèles réels ne sont pas encore activés. Aucune requête Albert API.</span></div>
     <label className="small" htmlFor="prompt">Question de démonstration</label><textarea className="prompt" id="prompt" maxLength={4000} value={message} onChange={e=>setMessage(e.target.value)}/>
     <div className="actions"><button className="primary" type="button" disabled={pending||!message.trim()} onClick={send}>{pending?'Interrogation…':'● Interroger le simulateur'}</button><button className="secondary" type="button" onClick={()=>{setReply(null);setError('');}}>↻ Réinitialiser</button></div>
     <section className="answer" aria-live="polite"><div className="answer-heading">✓ Réponse du simulateur — à vérifier</div><div className="answer-content"><h2>La boucle bornée en Python (<code>for</code>)</h2>
      <div className="answer-grid"><div className="lesson"><p className="lead">Une <strong>boucle bornée</strong> permet de répéter un bloc d'instructions en parcourant un itérable. Avec <code>range(5)</code>, cinq valeurs sont parcourues.</p><h3>1. Structure générale</h3><pre><code>{'for i in range(5):\n    print(i)'}</code></pre><p>La variable <code>i</code> reçoit successivement les valeurs de 0 à 4. L'instruction <code>print</code> affiche chacune de ces valeurs.</p><h3>2. Expérimentation</h3><p>Modifiez mentalement <code>range(5)</code> en <code>range(2, 10, 2)</code> : quelles valeurs seront affichées ?</p><p className="warning">Cette leçon est un contenu statique de démonstration, pas une réponse produite par Albert API ni une correction certifiée.</p></div>
       <div><div className="example"><h3>▶ Exemple Python</h3><pre><code>{'for i in range(5):\n    print(i)'}</code></pre><strong>Affichage :</strong><pre>{'0\n1\n2\n3\n4'}</pre></div><div className="example"><h3>🎯 Petit exercice</h3><p>Écrivez une boucle bornée pour afficher les nombres pairs de 2 à 10 inclus. Précisez les valeurs parcourues.</p></div></div></div>
      {error&&<p role="alert">{error}</p>}{reply&&<div className="example"><h3>Réponse technique du fournisseur simulé</h3><p>{reply.reply}</p><p className="small">Requête : {reply.request_id} · Fin : {reply.finish_reason}</p></div>}
     </div></section>
    </section></main></div><footer>Prototype G2 — référence de composition, fidélité en cours de vérification · Aucune donnée personnelle d'élève</footer>
 </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
