import { useState } from 'react'
import { fmt, question, tokenize, vector, vocabulary } from './science'
export const visible = (x: string) =>
  x.replace(/ /g, '␠').replace(/\n/g, '↵').replace(/\t/g, '⇥')
export function Range({
  label,
  value,
  min = -3,
  max = 3,
  step = 0.1,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (x: number) => void
}) {
  return (
    <label className="range">
      <span>
        {label} <strong>{fmt(value)}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.currentTarget.valueAsNumber)}
      />
    </label>
  )
}
export function Lesson1() {
  return (
    <>
      <p>
        Une chaîne de caractères conserve l’ordre du texte. Les mots sont des
        unités linguistiques. Un <strong>token</strong> est une unité produite
        par un tokeniseur. Il peut correspondre à un mot, à un fragment, à un
        signe de ponctuation ou inclure un espace. Le même texte peut être
        découpé différemment selon le vocabulaire et l’algorithme.
      </p>
      <p>
        Le vocabulaire associe à chaque token un{' '}
        <strong>identifiant entier</strong>. L’identifiant sert à retrouver une
        ligne dans une table. Sa valeur et sa proximité avec un autre entier ne
        renseignent pas sur le sens du token.
      </p>
      <p>
        La table d’<strong>embeddings</strong> (représentations vectorielles)
        associe à chaque identifiant un vecteur de paramètres appris. Si la
        table E possède quatre lignes et deux colonnes, le token d’identifiant 1
        lit la deuxième ligne (les indices commencent à 0). Dans l’exemple
        initial, E[1] = (−1 ; 1). Deux occurrences de ce token lisent la même
        ligne, mais occupent des positions différentes.
      </p>
      <div className="formula">
        texte → tokens → identifiants → vecteurs et positions → modèle →
        prédiction
      </div>
      <p>
        Selon l’architecture, les positions peuvent par exemple être ajoutées
        aux embeddings ou agir par rotation sur les requêtes et les clés. La{' '}
        <strong>fenêtre de contexte</strong> limite le nombre de tokens traités
        ensemble. Ajouter une consigne ou des exemples change l’entrée et peut
        influencer la prédiction sans changer les paramètres appris.
      </p>
      <p>
        Le découpage ci-dessous applique une règle explicite. Il regroupe
        jusqu’à cinq lettres, chiffres ou marques combinatoires et joint, si
        possible, un espace initial au groupe ou à la ponctuation. Les quatre
        entrées connues sont réservées. Les autres identifiants sont attribués
        par ordre d’apparition dans le texte courant. La table miniature couvre
        les quatre entrées connues.
      </p>
    </>
  )
}
export function Lab1() {
  const [text, setText] = useState(question)
  const [windowSize, setWindow] = useState(16)
  const [vectors, setVectors] = useState(vector)
  const [selected, setSelected] = useState(1)
  const tokens = tokenize(text)
  return (
    <>
      <section className="panel" aria-labelledby="cut">
        <div className="section-label">L01-A01 · 8 min</div>
        <h2 id="cut">Découper la phrase</h2>
        <p className="fiction">Simulation pédagogique fictive</p>
        <label className="field">
          Texte d’entrée
          <textarea
            rows={3}
            maxLength={320}
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
          />
        </label>
        <div className="actions">
          <button onClick={() => setText(question)}>
            Rétablir la question NSI
          </button>
          <button onClick={() => setText('chat chat')}>
            Comparer « chat » et « ␠chat »
          </button>
        </div>
        <Range
          label="Fenêtre de contexte miniature"
          value={windowSize}
          min={1}
          max={32}
          step={1}
          onChange={setWindow}
        />
        <p className="muted" aria-live="polite">
          {tokens.length} token(s) · {Array.from(text).length} point(s) de code
          Unicode · {Math.max(0, tokens.length - windowSize)} token(s) hors
          fenêtre
        </p>
        <p className="muted">
          ␠ représente un espace, ↵ un retour à la ligne et ⇥ une tabulation. La
          fenêtre de cet atelier conserve les dernières positions.
        </p>
        <ol className="token-list" aria-label="Sortie du découpage">
          {tokens.map(({ token, id, position }) => (
            <li
              key={position}
              className={
                position < tokens.length - windowSize ? 'excluded' : ''
              }
            >
              <code>{visible(token)}</code>
              <small>
                ID {id} · pos. {position}
                {position < tokens.length - windowSize ? ' · hors fenêtre' : ''}
              </small>
            </li>
          ))}
        </ol>
        {!tokens.length && <p>La chaîne vide produit une séquence vide.</p>}
        <details>
          <summary>Exercice guidé · Comparer deux occurrences</summary>
          <p>
            Chargez « chat chat ». Comparez leurs identifiants. Prédisez ensuite
            les identifiants dans « chat chat chat ».
          </p>
          <p>
            <strong>Correction.</strong> Le premier token est « chat » (ID 4),
            puis « ␠chat » apparaît deux fois (ID 5). Un même fragment avec un
            espace initial constitue ici une unité distincte.
          </p>
        </details>
      </section>
      <section className="panel" aria-labelledby="vectors">
        <div className="section-label">L01-A02 · 10 min</div>
        <h2 id="vectors">Donner des coordonnées aux tokens</h2>
        <p className="fiction">Simulation pédagogique fictive</p>
        <div className="split">
          <div>
            <label className="field">
              Identifiant à explorer
              <select
                value={selected}
                onChange={(e) => setSelected(+e.target.value)}
              >
                {vocabulary.map((x, i) => (
                  <option key={x} value={i}>
                    {i} · {visible(x)}
                  </option>
                ))}
              </select>
            </label>
            {['x', 'y'].map((axis, j) => (
              <Range
                key={axis}
                label={axis}
                value={vectors[selected][j]}
                min={-2}
                max={2}
                onChange={(n) =>
                  setVectors((prev) =>
                    prev.map((v, i) =>
                      i === selected ? v.map((c, k) => (k === j ? n : c)) : v,
                    ),
                  )
                }
              />
            ))}
            <table>
              <caption>Table E des embeddings</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Token</th>
                  <th scope="col">x</th>
                  <th scope="col">y</th>
                </tr>
              </thead>
              <tbody>
                {vectors.map(([x, y], i) => (
                  <tr key={i} data-selected={i === selected}>
                    <th scope="row">{i}</th>
                    <td>
                      <code>{visible(vocabulary[i])}</code>
                    </td>
                    <td>{fmt(x)}</td>
                    <td>{fmt(y)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <svg
            className="graph"
            viewBox="0 0 300 270"
            role="img"
            aria-label={
              'Plan des embeddings. ' +
              vectors
                .map((v, i) => visible(vocabulary[i]) + ': ' + v.join(', '))
                .join('. ')
            }
          >
            <defs>
              <pattern
                id="grid"
                width="48"
                height="48"
                x="150"
                y="134"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 48 0 L 0 0 0 48"
                  fill="none"
                  stroke="currentColor"
                  opacity=".18"
                />
              </pattern>
            </defs>
            <rect x="22" y="6" width="256" height="256" fill="url(#grid)" />
            <path
              d="M 26 134 H 272 M 150 14 V 254"
              stroke="currentColor"
              opacity=".5"
            />
            <text x="274" y="130">
              x
            </text>
            <text x="156" y="18">
              y
            </text>
            {vectors.map(([x, y], i) => (
              <g
                transform={`translate(${150 + x * 48} ${134 - y * 48})`}
                key={i}
              >
                <circle
                  r={i === selected ? 8 : 5}
                  fill={i === selected ? 'var(--accent)' : 'var(--success)'}
                />
                <text x="9" y="-8">
                  {visible(vocabulary[i])}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="formula" aria-live="polite">
          E[{selected}] = ({fmt(vectors[selected][0])} ;{' '}
          {fmt(vectors[selected][1])})
        </p>
        <details>
          <summary>Exercice guidé · Déplacer un embedding</summary>
          <p>
            Choisissez ␠NSI et affectez 0 à x puis 0 à y. Quel nombre est resté
            constant ?
          </p>
          <p>
            <strong>Correction.</strong> Son identifiant 1 reste constant. La
            ligne pointée devient (0 ; 0). Dans un modèle, l’entraînement ajuste
            les valeurs de la table.
          </p>
        </details>
      </section>
    </>
  )
}
