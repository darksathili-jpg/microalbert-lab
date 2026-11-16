import { useRef, useState } from 'react';
import PythonEditor from './PythonEditor';
import PythonRunner from './PythonRunner';
import TrainingPreview from './TrainingPreview';
import activities from './training-preview.json';
import './GuidedExercise.css';

const guidance = {
  'premiere-somme-filtree': {
    goal: 'Additionne les mesures qui atteignent ou dépassent un seuil.',
    predict: 'On a mesuré 5 et 4. Le seuil est 5. Quel total la fonction doit-elle renvoyer ?',
    distractor: '0',
    retry: 'La mesure égale au seuil compte-t-elle ? Relis les mots « atteignent ou dépassent ».',
    confirmed: 'La mesure 5 atteint le seuil. La mesure 4 est trop petite.',
    hint: 'Pour chaque mesure, quelle comparaison te permet de décider si elle contribue au total ?',
  },
  'terminale-parcours-graphe': {
    goal: 'Écris un parcours en profondeur et rends la liste des salles dans l’ordre de leur première visite.',
    predict: 'On part de A. De A on peut aller en B, et de B on peut revenir en A. Quelle liste doit renvoyer la fonction ?',
    distractor: "['A', 'B', 'A']",
    retry: 'Si le parcours revient dans une salle déjà visitée, faut-il l’ajouter à nouveau à la liste ?',
    confirmed: 'Le parcours découvre A puis B. Le retour vers A ne crée pas une nouvelle visite.',
    hint: 'Quelle information peux-tu conserver pour reconnaître une salle déjà visitée ?',
  },
};

type Activity = typeof activities[number];

export default function GuidedExercises() {
  const [selected, setSelected] = useState(0);

  return <div className="guided-exercises">
    <div className="guided-levels">
      <label htmlFor="guided-level">Ton niveau</label>
      <select id="guided-level" value={selected} onChange={event => setSelected(Number(event.target.value))}>
        {activities.map((activity, index) => <option key={activity.id} value={index}>{activity.level}</option>)}
      </select>
    </div>
    {activities.map((activity, index) =>
      <div key={activity.id} hidden={selected !== index}>
        <GuidedExercise activity={activity} active={selected === index}/>
      </div>)}
  </div>;
}

function GuidedExercise({ activity, active }: { activity: Activity; active: boolean }) {
  const prompts = guidance[activity.id as keyof typeof guidance];
  const example = activity.test_case;
  const [choice, setChoice] = useState('');
  const [writing, setWriting] = useState(false);
  const [source, setSource] = useState(activity.examples[0].source);
  const [revision, setRevision] = useState(0);
  const programHeading = useRef<HTMLHeadingElement>(null);
  const correct = choice === example.expected;
  const choices = activity.level === 'Première' ? [prompts.distractor, example.expected] : [example.expected, prompts.distractor];
  const titleId = activity.id + '-title';

  function openProgram() {
    setWriting(true);
    requestAnimationFrame(() => programHeading.current?.focus());
  }

  return <article className="guided-exercise" aria-labelledby={titleId}>
    <h2 id={titleId}>{activity.title}</h2>
    <p className="guided-goal">{prompts.goal}</p>
    {!writing ? <section aria-labelledby={activity.id + '-prediction'}>
      <h3 id={activity.id + '-prediction'}>1. Prévois le résultat</h3>
      <p>{prompts.predict}</p>
      <pre className="guided-call"><code>{example.expression}</code></pre>
      <div className="guided-choices" role="group" aria-label="Résultat attendu">
        {choices.map(value =>
          <button type="button" className="secondary" aria-pressed={choice === value} key={value} onClick={() => setChoice(value)}>
            <code>{value}</code>
          </button>)}
      </div>
      <div aria-live="polite">{choice && <p className="guided-feedback">
        {correct ? prompts.confirmed : prompts.retry}
      </p>}</div>
      {correct && <button type="button" className="primary guided-button" onClick={openProgram}>Écrire mon programme</button>}
    </section> : <section aria-labelledby={activity.id + '-program'}>
      <h3 id={activity.id + '-program'} tabIndex={-1} ref={programHeading}>2. Programme et teste</h3>
      <p>Remplace <code>pass</code> par tes instructions, puis lance le test. Tu avais prévu <code>{example.expected}</code>.</p>
      <details className="guided-details">
        <summary>Lire la consigne complète</summary>
        <p>{activity.statement}</p>
      </details>
      <PythonEditor id={activity.id + '-code'} value={source} onChange={value => {
        setSource(value);
        setRevision(current => current + 1);
      }}/>
      <details className="guided-details">
        <summary>J’ai besoin d’un indice</summary>
        <p>{prompts.hint}</p>
      </details>
      {active && <PythonRunner key={revision} mission="entrainement"
        source={source + '\n\nprint(' + example.expression + ')'} guidedTest={example}/>}
      <details className="guided-details">
        <summary>Proposer un autre test</summary>
        <p>Choisis un cas, écris le résultat attendu, puis ajoute ton propre appel à la fin du programme avec <code>print</code>. Compare les sorties dans leur ordre d’affichage.</p>
        <ul>{activity.checks.map(check => <li key={check}>{check}</li>)}</ul>
      </details>
      <details className="guided-details guided-reference">
        <summary>Voir un exemple de test justifié</summary>
        <TrainingPreview activity={activity}/>
      </details>
    </section>}
  </article>;
}
