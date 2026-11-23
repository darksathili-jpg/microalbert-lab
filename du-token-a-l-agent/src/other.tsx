import { useState } from 'react'
import type { ReactNode } from 'react'
import { Range } from './lab1'
import {
  attention,
  cosine,
  dot,
  fmt,
  gradient,
  loss,
  probability,
  sample,
  sftLoss,
  softmax,
} from './science'
import { Project, Agent, program } from './tutor'
function Activity({
  id,
  title,
  children,
  fictive = true,
}: {
  id: string
  title: string
  children: ReactNode
  fictive?: boolean
}) {
  return (
    <section className="panel">
      <p className="section-label">{id}</p>
      <h2>{title}</h2>
      {fictive && <p className="fiction">Simulation pédagogique fictive</p>}
      {children}
    </section>
  )
}
function V({ v }: { v: number[] }) {
  return <code>({v.map((n) => fmt(n)).join(' ; ')})</code>
}
function Two({
  title,
  value,
  onChange,
}: {
  title: string
  value: number[]
  onChange: (v: number[]) => void
}) {
  return (
    <div>
      {value.map((n, i) => (
        <Range
          key={i}
          label={title + ' · ' + (i ? 'y' : 'x')}
          value={n}
          onChange={(x) => onChange(value.map((v, j) => (j === i ? x : v)))}
        />
      ))}
    </div>
  )
}
function Bars({ names, values }: { names: string[]; values: number[] }) {
  return (
    <ul className="bars">
      {values.map((p, i) => (
        <li key={names[i]}>
          <span>{names[i]}</span>
          <progress aria-label={names[i]} max={1} value={p} />
          <strong>{fmt(p * 100, 2)} %</strong>
        </li>
      ))}
    </ul>
  )
}
const words = ['NSI', 'spécialité', 'lycée']
function AttentionLab() {
  const [m, setM] = useState<number[][][]>(
    Array.from({ length: 3 }, () => [
      [1, 0],
      [0, 1],
      [1, 1],
    ]),
  )
  const [which, setWhich] = useState(2),
    [mask, setMask] = useState(true)
  const [queries, keys, values] = m
  const rows = queries.map((q, i) => attention(q, keys, values, mask ? i : 2))
  const a = rows[which]
  const swap = (v: number[]) => [v[1], v[0]]
  const b = attention(
    swap(queries[which]),
    keys,
    values.map((v) => [v[0], -v[1]]),
    mask ? which : 2,
  )
  const concat = [...a.output, ...b.output]
  return (
    <>
      <Activity
        id="L02-A01"
        title="Du produit scalaire au vecteur contextualisé"
      >
        <p>
          Initialement Q, K et V sont égales aux trois lignes d’entrée, car les
          trois matrices de projection sont l’identité de dimension 2. Modifiez
          maintenant directement les lignes projetées.
        </p>
        <div className="matrix">
          {m.map((rows, k) => (
            <table key={k} style={{ width: 'auto' }}>
              <caption>{['Requêtes Q', 'Clés K', 'Valeurs V'][k]}</caption>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <th scope="row">{words[i]}</th>
                    {row.map((x, j) => (
                      <td key={j}>
                        <input
                          type="number"
                          min="-99"
                          max="99"
                          step=".1"
                          aria-label={`${'QKV'[k]} ${words[i]} composante ${j + 1}`}
                          value={x}
                          onChange={(e) => {
                            const value = Number(e.target.value)
                            if (Number.isFinite(value) && Math.abs(value) <= 99)
                              setM(
                                m.map((r, l) =>
                                  l === k
                                    ? r.map((v, t) =>
                                        t === i
                                          ? v.map((n, h) =>
                                              h === j ? value : n,
                                            )
                                          : v,
                                      )
                                    : r,
                                ),
                              )
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
        <label className="field">
          Position de la requête
          <select value={which} onChange={(e) => setWhich(+e.target.value)}>
            {words.map((x, i) => (
              <option value={i} key={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="radio">
          <input
            type="checkbox"
            checked={mask}
            onChange={(e) => setMask(e.target.checked)}
          />
          Appliquer le masque causal
        </label>
        <div
          className="scroll"
          tabIndex={0}
          role="region"
          aria-label="Détail du calcul d’attention"
        >
          <table>
            <thead>
              <tr>
                {[
                  'Clé',
                  'q · k',
                  'Score / √2',
                  'exp(score − max)',
                  'Poids',
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {words.map((w, i) => (
                <tr key={w}>
                  <th scope="row">{w}</th>
                  {[a.products[i], a.scores[i], a.exps[i], a.weights[i]].map(
                    (x, j) => (
                      <td key={j}>{fmt(x)}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="formula">
          Somme des exponentielles = {fmt(a.sum)} · z = <V v={a.output} />
        </p>
        <details>
          <summary>Exercice guidé · Deux produits scalaires</summary>
          <p>
            Au réglage initial, calculez le premier et le troisième produit pour
            la dernière requête. La première clé donne 1 × 1 + 1 × 0 = 1. La
            troisième donne 1 × 1 + 1 × 1 = 2.
          </p>
        </details>
      </Activity>
      <Activity id="L02-A02" title="Observer le masque causal">
        <p>
          {mask
            ? 'Les positions futures ont exactement un poids nul.'
            : 'Comparaison sans masque. En génération autorégressive standard, la requête ne dispose pas des tokens futurs.'}
        </p>
        <div
          className="scroll"
          tabIndex={0}
          role="region"
          aria-label="Matrice d’attention causale"
        >
          <table>
            <caption>Poids par ligne de requête</caption>
            <thead>
              <tr>
                <th>Q / K</th>
                {words.map((w) => (
                  <th scope="col" key={w}>
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} data-selected={which === i}>
                  <th scope="row">{words[i]}</th>
                  {r.weights.map((w, j) => (
                    <td
                      key={j}
                      style={{
                        background:
                          mask && j > i
                            ? undefined
                            : `color-mix(in srgb,var(--accent) ${Math.round(w * 20)}%,transparent)`,
                      }}
                    >
                      {fmt(w)}
                      {mask && j > i ? ' ×' : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Activity>
      <Activity id="L02-A03" title="Combiner deux têtes">
        <p>
          La tête 1 conserve les lignes éditées. La tête 2 permute les
          composantes de Q, conserve K et change le signe de la deuxième
          composante de V grâce à des matrices distinctes. Le masque reste
          commun.
        </p>
        <p>
          Tête 1 <V v={a.output} /> · Tête 2 <V v={b.output} />
        </p>
        <p>
          Concaténation <V v={concat} />
        </p>
        <p>
          Projection illustrative Wₒ vers 2 dimensions, en additionnant les
          sorties correspondantes des têtes{' '}
          <V v={[concat[0] + concat[2], concat[1] + concat[3]]} />
        </p>
      </Activity>
    </>
  )
}
const outputWords = ['Numérique', 'Mathématiques', 'Sciences', 'Informatique']
const outputMatrix = [
  [2, 1],
  [0, 2],
  [1, 0],
  [-1, 1],
]
function Generation() {
  const [h, setH] = useState([2, 1]),
    [offsets, setOffsets] = useState([0, 0, 0, 0]),
    [temp, setTemp] = useState(1),
    [preset, setPreset] = useState(false)
  const [strategy, setStrategy] = useState('gloutonne'),
    [seed, setSeed] = useState(42),
    [state, setState] = useState({
      tokens: [] as string[],
      draw: 42,
      finished: false,
    })
  const names = preset
    ? ['Numérique', 'Mathématiques', 'Physique', 'Informatique']
    : outputWords
  const projected = preset ? [2, 0, -1, 1] : outputMatrix.map((v) => dot(v, h))
  const logits = projected.map((n, i) => n + offsets[i])
  const base = softmax(logits, temp)
  const next =
    state.tokens.length === 0
      ? names
      : [
          ['et', 'ou', 'avec', 'pour'],
          ['Sciences', 'Mathématiques', 'Langues', 'Économie'],
          ['Informatiques', 'Humaines', 'Sociales', 'Naturelles'],
          ['[FIN]', '.', '!', '?'],
        ][Math.min(state.tokens.length - 1, 3)]
  const nextWeights =
    state.tokens.length === 0
      ? base.weights
      : softmax(
          [5, 1, 0, -1].map(
            (n, i) =>
              n + (state.tokens.at(-1) === names[0] || i !== 1 ? 0 : 0.5),
          ),
          temp,
        ).weights
  function advance() {
    const draw = sample(nextWeights, state.draw)
    const index =
      strategy === 'gloutonne'
        ? nextWeights.indexOf(Math.max(...nextWeights))
        : draw.index
    const token = next[index]
    setState({
      tokens: [...state.tokens, token],
      draw: draw.nextSeed,
      finished: token === '[FIN]' || state.tokens.length === 6,
    })
  }
  return (
    <>
      <Activity id="L03-A01" title="Calculer puis normaliser les logits">
        <label className="radio">
          <input
            type="checkbox"
            checked={preset}
            onChange={(e) => {
              setPreset(e.target.checked)
              setOffsets([0, 0, 0, 0])
              setTemp(1)
              setState({ tokens: [], draw: seed, finished: false })
            }}
          />
          Utiliser l’exemple B de référence
        </label>
        {!preset && <Two title="Vecteur caché h" value={h} onChange={setH} />}
        <Range
          label="Température"
          min={0.05}
          max={3}
          step={0.05}
          value={temp}
          onChange={setTemp}
        />
        <div
          className="scroll"
          tabIndex={0}
          role="region"
          aria-label="Projection et softmax"
        >
          <table>
            <thead>
              <tr>
                {[
                  'Token',
                  'Projection initiale',
                  'Ajustement du logit',
                  'Logit z',
                  'exp((z − m)/T)',
                  'Probabilité',
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {names.map((name, i) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  <td>
                    {preset ? (
                      fmt(projected[i])
                    ) : (
                      <>
                        <V v={outputMatrix[i]} /> · h = {fmt(projected[i])}
                      </>
                    )}
                  </td>
                  <td>
                    <input
                      aria-label={'Ajustement ' + name}
                      style={{ width: '7ch' }}
                      type="number"
                      min="-1000"
                      max="1000"
                      value={offsets[i]}
                      onChange={(e) => {
                        const n = Number(e.currentTarget.value)
                        if (Number.isFinite(n) && Math.abs(n) <= 1000)
                          setOffsets(offsets.map((v, j) => (j === i ? n : v)))
                      }}
                    />
                  </td>
                  <td>{fmt(logits[i])}</td>
                  <td>{fmt(base.exps[i], 6)}</td>
                  <td>{fmt(base.weights[i], 6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="formula">
          m = max(z) = {fmt(base.max)} · Σ exp = {fmt(base.sum, 6)} · Σ p ={' '}
          {fmt(
            base.weights.reduce((a, b) => a + b, 0),
            10,
          )}
        </p>
        <Bars names={names} values={base.weights} />
        <details>
          <summary>Exercice guidé · Comparer trois températures</summary>
          <p>
            Rétablissez les réglages puis comparez 0,5, 1 et 2. À 0,5 la
            distribution est plus concentrée. À 2 les écarts de scores sont
            réduits avant exponentiation. Un logit peut être négatif, sa
            probabilité est positive ou nulle à la précision machine.
          </p>
        </details>
      </Activity>
      <Activity id="L03-A02" title="Générer un token à la fois">
        <p>
          Après le premier pas, un petit vocabulaire et une règle explicite de
          scores illustrent le cycle. Les choix précédents font partie du
          contexte. Le cycle s’arrête sur [FIN] ou après 7 ajouts. La fenêtre
          miniature affiche les quatre derniers ajouts.
        </p>
        <label className="field">
          Stratégie
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          >
            <option>gloutonne</option>
            <option>échantillonnage</option>
          </select>
        </label>
        <label className="field">
          Graine (entier de 0 à 2³² − 1)
          <input
            type="number"
            min="0"
            max="4294967295"
            value={seed}
            onChange={(e) => {
              const n = Number(e.target.value) >>> 0
              setSeed(n)
              setState({ tokens: [], draw: n, finished: false })
            }}
          />
        </label>
        <p className="formula" aria-live="polite">
          {state.tokens.join(' ') || 'La génération attend le premier token.'}
          {state.finished ? ' · arrêt' : ''}
        </p>
        <p>Fenêtre affichée : {state.tokens.slice(-4).join(' ') || 'vide'}</p>
        <div className="actions">
          <button onClick={advance} disabled={state.finished}>
            Ajouter un token
          </button>
          <button
            onClick={() =>
              setState({ tokens: [], draw: seed, finished: false })
            }
          >
            Repartir de la graine
          </button>
        </div>
        {!state.finished && <Bars names={next} values={nextWeights} />}
      </Activity>
    </>
  )
}
function Training() {
  const [eta, setEta] = useState(0.5),
    [history, setHistory] = useState([-2])
  function iterate(count: number) {
    setHistory((prev) => {
      const history = [...prev]
      for (let i = 0; i < count && history.length < 201; i++) {
        const w = history.at(-1)!
        history.push(w - eta * gradient(w))
      }
      return history
    })
  }
  const w = history.at(-1)!,
    eps = 1e-5
  const series = [history, history.map(loss), history.map(probability)]
  const text = ['Paramètre w', 'Perte L', 'Probabilité p']
  const [target, setTarget] = useState(0)
  const multi = softmax([w, 0, 1]).weights
  const multiGradient = multi.map((p, i) => p - Number(i === target))
  return (
    <>
      <Activity id="L04-A01" title="Faire une descente de gradient">
        <Range
          label="Taux d’apprentissage η"
          value={eta}
          min={0.05}
          max={2}
          step={0.05}
          onChange={setEta}
        />
        <div className="actions">
          <button onClick={() => iterate(1)} disabled={history.length >= 201}>
            Une itération
          </button>
          <button onClick={() => iterate(10)} disabled={history.length >= 201}>
            Dix itérations
          </button>
          <button onClick={() => setHistory([-2])}>Réinitialiser</button>
        </div>
        <p className="formula" aria-live="polite">
          w = {fmt(w, 6)} · p = {fmt(probability(w), 6)} · L = {fmt(loss(w), 6)}{' '}
          · dL/dw = {fmt(gradient(w), 6)}
          <br />
          Différences finies (ε = 10⁻⁵) :{' '}
          {fmt((loss(w + eps) - loss(w - eps)) / (2 * eps), 6)}
        </p>
        <div className="curve-grid">
          {series.map((values, i) => {
            const low = Math.min(...values),
              high = Math.max(...values)
            const points = values
              .map(
                (n, j) =>
                  `${18 + (j * 244) / Math.max(1, values.length - 1)},${90 - ((n - low) * 68) / (high - low || 1)}`,
              )
              .join(' ')
            return (
              <figure key={i}>
                <figcaption>{text[i]} · échelle propre</figcaption>
                <svg
                  className="graph"
                  viewBox="0 0 280 110"
                  role="img"
                  aria-label={text[i] + ' au fil des itérations'}
                >
                  <path d="M18 16V92H264" stroke="currentColor" fill="none" />
                  <polyline
                    points={points}
                    stroke="var(--accent)"
                    fill="none"
                    strokeWidth="3"
                  />
                  {values.length === 1 && (
                    <circle cx="18" cy="90" r="4" fill="var(--accent)" />
                  )}
                </svg>
              </figure>
            )
          })}
        </div>
        <div
          className="scroll"
          tabIndex={0}
          role="region"
          aria-label="Tableau des itérations"
        >
          <table>
            <thead>
              <tr>
                {['Itération', 'w', 'p', 'L', 'Gradient'].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((n, i) => (
                <tr key={i}>
                  <th scope="row">{i}</th>
                  {[n, probability(n), loss(n), gradient(n)].map((v, j) => (
                    <td key={j}>{fmt(v, 6)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details>
          <summary>Exercice guidé · Prédire le sens de la mise à jour</summary>
          <p>
            Avec η = 0,5 et w = −2, le gradient est négatif. Soustraire η fois
            le gradient fait augmenter w à environ −1,559601. Comparez les deux
            valeurs de perte dans le tableau.
          </p>
        </details>
      </Activity>
      <Activity
        id="L04-A02"
        title="Construire les exemples d’entraînement"
        fictive={false}
      >
        <p>
          Exemple simplifié, segmenté ici en mots pour rendre la lecture plus
          facile. Le token attendu vient du texte lui-même.
        </p>
        <ol>
          {'NSI signifie Numérique et Sciences Informatiques'
            .split(' ')
            .map((x, i, a) => (
              <li key={x}>
                <code>
                  {a.slice(0, i).join(' ') || '[début]'} → {x}
                </code>
              </li>
            ))}
        </ol>
      </Activity>
      <Activity id="L04-A03" title="Étendre le gradient à plusieurs classes">
        <p>
          On calcule trois logits (w ; 0 ; 1). Pour chaque ligne, le gradient de
          la perte par rapport au logit vaut pᵢ − yᵢ. Changer la cible déplace
          le 1 dans le vecteur y et conserve les probabilités.
        </p>
        <label className="field">
          Classe cible
          <select value={target} onChange={(e) => setTarget(+e.target.value)}>
            {['Numérique', 'Mathématiques', 'Sciences'].map((x, i) => (
              <option value={i} key={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <p className="formula">
          p = <V v={multi} /> · y ={' '}
          <V v={multi.map((_, i) => Number(i === target))} /> · ∇z L ={' '}
          <V v={multiGradient} />
        </p>
        <p>
          Pour la projection z = W h, avec h = (2 ; 1), la ligne du gradient de
          W qui correspond à la cible est{' '}
          <V v={[2 * multiGradient[target], multiGradient[target]]} />.
        </p>
      </Activity>
    </>
  )
}
const responses = [
  'NSI.',
  'NSI signifie numérique et sciences informatiques.',
  'NSI signifie numérique et sciences informatiques. Au lycée, on y étudie notamment les algorithmes, la programmation et les données.',
]
function PostTraining() {
  const [intent, setIntent] = useState(1),
    [style, setStyle] = useState('court'),
    [step, setStep] = useState(0)
  const [p, setP] = useState([0.8, 0.6, 0.2])
  const ranks = [
    [2, 0, 1],
    [1, 0, 2],
    [2, 1, 0],
  ][intent]
  return (
    <>
      <Activity id="L05-A01" title="Comparer des réponses et leur perte">
        <label className="field">
          Intention de l’utilisateur
          <select value={intent} onChange={(e) => setIntent(+e.target.value)}>
            <option value={0}>Lire une définition qui permet de réviser</option>
            <option value={1}>Développer le sigle en une phrase</option>
            <option value={2}>Découvrir le programme de la spécialité</option>
          </select>
        </label>
        <ol>
          {ranks.map((i, j) => (
            <li key={i}>
              <strong>{String.fromCharCode(65 + i)}</strong> · {responses[i]}{' '}
              {j === 0 && <em> — préférée selon cette grille</em>}
            </li>
          ))}
        </ol>
        <p>
          {
            [
              'Le contexte scolaire fournit des repères supplémentaires et un exemple de notions.',
              'La réponse B développe exactement le sigle en une phrase.',
              'La réponse C apporte les notions utiles à la découverte de la spécialité.',
            ][intent]
          }{' '}
          La grille traduit ici un choix éditorial.
        </p>
        {p.map((x, i) => (
          <Range
            key={i}
            label={'Probabilité du token cible ' + (i + 1)}
            value={x}
            min={0.01}
            max={1}
            step={0.01}
            onChange={(value) => setP(p.map((n, j) => (j === i ? value : n)))}
          />
        ))}
        <p className="formula">
          L = {p.map((x) => '−ln(' + fmt(x) + ')').join(' ')} ={' '}
          {fmt(sftLoss(p), 9)}
        </p>
        <details>
          <summary>Exercice guidé · Annoter la perte</summary>
          <p>
            Repérez le terme qui augmente si le troisième token est moins
            probable. Le terme −ln(p₃) augmente. Une probabilité 1 donne une
            contribution nulle.
          </p>
        </details>
      </Activity>
      <Activity id="L05-A02" title="Changer l’instruction de style">
        <label className="field">
          Style demandé
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="court">Réponse courte</option>
            <option value="tuteur">Tuteur NSI socratique</option>
          </select>
        </label>
        <blockquote>
          {style === 'court'
            ? responses[1]
            : 'Que désignent les lettres N, S et I ? Pense au nom des disciplines qui étudient les algorithmes et les données.'}
        </blockquote>
        <p>
          Cette instruction fait partie du contexte. Les paramètres resteraient
          fixes pendant cette inférence.
        </p>
      </Activity>
      <Activity id="L05-A03" title="Suivre un appel d’outil simulé">
        <ol>
          {[
            'Le modèle propose query_cours({ thème: « NSI » }).',
            'L’orchestrateur vérifie le schéma et l’autorisation de lecture.',
            'Il exécuterait la recherche de cours.',
            'Le résultat de la recherche rejoindrait le contexte de réponse.',
          ]
            .slice(0, step + 1)
            .map((x) => (
              <li key={x}>{x}</li>
            ))}
        </ol>
        <div className="actions">
          <button disabled={step === 3} onClick={() => setStep(step + 1)}>
            Avancer l’appel
          </button>
          <button onClick={() => setStep(0)}>Recommencer l’appel</button>
        </div>
      </Activity>
    </>
  )
}
const corpus = [
  {
    title: 'Programmes et ressources en NSI',
    source: 'Éduscol',
    date: 'Programme de première, 2019',
    url: 'https://eduscol.education.fr/2068/programmes-et-ressources-en-numerique-et-sciences-informatiques-voie-g',
    excerpt:
      'Numérique et sciences informatiques. La spécialité aborde notamment les données, les algorithmes et les langages de programmation.',
  },
  {
    title: 'Contrôle du flux en Python',
    source: 'Documentation Python 3.13',
    date: 'Version 3.13, 2024',
    url: 'https://docs.python.org/fr/3.13/tutorial/controlflow.html',
    excerpt:
      'Dans range(5), 5 est exclu. La boucle for parcourt successivement les éléments d’une séquence.',
  },
  {
    title: 'Structures de données en Python',
    source: 'Documentation Python 3.13',
    date: 'Version 3.13, 2024',
    url: 'https://docs.python.org/fr/3.13/tutorial/datastructures.html',
    excerpt:
      'On peut utiliser une liste comme pile. Pour une file efficace, utiliser collections.deque.',
  },
]
const terms = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .match(/[a-z0-9]{3,}/g) ?? [],
  )
function Retrieval() {
  const [fiction, setFiction] = useState(false),
    [u, setU] = useState([1, 2]),
    [query, setQuery] = useState('NSI'),
    [last, setLast] = useState('')
  const documents = [
    ['NSI', [1, 2]],
    ['Mathématiques', [2, 0]],
    ['Vie du lycée', [-1, 1]],
  ] as const
  const scores = documents
    .map(([name, v]) => ({
      name,
      score: cosine(u, [...v]),
      product: dot(u, [...v]),
      norm: Math.hypot(...v),
    }))
    .sort((a, b) => (b.score ?? -2) - (a.score ?? -2))
  const found = last
    ? corpus
        .map((doc) => ({
          doc,
          score: [...terms(last)].filter((t) =>
            terms(doc.title + ' ' + doc.excerpt).has(t),
          ).length,
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)[0]
    : null
  return (
    <>
      <Activity id="L06-A01" title="Tester la portée d’une définition">
        <label className="radio">
          <input
            type="checkbox"
            checked={fiction}
            onChange={(e) => setFiction(e.target.checked)}
          />
          Ajouter la définition fictive au contexte
        </label>
        <p>
          Mention dans ce contexte :{' '}
          {fiction
            ? '« Dans notre laboratoire, NSI signifie Navigation Spatiale Intergalactique. »'
            : 'aucune définition locale.'}
        </p>
        <p>
          Définition de la spécialité du lycée :{' '}
          <strong>numérique et sciences informatiques</strong>.{' '}
          {fiction
            ? 'La définition fictive appartient uniquement au laboratoire imaginaire.'
            : ''}
        </p>
      </Activity>
      <Activity id="L06-A02" title="Calculer un classement par cosinus">
        <p>
          Avec u = (1 ; 2) et v = (2 ; 4), u · v = 10 et ‖u‖ × ‖v‖ = √5 × √20 =
          10. Le cosinus vaut 1.
        </p>
        <Two title="Vecteur question" value={u} onChange={setU} />
        <p>Norme de u = {fmt(Math.hypot(...u))}</p>
        <div
          className="scroll"
          tabIndex={0}
          role="region"
          aria-label="Classement par cosinus"
        >
          <table>
            <caption>
              {Math.hypot(...u)
                ? 'Classement par similarité décroissante'
                : 'Vecteur question nul · classement indéfini'}
            </caption>
            <thead>
              <tr>
                <th>Document</th>
                <th>Produit</th>
                <th>Norme</th>
                <th>Cosinus</th>
              </tr>
            </thead>
            <tbody>
              {scores.map(({ name, score, product, norm }) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  <td>{fmt(product)}</td>
                  <td>{fmt(norm)}</td>
                  <td>{score === null ? 'Non défini' : fmt(score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details>
          <summary>
            Exercice guidé · Identifier le document le plus proche
          </summary>
          <p>
            Pour u = (2 ; 0), le document Mathématiques a un cosinus de 1.
            Affectez ensuite zéro aux deux composantes. La formule implique une
            division par zéro, donc le classement n’est plus défini.
          </p>
        </details>
      </Activity>
      <Activity
        id="L06-A03"
        title="Interroger le mini-corpus local"
        fictive={false}
      >
        <p>
          Recherche lexicale réelle sur trois notices locales. L’atelier
          normalise la casse et les accents, compte les mots communs, puis
          choisit le meilleur score. Les passages sont des extraits pédagogiques
          reformulés. La provenance est affichée pour le passage effectivement
          récupéré.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setLast(query.trim())
          }}
        >
          <label className="field">
            Requête documentaire
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
              maxLength={180}
            />
          </label>
          <button type="submit">Rechercher dans le corpus</button>
        </form>
        <div aria-live="polite">
          {last &&
            (found ? (
              <>
                <h3>Passage ajouté au contexte</h3>
                <blockquote>{found.doc.excerpt}</blockquote>
                <p>
                  {found.doc.date} · {found.score} terme(s) commun(s) ·{' '}
                  <a href={found.doc.url}>
                    {found.doc.source} — {found.doc.title}
                  </a>
                </p>
              </>
            ) : (
              <p>
                Aucun passage pour « {last} ». Le contexte documentaire reste
                vide.
              </p>
            ))}
        </div>
      </Activity>
    </>
  )
}
export const lessons = [
  null,
  <>
    <p>
      Le Transformer contextualise les représentations au moyen de l’attention.
      Pour chaque position, l’entrée est projetée en <strong>requête</strong> Q
      (<i>query</i>, ce que la position recherche), <strong>clé</strong> K (
      <i>key</i>, ce à quoi la requête est comparée) et <strong>valeur</strong>{' '}
      V (<i>value</i>, ce qui sera combiné). Les trois projections sont apprises
      dans un modèle réel.
    </p>
    <p>
      Avec les vecteurs NSI = (1 ; 0), spécialité = (0 ; 1), lycée = (1 ; 1) et
      W_Q = W_K = W_V = I₂, la requête de lycée vaut (1 ; 1). Les trois produits
      scalaires donnent 1, 1 et 2. Les scores sont ≈ 0,70710678, 0,70710678 et
      1,41421356 après division par √2. Si les composantes sont indépendantes et
      de variance unitaire, le produit scalaire a une variance proportionnelle à
      la dimension. La division limite la saturation du softmax.
    </p>
    <div className="formula">
      sᵢ = (q · kᵢ) / √dₖ
      <br />
      αᵢ = exp(sᵢ − m) / Σⱼ exp(sⱼ − m), avec m = max(s)
      <br />z = Σᵢ αᵢ vᵢ
    </div>
    <p>
      Pour un décodeur autorégressif, le masque affecte −∞ aux scores des
      positions futures avant le softmax. Leur exponentielle vaut zéro. Les
      poids de chaque ligne totalisent 1. Les calculs utilisent les valeurs en
      double précision, puis l’affichage arrondit à quatre décimales.
    </p>
    <p>
      Chaque tête dispose de ses propres projections. Le modèle concatène les
      sorties puis applique une projection commune. Un bloc comprend également
      des connexions résiduelles, une normalisation et un réseau feed-forward
      appliqué à chaque position. L’ordre précis de ces opérations dépend de
      l’architecture. Des couches successives contextualisent de nouvelles
      représentations. Un poids d’attention renseigne sur le calcul de la tête,
      sans garantir la vérité.
    </p>
  </>,
  <>
    <p>
      À la dernière position, le décodeur produit un vecteur caché h. La
      projection de sortie calcule un logit, ou score brut, par entrée du
      vocabulaire. Pour h = (2 ; 1) et la ligne de « Numérique » (2 ; 1), le
      produit vaut 2 × 2 + 1 × 1 = 5. Les quatre lignes (2 ; 1), (0 ; 2), (1 ;
      0) et (−1 ; 1) donnent les logits 5, 2, 2 et −1.
    </p>
    <div className="formula">
      zᵢ = Wᵢ · h<br />
      pᵢ = exp((zᵢ − m)/T) / Σⱼ exp((zⱼ − m)/T), avec m = max(z), T &gt; 0
    </div>
    <p>
      Soustraire le même maximum à chaque logit multiplie numérateur et
      dénominateur par le même facteur. Les exponentielles restent entre 0 et 1
      et la somme des probabilités vaut 1. Pour les scores (2 ; 0 ; −1 ; 1) à T
      = 1, la distribution arrondie est (0,643914 ; 0,087144 ; 0,032059 ;
      0,236883).
    </p>
    <p>
      La sélection gloutonne prend le maximum. Quand T tend vers 0, les
      probabilités se concentrent sur les maxima, à parts égales en cas
      d’égalité. L’échantillonnage tire dans la distribution. Dans la génération
      autorégressive, chaque token choisi rejoint le contexte. Le masque causal
      exclut le futur et le cache des clés et valeurs (K/V) évite de refaire une
      partie du calcul sur les positions passées. Une limite de contexte et un
      token d’arrêt bornent le processus.
    </p>
  </>,
  <>
    <p>
      En entraînement on affecte une cible à une prédiction, puis on mesure
      l’erreur par l’entropie croisée. Avec deux tokens, un paramètre w fixe le
      logit de « Numérique » et le logit de « Mathématiques » vaut 0. La cible
      est « Numérique ». Le softmax donne la sigmoïde de w.
    </p>
    <div className="formula">
      p = exp(w)/(exp(w)+1)
      <br />L = −ln(p) = ln(1 + exp(−w))
      <br />
      dL/dw = −exp(−w)/(1 + exp(−w)) = p − 1<br />
      wₙ₊₁ = wₙ − η(dL/dw)
    </div>
    <p>
      On dérive le logarithme népérien par la règle de chaîne. À w = −2, p ≈
      0,119203, L ≈ 2,126928 et la dérivée vaut ≈ −0,880797. Pour η = 0,5 la
      mise à jour donne w ≈ −1,559601, donc p ≈ 0,173704. En inférence, w reste
      fixé.
    </p>
    <p>
      En plusieurs classes, pour une cible one-hot y (1 sur la classe attendue,
      0 ailleurs), L = −Σᵢ yᵢ ln(pᵢ) et ∂L/∂zᵢ = pᵢ − yᵢ En effet L = −z_c +
      ln(Σⱼ exp(zⱼ)) pour la cible c. Le premier terme contribue −1 pour i = c
      et 0 ailleurs. Le second contribue exp(zᵢ)/Σⱼ exp(zⱼ) = pᵢ. Si z = W h,
      alors ∂L/∂Wᵢⱼ = (pᵢ − yᵢ)hⱼ. La rétropropagation compose ces dérivées à
      travers les couches par la règle de chaîne. Un entraînement réel combine
      des lots d’exemples et peut utiliser un optimiseur comme AdamW.
    </p>
    <p>
      Dans l’apprentissage autosupervisé, les cibles viennent du texte. Le{' '}
      <i>teacher forcing</i> fournit les vrais tokens précédents pendant
      l’entraînement, même si le modèle aurait prédit un autre token.
    </p>
  </>,
  <>
    <p>
      GPT signifie <i>Generative Pre-trained Transformer</i>. Le préentraînement
      ajuste les paramètres sur la prédiction de tokens. Un réglage fin
      supervisé (SFT, <i>Supervised Fine-Tuning</i>) entraîne ensuite le modèle
      sur des exemples d’instructions et de réponses pour favoriser les
      comportements attendus.
    </p>
    <div className="formula">L_SFT = −Σᵢ ln P_θ(yᵢ | x, y₍&lt;ᵢ₎)</div>
    <p>
      x représente la question et le contexte, yᵢ le token de réponse attendu.
      Les vrais tokens précédents y₍&lt;ᵢ₎ sont fournis pendant l’entraînement.
      Pour (0,8 ; 0,6 ; 0,2), la somme des contributions vaut ≈ 2,343407088. La
      perte pénalise fortement une faible probabilité sur la cible.
    </p>
    <p>
      L’apprentissage par renforcement à partir de retours humains (RLHF) peut
      apprendre une récompense à partir de préférences et optimiser une
      politique par renforcement. L’optimisation directe des préférences (DPO)
      compare directement les probabilités des réponses préférées et rejetées
      relativement à un modèle de référence. Les méthodes et combinaisons
      varient selon les modèles.
    </p>
    <p>
      Une application d’assistant prépare le contexte à partir des rôles des
      messages, dont les instructions et les messages utilisateur. Elle peut
      donner au modèle un catalogue d’outils. Le modèle propose un appel,
      l’orchestrateur décide s’il est autorisé et interprète son résultat.
    </p>
  </>,
  <>
    <p>
      La mémoire paramétrique est distribuée dans les paramètres appris. Le
      contexte contient les informations présentées durant l’inférence. La
      génération augmentée par la recherche documentaire (RAG,{' '}
      <i>Retrieval-Augmented Generation</i>) récupère des passages puis les
      joint au contexte. Un corpus peut être mis à jour et réindexé
      indépendamment des poids.
    </p>
    <div className="formula">
      u · v = u₁v₁ + u₂v₂
      <br />
      ‖u‖ = √(u₁² + u₂²)
      <br />
      cos(u,v) = (u · v)/(‖u‖ ‖v‖)
    </div>
    <p>
      Un système peut encoder questions et documents en embeddings et classer
      leurs passages. Le cosinus est compris entre −1 et 1 lorsque les vecteurs
      sont non nuls. Il compare des directions. Le deuxième atelier utilise des
      vecteurs pédagogiques, tandis que le troisième exécute une recherche
      déterministe par mots.
    </p>
    <p>
      Un passage proche peut être obsolète ou erroné. Une citation doit être
      confrontée au passage réellement consulté. Un document peut aussi contenir
      une instruction trompeuse. L’orchestrateur et l’application traitent le
      document comme une source de données avec une provenance et une portée.
    </p>
  </>,
  <>
    <p>
      Un agent associe un modèle, des outils et un orchestrateur. Dans la boucle
      observer → décider → agir → observer, l’orchestrateur impose les
      transitions, valide les paramètres et contrôle les permissions. La
      proposition du modèle ne lui donne aucun droit d’exécution.
    </p>
    <pre>{program}</pre>
    <p>
      La boucle bornée parcourt i de 0 à 4. À chaque passage, l’instruction
      affecte i à la variable somme de type entier. Après les valeurs 0, 1, 2, 3
      et 4, l’affichage donne 4 au lieu de la somme attendue 10. Le tuteur peut
      demander une trace avant de donner un indice.
    </p>
    <p>
      La machine part de RECEPTION, passe par ANALYSE et VERIFICATION, puis
      GUIDAGE et ATTENTE_ELEVE. Une vérification étayée mène à TERMINE. Un
      refus, un délai dépassé, une erreur ou le budget épuisé mènent à BLOQUE.
      Toute modification nécessite une validation humaine. Suppression et
      publication sont désactivées dans le simulateur.
    </p>
  </>,
  <>
    <p>
      Le projet recueille l’énoncé, le code Python et un résultat attendu.
      L’exécution dans un Web Worker produit une observation réelle, puis un
      scénario prédéfini choisit la prochaine question. L’élève garde la main
      sur son code et explique la correction après comparaison avec l’oracle.
    </p>
    <p>
      Un oracle technique fixe une observation attendue pour le cas proposé. Un
      essai peut réussir sur ce cas et échouer sur d’autres entrées. Les
      critères pédagogiques portent aussi sur le diagnostic, la pertinence des
      questions et la vérification de compréhension.
    </p>
    <p>
      Pyodide exécute Python côté navigateur. Le délai couvre le chargement et
      le calcul, la sortie est plafonnée et un nouveau worker est créé après un
      arrêt. Le worker sépare le calcul de l’interface et ne fournit pas un
      isolement de sécurité absolu. Utilisez du code pédagogique de confiance.
      Le parcours utilise le tutorat prédéfini et ne transmet pas le code à un
      fournisseur de modèle.
    </p>
  </>,
]
export const activities = [
  null,
  <AttentionLab />,
  <Generation />,
  <Training />,
  <PostTraining />,
  <Retrieval />,
  <Agent />,
  <Project />,
]
export const summaries = [
  'La tokenisation transforme le texte en une suite d’indices. Les vecteurs et les positions préparent le calcul d’attention, qui combine les informations du contexte.',
  'Les poids d’attention combinent les valeurs accessibles. Les têtes et les couches enrichissent les représentations avant la projection de sortie.',
  'Les logits sont normalisés et la stratégie choisit un token. L’entraînement explique comment les paramètres qui donnent ces scores sont ajustés.',
  'Une perte transforme la probabilité de la cible en signal d’apprentissage. La descente de gradient ajuste les paramètres et l’inférence les utilise.',
  'Le réglage fin et les préférences façonnent les réponses. Les instructions, les documents et les résultats d’outils fournissent des informations au moment de répondre.',
  'Un passage récupéré enrichit le contexte. Le choix, la vérification et les permissions deviennent essentiels quand un agent peut agir.',
  'L’orchestrateur décide des transitions et des actions autorisées. Les preuves issues des outils aident le tuteur à guider l’élève.',
  'Le projet relie le contexte d’un assistant à des observations d’exécution, des décisions contrôlées et une vérification pédagogique.',
]
