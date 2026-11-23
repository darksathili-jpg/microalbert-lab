import { useEffect, useRef, useState } from 'react'
import { cases, permitted, program, transition } from './agent'
import type { Action, Permissions, State } from './agent'
export { program }
const durations = { python: 4000, startup: 20000 }
const actions: Action[] = [
  'lecture',
  'python',
  'cours',
  'modifier',
  'supprimer',
  'publier',
]
export function Agent() {
  const [state, setState] = useState<State>('RECEPTION')
  const [permissions, setPermissions] = useState<Permissions>({
    lecture: true,
    python: true,
    cours: true,
    validation: false,
  })
  const [action, setAction] = useState<Action>('python'),
    [choice, setChoice] = useState('trace'),
    [failure, setFailure] = useState('normal')
  const [budget, setBudget] = useState(6),
    [log, setLog] = useState<string[]>([]),
    [rubric, setRubric] = useState<boolean[]>([])
  const criteria = [
    'Diagnostic exact',
    'Question pertinente',
    'Indices progressifs',
    'Solution non divulguée',
    'Compréhension vérifiée',
  ]
  const terminal = state === 'TERMINE' || state === 'BLOQUE'
  function advance() {
    let note = '',
      next = transition(state)
    if (!budget) {
      note = 'Budget d’actions épuisé.'
      next = transition(state, 'échoué')
    } else if (state === 'RECEPTION')
      note = 'Énoncé reçu : calculer la somme de 0 à 4.'
    else if (state === 'ANALYSE')
      note =
        'Proposition structurée : ' +
        JSON.stringify({
          outil: action,
          arguments: action === 'python' ? { scenario: 'somme' } : {},
        })
    else if (state === 'VERIFICATION') {
      const allowed = permitted(action, permissions)
      if (!allowed || failure !== 'normal') {
        next = transition(state, 'échoué')
        note = !allowed
          ? 'Refus de l’orchestrateur.'
          : failure === 'timeout'
            ? 'Délai dépassé.'
            : 'L’outil a signalé une erreur.'
      } else
        note =
          action === 'python'
            ? 'Autorisé · résultat simulé : 4, attendu : 10.'
            : 'Autorisé · résultat simulé de l’action ' + action + '.'
    } else if (state === 'GUIDAGE') {
      note =
        choice === 'trace'
          ? 'Trace demandée : que vaut somme à chaque tour ?'
          : choice === 'solution'
            ? 'Divulgation immédiate : remplace somme = i par somme = somme + i. Cette stratégie réduit le travail de diagnostic laissé à l’élève.'
            : 'Question de transfert : que produit le programme pour range(3) ?'
      setRubric(
        choice === 'trace'
          ? [true, true, true, true, false]
          : choice === 'solution'
            ? [true, false, false, false, false]
            : [true, true, false, true, false],
      )
    } else {
      note =
        'Bilan simulé : ' +
        (choice === 'solution'
          ? 'explication élève absente.'
          : 'le rôle de l’ancienne valeur a été vérifié dans le scénario.')
      setRubric((r) => r.map((b, i) => (i === 4 ? choice !== 'solution' : b)))
      if (choice === 'solution') next = transition(state, 'échoué')
    }
    setLog([...log, note])
    setState(next)
    setBudget(Math.max(0, budget - 1))
  }
  return (
    <>
      <section className="panel">
        <p className="section-label">L07-A01–A03</p>
        <h2>Décider et agir sous contrôle</h2>
        <p className="fiction">
          Simulation pédagogique fictive · trace d’outil simulée
        </p>
        <div className="split">
          <fieldset>
            <legend>Permissions de l’orchestrateur</legend>
            {(
              [
                ['lecture', 'Lire le code'],
                ['python', 'Exécuter Python'],
                ['cours', 'Consulter un cours'],
                [
                  'validation',
                  'Autoriser une modification (validation humaine)',
                ],
              ] as const
            ).map(([key, name]) => (
              <label key={key} className="radio">
                <input
                  type="checkbox"
                  checked={permissions[key]}
                  disabled={state !== 'RECEPTION'}
                  onChange={(e) =>
                    setPermissions({ ...permissions, [key]: e.target.checked })
                  }
                />
                {name}
              </label>
            ))}
            <p>Suppression et publication interdites.</p>
          </fieldset>
          <div>
            <label className="field">
              Outil proposé
              <select
                disabled={state !== 'RECEPTION'}
                value={action}
                onChange={(e) => setAction(e.target.value as Action)}
              >
                {actions.map((a) => (
                  <option value={a} key={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Réponse simulée de l’outil
              <select
                disabled={state !== 'RECEPTION'}
                value={failure}
                onChange={(e) => setFailure(e.target.value)}
              >
                <option value="normal">Normale</option>
                <option value="timeout">Délai dépassé</option>
                <option value="erreur">Erreur d’exécution</option>
              </select>
            </label>
            <label className="field">
              Stratégie de tutorat
              <select
                disabled={state === 'ATTENTE_ELEVE' || terminal}
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
              >
                <option value="trace">Faire tracer les valeurs</option>
                <option value="solution">Révéler la solution</option>
                <option value="verification">Vérifier la compréhension</option>
              </select>
            </label>
            <label className="field">
              Budget initial
              <select
                disabled={state !== 'RECEPTION'}
                value={budget}
                onChange={(e) => setBudget(+e.target.value)}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <p role="status" className="formula">
          État : {state} · actions restantes : {budget}
        </p>
        <div className="actions">
          <button className="primary" disabled={terminal} onClick={advance}>
            Avancer la machine
          </button>
          <button
            onClick={() => {
              setState('RECEPTION')
              setBudget(6)
              setLog([])
              setRubric([])
            }}
          >
            Relancer le scénario
          </button>
        </div>
        <ol aria-label="Trace simulée">
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
        <h3>Grille pédagogique sur 10</h3>
        <ul>
          {criteria.map((c, i) => (
            <li key={c}>
              {c} · {rubric.length ? (rubric[i] ? 2 : 0) : '—'} / 2
            </li>
          ))}
        </ul>
        <p>
          Total : {rubric.filter(Boolean).length * 2} / 10. Ce score décrit le
          scénario et demande une vérification de l’apprentissage.
        </p>
        <details>
          <summary>Exercice guidé · Refuser une action</summary>
          <p>
            Proposez « publier ». Avant l’exécution, l’orchestrateur applique la
            politique et passe à BLOQUE. Refaites l’exercice avec l’exécution
            Python et un délai dépassé.
          </p>
        </details>
      </section>
    </>
  )
}
type Run = {
  stdout: string
  stderr: string
  truncated: boolean
  error?: string
}
type Attempt = Run & { code: string }
function highlight(code: string) {
  return code
    .split(
      /(#[^\n]*|'[^'\n]*'|"[^"\n]*"|\b(?:for|while|in|if|else|return|def|from|import|True|False)\b|\b\d+\b)/g,
    )
    .map((part, i) => (
      <span key={i} className={i % 2 ? 'syntax' : ''}>
        {part}
      </span>
    ))
}
export function Project() {
  const [index, setIndex] = useState(0),
    [code, setCode] = useState(program)
  const [permission, setPermission] = useState(false),
    [busy, setBusy] = useState(false),
    [attempts, setAttempts] = useState<Attempt[]>([])
  const [hint, setHint] = useState(0),
    [answer, setAnswer] = useState(''),
    [verified, setVerified] = useState(false),
    [message, setMessage] = useState('')
  const scenario = cases[index]
  const worker = useRef<Worker | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editor = useRef<HTMLTextAreaElement | null>(null)
  const color = useRef<HTMLPreElement | null>(null)
  function stop() {
    worker.current?.terminate()
    worker.current = null
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(
    () => () => {
      worker.current?.terminate()
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  function reset(i: number) {
    stop()
    setIndex(i)
    setCode(cases[i].code)
    setAttempts([])
    setBusy(false)
    setPermission(false)
    setHint(0)
    setAnswer('')
    setVerified(false)
    setMessage('')
  }
  function run() {
    if (!permission || busy || attempts.length >= 12) return
    setBusy(true)
    setVerified(false)
    setMessage('Chargement ou exécution de Python…')
    const finish = (record: Run) => {
      stop()
      setAttempts((a) => [...a, { ...record, code }])
      setBusy(false)
      setMessage('Exécution terminée.')
    }
    try {
      const instance = new Worker(
        new URL('./python.worker.ts', import.meta.url),
        { type: 'module' },
      )
      worker.current = instance
      const expire = () =>
        finish({
          stdout: '',
          stderr: '',
          truncated: false,
          error: 'Délai maximal dépassé. Le worker a été arrêté.',
        })
      timer.current = setTimeout(expire, durations.startup)
      instance.onmessage = (e) => {
        if (e.data?.ready) {
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(expire, durations.python)
        } else finish(e.data)
      }
      instance.onerror = () =>
        finish({
          stdout: '',
          stderr: '',
          truncated: false,
          error: 'Impossible de démarrer le worker Python.',
        })
      instance.postMessage({
        code,
        indexURL: new URL(
          import.meta.env.BASE_URL + 'python/',
          document.baseURI,
        ).href,
      })
    } catch (error) {
      finish({ stdout: '', stderr: '', truncated: false, error: String(error) })
    }
  }
  const last = attempts.at(-1)
  const matched =
    !!last &&
    last.code === code &&
    !last.error &&
    !last.truncated &&
    last.stdout.trim() === scenario.result
  const state = busy
    ? 'VERIFICATION'
    : verified
      ? 'TERMINE'
      : attempts.length >= 12 || last?.error?.startsWith('Délai maximal')
        ? 'BLOQUE'
        : last
          ? 'ATTENTE_ELEVE'
          : 'RECEPTION'
  return (
    <section className="panel">
      <p className="section-label">L08-A01</p>
      <h2>Atelier Python et tutorat</h2>
      <label className="field">
        Scénario
        <select value={index} onChange={(e) => reset(+e.target.value)}>
          {cases.map((c, i) => (
            <option key={c.title} value={i}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <p>
        <strong>Objectif.</strong> {scenario.task}
      </p>
      <p>
        Oracle : <code>{scenario.result.replaceAll('\n', ' ↵ ')}</code>
      </p>
      <label className="field" htmlFor="python-code">
        Éditeur Python
      </label>
      <div className="editor">
        <pre ref={color} aria-hidden="true">
          {highlight(code + '\n')}
        </pre>
        <textarea
          id="python-code"
          ref={editor}
          rows={8}
          wrap="off"
          maxLength={12000}
          value={code}
          onScroll={(e) => {
            if (color.current) {
              color.current.scrollTop = e.currentTarget.scrollTop
              color.current.scrollLeft = e.currentTarget.scrollLeft
            }
          }}
          onChange={(e) => {
            setCode(e.target.value)
            setVerified(false)
          }}
          spellCheck={false}
        />
      </div>
      <label className="radio">
        <input
          type="checkbox"
          checked={permission}
          onChange={(e) => {
            setPermission(e.target.checked)
            if (!e.target.checked && busy) {
              stop()
              setBusy(false)
              setMessage('Exécution arrêtée après retrait de l’autorisation.')
            }
          }}
        />
        Autoriser l’exécution de ce code dans mon navigateur
      </label>
      <div className="actions">
        <button
          className="primary"
          disabled={busy || attempts.length >= 12}
          onClick={() =>
            permission ? run() : setMessage('Autorisation d’exécution requise.')
          }
        >
          Exécuter
        </button>
        <button onClick={() => reset(index)}>Réinitialiser l’atelier</button>
      </div>
      <p role="status">
        {message} État : {state}. Essais : {attempts.length}/12.
      </p>
      <div className="split">
        <div>
          <h3>Console · observation réelle</h3>
          <pre aria-label="Sortie Python" aria-live="polite">
            {last
              ? [
                  last.stdout,
                  last.stderr,
                  last.error,
                  last.truncated ? '[sortie tronquée]' : '',
                ]
                  .filter(Boolean)
                  .join('\n') || '[aucune sortie]'
              : '[aucune exécution]'}
          </pre>
        </div>
        <div>
          <h3>Question de MicroAlbert</h3>
          <p className="fiction">Scénario prédéfini</p>
          <p>
            {matched
              ? scenario.verify
              : last
                ? scenario.hint
                : 'Que prévois-tu de voir dans la console ?'}
          </p>
          {last && !matched && (
            <>
              <button
                onClick={() => setHint((n) => Math.min(2, n + 1))}
                disabled={hint >= 2}
              >
                Afficher un indice
              </button>
              {hint >= 1 && (
                <p>
                  Compare la trace obtenue et l’oracle. Le défaut est visible
                  sur le cas de départ (
                  {scenario.observed.replaceAll('\n', ' ↵ ')}).
                </p>
              )}
              {hint >= 2 && (
                <p>
                  Repère la première instruction où l’observation s’écarte de ce
                  que tu avais prévu, puis propose un test pour la vérifier.
                </p>
              )}
            </>
          )}
        </div>
      </div>
      {matched && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const ok = scenario.key.test(answer)
            setVerified(ok)
            setMessage(
              ok
                ? 'Sortie conforme et explication compatible avec la grille.'
                : 'La grille attend une explication plus précise.',
            )
          }}
        >
          <label className="field">
            Expliquez votre correction
            <textarea
              rows={2}
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value)
                setVerified(false)
              }}
              required
              maxLength={1000}
            />
          </label>
          <button type="submit">Vérifier la compréhension</button>
          <p className="muted">
            Grille formative par mots-clés. La validation humaine permet de
            confirmer le raisonnement.
          </p>
        </form>
      )}
      <details>
        <summary>Historique des essais</summary>
        <ol>
          {attempts.map((a, i) => (
            <li key={i}>
              <pre>
                {a.error || a.stdout || a.stderr || '[aucune sortie]'}
                {a.truncated ? ' [sortie tronquée]' : ''}
              </pre>
            </li>
          ))}
        </ol>
      </details>
      <details>
        <summary>Cours et exercice guidé</summary>
        <p>
          Une boucle bornée parcourt une séquence. Une affectation remplace la
          valeur d’une variable. Un accès par indice exige une position valide.
          Une fonction récursive exige un cas de base. Lancez le programme
          fourni, décrivez l’écart, modifiez une seule instruction puis vérifiez
          le résultat.
        </p>
        <a href="https://docs.python.org/fr/3/tutorial/controlflow.html">
          Contrôle du flux · documentation Python
        </a>
      </details>
      <p>
        <a href="#progression">Tableau de progression</a>
      </p>
    </section>
  )
}
