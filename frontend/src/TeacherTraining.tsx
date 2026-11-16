import { useState } from 'react';
import './TeacherTraining.css';
import PythonEditor from './PythonEditor';

type Activity = {
  mission_id: string;
  level: string;
  title: string;
  statement: string;
  starter_code: string;
  source_reference: string;
  checks_to_design: string[];
};

type Assessment = {
  next_question: string;
  findings: { code: string; function: string | null; question: string }[];
  trend: { attempts_observed: number; resolved_findings: string[] };
};

type TutorTurn = { message: string; reply: string; label: string };

const endpoint = '/api/secure/assessment';
const tutorEndpoint = '/api/secure/tutor';

export default function TeacherTraining() {
  const [credential, setCredential] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mission, setMission] = useState('');
  const [session, setSession] = useState('');
  const [source, setSource] = useState('');
  const [result, setResult] = useState<Assessment>();
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [message, setMessage] = useState('');
  const [turns, setTurns] = useState<TutorTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const activity = activities.find(item => item.mission_id === mission);

  async function request<T>(url: string, payload?: object): Promise<T> {
    const response = await fetch(url, {
      method: payload ? 'POST' : 'GET',
      headers: { Authorization: 'Bearer ' + credential.trim(), 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(url === tutorEndpoint ? 35000 : 10000),
    });
    if (response.status === 401 || response.status === 403) throw new Error('Accès refusé ou session expirée. Vérifiez le jeton ou ouvrez une nouvelle session.');
    if (response.status === 429) throw new Error('Trop de requêtes. Réessayez dans une minute.');
    if (response.status === 409) throw new Error('Une réponse est déjà attendue pour cette session.');
    if (!response.ok) throw new Error('Le serveur a refusé la demande. Vérifiez le programme ou la disponibilité du serveur local.');
    return await response.json() as T;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try { await action(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Serveur local indisponible.'); }
    finally { setBusy(false); }
  }

  function clearSession() {
    setSession('');
    setResult(undefined);
    setMessage('');
    setTurns([]);
  }

  async function sendTutorQuestion() {
    const difficulty = message.trim();
    const reply = await request<{ reply: string; warnings: string[] }>(tutorEndpoint, {
      model_id: model, mission_id: mission, session_id: session,
      phase: 'implementation', source, message: difficulty,
    });
    setTurns(previous => [...previous.slice(-9), {
      message: difficulty,
      reply: reply.reply,
      label: reply.warnings.includes('output_guard_blocked') ? 'Relance locale'
        : model === 'microalbert-simulation' ? 'Simulation locale' : 'Albert',
    }]);
    setMessage('');
  }

  return <section className="python-lab teacher-training" aria-labelledby="teacher-training">
    <h3 id="teacher-training">Exercices inspirés d’annales</h3>
    <p>Le pilote local analyse la structure du programme et suit les tentatives par session. L’accès requiert un jeton enseignant émis par le serveur.</p>
    <p id="teacher-training-token-help">Utilisez uniquement le jeton temporaire du pilote local.</p>
    <label htmlFor="teacher-training-token">Jeton du pilote enseignant</label>
    <input id="teacher-training-token" type="password" autoComplete="off" aria-describedby="teacher-training-token-help" maxLength={256} disabled={busy}
      value={credential} onChange={event => { setCredential(event.target.value); setActivities([]); setModels([]); setModel(''); setMission(''); setSource(''); clearSession(); setError(''); }}/>
    <div className="lab-actions">
      <button type="button" disabled={busy || !credential.trim()} onClick={() => void run(async () => {
        const catalog = await request<Activity[]>(endpoint + '/activities');
        setActivities(catalog);
        setMission(catalog[0]?.mission_id ?? '');
        setSource(catalog[0]?.starter_code ?? '');
        clearSession();
        const tutor = await request<{ models: string[] }>(tutorEndpoint + '/models');
        setModels(tutor.models);
        setModel(tutor.models[0] ?? '');
      })}>Charger les exercices</button>
    </div>
    {busy && <p role="status">Demande au serveur local en cours…</p>}
    {error && <p role="alert">{error}</p>}
    {activities.length > 0 && <>
      <label htmlFor="teacher-training-mission">Activité</label>
      <select id="teacher-training-mission" value={mission} disabled={busy} onChange={event => {
        const selected = activities.find(item => item.mission_id === event.target.value);
        setMission(event.target.value);
        setSource(selected?.starter_code ?? '');
        clearSession();
        setError('');
      }}>{activities.map(item => <option key={item.mission_id} value={item.mission_id}>{item.level} · {item.title}</option>)}</select>
    </>}
    {activity && <>
      <p>{activity.statement}</p>
      <p className="lab-notice">Exercice original inspiré du sujet {activity.source_reference}.</p>
      <ul>{activity.checks_to_design.map(check => <li key={check}>{check}</li>)}</ul>
      <div className="lab-actions"><button type="button" disabled={busy} onClick={() => void run(async () => {
        const opened = await request<{ session_id: string }>(endpoint + '/session', { mission_id: mission });
        clearSession();
        setSession(opened.session_id);
        setSource(activity.starter_code);
      })}>{session ? 'Ouvrir une autre session' : 'Ouvrir une session'}</button></div>
      {session && <>
        <label htmlFor="teacher-training-source">Programme de la tentative</label>
        <PythonEditor id="teacher-training-source" value={source} onChange={setSource}/>
        <div className="lab-actions"><button type="button" disabled={busy || !source.trim() || source.length > 8000}
          onClick={() => void run(async () => setResult(await request<Assessment>(endpoint, {
            mission_id: mission, session_id: session, source, phase: 'implementation',
          })))}>Analyser la tentative</button></div>
        {result && <section className="lab-dialogue" aria-label="Dernière analyse structurelle" aria-live="polite">
          <h4>Tentative {result.trend.attempts_observed}</h4>
          <p className="lab-question">{result.next_question}</p>
          {result.findings.length > 0 && <ul>{result.findings.map(finding =>
            <li key={finding.code + ':' + finding.function}>{finding.question}</li>)}</ul>}
          {result.trend.resolved_findings.length > 0 && <p>Diagnostics structurels disparus : {result.trend.resolved_findings.length}.</p>}
          <p>Comportement du programme non évalué.</p>
        </section>}
        <section className="lab-dialogue" aria-labelledby="teacher-tutor-heading">
          <h4 id="teacher-tutor-heading">Dialogue avec le tuteur</h4>
          {models.length === 0 ? <p>Le fournisseur de dialogue est désactivé sur ce serveur. L’analyse structurelle reste disponible.</p> : <>
            <p>Utilisez un programme et des échanges fictifs pour la recette.</p>
            <label htmlFor="teacher-tutor-model">Modèle du tuteur</label>
            <select id="teacher-tutor-model" value={model} disabled={busy}
              onChange={event => setModel(event.target.value)}>
              {models.map(item => <option key={item} value={item}>{item === 'microalbert-simulation' ? 'Simulation locale' : item}</option>)}
            </select>
            <div className="lab-conversation" role="log" aria-label="Échanges de la session">
              {turns.map((turn, index) => <div key={index}>
                <p className="lab-message lab-message--eleve">{turn.message}</p>
                <p className="lab-message lab-message--tuteur">
                  <strong>{turn.label} · </strong>{turn.reply}
                </p>
              </div>)}
            </div>
            <label htmlFor="teacher-tutor-message">Décrire la difficulté</label>
            <textarea id="teacher-tutor-message" className="lab-notes" rows={3} maxLength={1000}
              disabled={busy} value={message} onChange={event => setMessage(event.target.value)}/>
            <div className="lab-actions">
              <button type="button" disabled={busy || !message.trim() || source.length > 8000}
                onClick={() => void run(sendTutorQuestion)}>Demander une relance</button>
            </div>
          </>}
        </section>
      </>}
    </>}
  </section>;
}
