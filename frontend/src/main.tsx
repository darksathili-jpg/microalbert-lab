import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Mode = 'eleve' | 'enseignant' | 'audit';
type Theme = 'light' | 'dark' | 'projector';
type Reply = {reply: string; model_id: string; finish_reason: string | null; request_id: string; warnings: string[]};

function App() {
  const [mode, setMode] = useState<Mode>('eleve');
  const [theme, setTheme] = useState<Theme>('light');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState<Reply | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function send() {
    if (!message.trim() || pending) return;
    setPending(true); setError(''); setReply(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({mode, model_id:'microalbert-mock', message}),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Service indisponible (HTTP ' + response.status + ')');
      const data = (await response.json()) as Reply;
      setReply(data);
    } catch {
      setError('Impossible de joindre le serveur local. Vérifiez son démarrage.');
    } finally { window.clearTimeout(timeout); setPending(false); }
  }

  return <div className="app" data-theme={theme}>
    <header><div className="brand"><span className="brand-mark" aria-hidden="true">M</span><div><strong>MicroAlbert Lab</strong><small>Laboratoire pédagogique NSI · Fondation G1</small></div></div>
      <label>Affichage <select value={theme} onChange={e=>setTheme(e.target.value as Theme)}><option value="light">Clair</option><option value="dark">Sombre</option><option value="projector">Vidéoprojecteur</option></select></label></header>
    <main><aside className="panel intro"><span className="eyebrow">Prototype technique</span><h1>Explorer, expérimenter, comprendre.</h1><p>Une interface de préparation à l'apprentissage des modèles de langage en NSI.</p><div className="placeholder" role="note">Emplacement réservé au personnage MicroAlbert approuvé — aucun sprite provisoire.</div><p className="notice">Démonstration simulée. Ne saisissez aucune donnée personnelle d'élève ni clé API.</p></aside>
      <section className="panel work"><div className="heading"><div><span className="eyebrow">Espace de travail</span><h2>Dialogue expérimental</h2></div><span className="status">Fournisseur simulé</span></div>
      <div className="tabs" role="group" aria-label="Choisir le mode">{(['eleve','enseignant','audit'] as const).map(m=><button type="button" key={m} aria-pressed={mode===m} onClick={()=>setMode(m)}>{m==='eleve'?'Élève':m==='enseignant'?'Enseignant':'Audit'}</button>)}</div>
      <label htmlFor="question">Votre question de test</label><textarea id="question" maxLength={4000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Saisir une question fictive pour vérifier le fonctionnement…" rows={6}/>
      <div className="actions"><span>{message.length} / 4000 caractères</span><button className="primary" type="button" disabled={pending||!message.trim()} onClick={send}>{pending?'Envoi…':'Tester le dialogue'}</button></div>
      <div className="answer" aria-live="polite"><h3>Réponse du laboratoire</h3>{error?<p role="alert">{error}</p>:reply?<><p>{reply.reply}</p><small>Identifiant de requête : {reply.request_id} · Fin : {reply.finish_reason}</small></>:<p>La réponse du fournisseur simulé apparaîtra ici. Aucun appel à Albert API n'est effectué.</p>}</div>
      </section></main><footer>MicroAlbert Lab · G1 en développement · Accès local uniquement · Aucun usage avec des élèves</footer>
  </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
