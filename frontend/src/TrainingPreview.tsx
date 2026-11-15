import { useState } from 'react';
import preview from './training-preview.json';
import './PythonLab.css';

export default function TrainingPreview() {
  const [selected, setSelected] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const activity = preview[selected];
  const example = activity.examples[attempt];

  return <details className="python-lab">
    <summary>Voir les deux exercices inspirés d’annales</summary>
    <p>Parcours de démonstration. Les tentatives sont fictives et les questions proviennent de l’analyse structurelle du pilote. Aucun appel à Albert.</p>
    <div className="lab-tabs" role="group" aria-label="Niveau de l’exercice">
      {preview.map((item, index) => <button key={item.id} type="button" aria-pressed={index === selected}
        onClick={() => { setSelected(index); setAttempt(0); }}>{item.level}</button>)}
    </div>
    <h3>{activity.title}</h3>
    <p>{activity.statement}</p>
    <p className="lab-notice">Exercice original inspiré du sujet {activity.reference}.</p>
    <div className="lab-actions">
      <button type="button" onClick={() => setAttempt(1)} disabled={attempt === 1}>Voir la tentative révisée</button>
      <button type="button" onClick={() => setAttempt(0)} disabled={attempt === 0}>Revenir à la première tentative</button>
    </div>
    <section className="lab-dialogue" aria-label="Analyse des tentatives fictives" aria-live="polite">
      <h4>Tentative {example.attempt}</h4>
      <pre className="lab-examples"><code>{example.source}</code></pre>
      <p className="lab-question"><strong>Question du tuteur local.</strong> {example.question}</p>
      {example.observations.length > 0 && <ul>{example.observations.map(observation => <li key={observation}>{observation}</li>)}</ul>}
      {example.resolved_diagnostics > 0 && <p>Diagnostics structurels disparus après révision : {example.resolved_diagnostics}.</p>}
      <p>Comportement du programme non évalué.</p>
    </section>
    <h4>Tests à concevoir</h4>
    <ul>{activity.checks.map(check => <li key={check}>{check}</li>)}</ul>
  </details>;
}
