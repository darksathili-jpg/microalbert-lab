import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { labs, quiz } from './data'
import { question } from './science'
import { Lab1, Lesson1 } from './lab1'
import { activities, lessons, summaries } from './other'
import '@fontsource-variable/inter/wght.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './style.css'

const icons: Record<string, string> = {
  home: 'm3 11 9-8 9 8 M5 10v10h5v-6h4v6h5V10',
  cap: 'm2 9 10-5 10 5-10 5z M6 11v5q6 5 12 0v-5 M22 9v7',
  flask: 'M9 3h6m-5 0v7L4 19q-1 2 2 2h12q3 0 2-2l-6-9V3 M7 15h10',
  bot: 'M12 3v4 M5 8h14l2 4v6H3v-6z M8 12v2m8-2v2m-6 2h4',
  book: 'M12 6v15 M2 4q5-1 10 2 5-3 10-2v15q-5-1-10 2-5-3-10-2z',
  target: 'M21 11a9 9 0 1 1-8-8 M17 11a5 5 0 1 1-4-4 M12 12l8-8h3m-3 0V1',
  chart: 'M3 21h18 M5 18V9h3v9 M10 18V5h3v13 M16 18V2h3v16',
  gear: 'M11 2h2l1 3 3 1 3-1 1 2-2 2v4l2 2-1 2-3-1-3 1-1 3h-2l-1-3-3-1-3 1-1-2 2-2V9L3 7l1-2 3 1 3-1z M15 11a3 3 0 1 1-6 0 3 3 0 1 1 6 0',
  layers: 'm2 7 10-5 10 5-10 5z M2 12l10 5 10-5 M2 17l10 5 10-5',
  network:
    'm5 18 7-13 7 13z M5 18h14 M12 5v13 M5 18a2 2 0 1 0 0 .1m14-.1a2 2 0 1 0 0 .1M12 5a2 2 0 1 0 0 .1',
  message: 'M4 4h16v13h-9l-5 4v-4H4z M8 10h1m3 0h1m3 0h1',
  database:
    'M3 5a9 3 0 1 0 18 0 9 3 0 1 0-18 0 M3 5v14a9 3 0 1 0 18 0V5 M3 12a9 3 0 0 0 18 0',
  rocket:
    'M7 16c0-7 5-12 14-13-1 9-6 14-13 14z M8 11H4l-2 5h5m6 0v4l-5 2v-5 M5 19l-3 3m15-13a2 2 0 1 0-4 0 2 2 0 1 0 4 0',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20',
  sun: 'M12 4V1m0 22v-3M4 12H1m22 0h-3M6 6 4 4m16 16-2-2m0-12 2-2M4 20l2-2m11-6a5 5 0 1 1-10 0 5 5 0 1 1 10 0',
  search: 'M16 16l5 5 M17 10a7 7 0 1 1-14 0 7 7 0 1 1 14 0',
  play: 'm8 4 12 8-12 8z',
}
function Icon({ name }: { name: string }) {
  return (
    <svg
      className="icon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={icons[name] ?? icons.layers} />
    </svg>
  )
}
const sprite = import.meta.env.BASE_URL + 'microalbert.png'
type Mode = 'sombre' | 'clair' | 'vidéoprojecteur'
type Progress = { version: 1; completed: number[]; last: number }
const initial: Progress = { version: 1, completed: [], last: 1 }
function parse(data: unknown): Progress {
  const p = data as Progress | null
  if (
    !p ||
    p.version !== 1 ||
    !Array.isArray(p.completed) ||
    p.completed.some((x) => !Number.isInteger(x) || x < 1 || x > 8) ||
    !Number.isInteger(p.last) ||
    p.last < 1 ||
    p.last > 8
  )
    throw new Error('Format de progression invalide.')
  return { version: 1, completed: [...new Set(p.completed)], last: p.last }
}
function stored() {
  try {
    return parse(
      JSON.parse(localStorage.getItem('microalbert-progression') ?? 'null'),
    )
  } catch {
    return initial
  }
}
function route() {
  return location.hash.slice(1) || 'accueil'
}
function LabQuiz({
  index,
  done,
  onPass,
}: {
  index: number
  done: boolean
  onPass: () => void
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [evaluated, setEvaluated] = useState(false)
  const score = quiz[index].filter((q, i) => answers[i] === q.correct).length
  return (
    <section id="evaluation" className="panel">
      <h2>Évaluation et transfert</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setEvaluated(true)
          if (score === quiz[index].length) onPass()
        }}
      >
        {quiz[index].map((q, i) => (
          <fieldset key={q.prompt}>
            <legend>{q.prompt}</legend>
            {q.options.map((opt, j) => (
              <label className="radio" key={opt}>
                <input
                  type="radio"
                  name={`quiz-${i}`}
                  value={j}
                  required
                  checked={answers[i] === j}
                  onChange={() => {
                    setAnswers({ ...answers, [i]: j })
                    setEvaluated(false)
                  }}
                />
                {opt}
              </label>
            ))}
            {evaluated && (
              <p className={answers[i] === q.correct ? 'good' : 'feedback'}>
                {answers[i] === q.correct ? 'Correct.' : 'À revoir.'} {q.why}
              </p>
            )}
          </fieldset>
        ))}
        <button className="primary" type="submit">
          Vérifier les réponses
        </button>{' '}
        <span role="status">
          {evaluated
            ? `${score}/${quiz[index].length} · ${score === quiz[index].length ? 'Séance validée' : 'Vous pouvez réessayer.'}`
            : done
              ? 'Séance validée'
              : ''}
        </span>
      </form>
    </section>
  )
}
function Brain() {
  return (
    <svg viewBox="0 0 330 210" className="brain" aria-hidden="true">
      <defs>
        <radialGradient id="halo">
          <stop stopColor="#1471b5" stopOpacity=".65" />
          <stop offset="1" stopColor="#1471b5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="166" cy="111" rx="150" ry="105" fill="url(#halo)" />
      <g fill="none" stroke="#4fd6ff" strokeWidth="1.4">
        <ellipse cx="166" cy="187" rx="75" ry="13" />
        <ellipse cx="166" cy="187" rx="54" ry="8" />
        <path d="M166 60c-22-26-51-5-53 8-22 3-34 30-24 45 1 22 28 33 51 29l26 30 14-32c20 10 50-3 51-22 16-17 1-42-11-45-7-26-36-33-54-13ZM166 60v111m-53-103 28 47 25-55 28 43 26-30m-131 40 52 2 39 25 51-22-37-15-53 12m-28-47 53 34 54-29m-80 69 26-40 14 38" />
        {[
          [113, 68],
          [141, 115],
          [166, 102],
          [194, 103],
          [220, 73],
          [180, 140],
          [89, 113],
          [231, 118],
          [166, 60],
        ].map(([x, y]) => (
          <circle key={x + ':' + y} cx={x} cy={y} r="4" fill="#b9f6ff" />
        ))}
      </g>
      <g fill="#deefff" fontSize="12" fontWeight="700">
        <text x="13" y="26">
          Données
        </text>
        <text x="230" y="37">
          Entraînement
        </text>
        <text x="236" y="145">
          Post-entraînement
        </text>
        <text x="24" y="153">
          LLM
        </text>
      </g>
    </svg>
  )
}
function App() {
  const [page, setPage] = useState(route)
  const [progress, setProgress] = useState(stored)
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState<Mode>(() => {
    try {
      const m = localStorage.getItem('microalbert-mode')
      return m === 'clair' || m === 'vidéoprojecteur' ? m : 'sombre'
    } catch {
      return 'sombre'
    }
  })
  const [search, setSearch] = useState('')
  const [nav, setNav] = useState(false)
  const id = /^laboratoire-[1-8]$/.test(page) ? Number(page.at(-1)) : 0
  useEffect(() => {
    const change = () => {
      setPage(route())
      setNav(false)
      setSearch('')
      document.querySelector<HTMLElement>('main')?.focus()
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  useEffect(() => {
    if (id) setProgress((p) => (p.last === id ? p : { ...p, last: id }))
  }, [id])
  useEffect(() => {
    try {
      localStorage.setItem('microalbert-progression', JSON.stringify(progress))
    } catch {
      setNotice(
        'Le stockage local est indisponible. Vous pouvez exporter votre progression.',
      )
    }
  }, [progress])
  useEffect(() => {
    document.documentElement.dataset.mode = mode
    try {
      localStorage.setItem('microalbert-mode', mode)
    } catch {}
  }, [mode])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('#search')?.focus()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  const map = (
    <div className="lab-map">
      {labs.map((lab, i) => (
        <a
          className={
            'lab-tile ' +
            (progress.completed.includes(i + 1) ? 'complete ' : '') +
            (progress.last === i + 1 ? 'current' : '')
          }
          key={lab[0]}
          href={`#laboratoire-${i + 1}`}
        >
          <strong>{i + 1}</strong>
          {progress.completed.includes(i + 1) && (
            <span className="tick" aria-label="Validé">
              ✓
            </span>
          )}
          <Icon name={lab[2]} />
          <span>{lab[1]}</span>
        </a>
      ))}
    </div>
  )
  function saveFile() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(progress, null, 2)], {
        type: 'application/json',
      }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'microalbert-progression.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Progression exportée.')
  }
  let content: ReactNode
  if (id) {
    const i = id - 1
    content = (
      <>
        <div className="breadcrumb">
          <a href="#parcours">Parcours</a>{' '}
          <span> / Laboratoire {String(id).padStart(2, '0')}</span>
        </div>
        <div className="lesson-hero">
          <div>
            <p className="section-label">
              Laboratoire {String(id).padStart(2, '0')}
            </p>
            <h1>{labs[i][0]}</h1>
            <p>{question}</p>
          </div>
          <img src={sprite} alt="" />
        </div>
        <section className="intro panel">
          <div>
            <h2>Objectifs d’apprentissage</h2>
            <p>{labs[i][3]}</p>
          </div>
          <div>
            <h2>Prérequis</h2>
            <p>{labs[i][4]}</p>
          </div>
        </section>
        <section className="panel lesson">
          <h2>Comprendre et démontrer</h2>
          {i === 0 ? <Lesson1 /> : lessons[i]}
        </section>
        <div key={'experience-' + id}>{i === 0 ? <Lab1 /> : activities[i]}</div>
        <LabQuiz
          key={'quiz-' + id}
          index={i}
          done={progress.completed.includes(id)}
          onPass={() =>
            setProgress((p) =>
              p.completed.includes(id)
                ? p
                : { ...p, completed: [...p.completed, id] },
            )
          }
        />
        <section className="panel">
          <h2>Synthèse</h2>
          <p>{summaries[i]}</p>
          <a
            className="button"
            href={id < 8 ? `#laboratoire-${id + 1}` : '#progression'}
          >
            {labs[i][5]} →
          </a>
        </section>
      </>
    )
  } else if (page === 'accueil') {
    content = (
      <>
        <section className="hero">
          <div>
            <h1>
              Bienvenue dans
              <br /> MicroAlbert
            </h1>
            <p>
              Comprendre, expérimenter et construire un assistant pédagogique en
              numérique et sciences informatiques (NSI).
            </p>
            <div className="actions">
              <a
                className="button primary"
                href={`#laboratoire-${progress.last}`}
              >
                <Icon name="play" />
                {progress.completed.length || progress.last !== 1
                  ? 'Reprendre le parcours'
                  : 'Commencer le parcours'}
              </a>
              <a className="button" href="#parcours">
                <Icon name="network" />
                Explorer la carte
              </a>
            </div>
          </div>
          <div className="hero-art">
            <span className="mascot" role="img" aria-label="MicroAlbert" />
            <Brain />
          </div>
        </section>
        <div className="path-head">
          <h2>Votre parcours · 8 séances</h2>
          <label>
            Progression globale{' '}
            <progress value={progress.completed.length} max={8} />
            <strong>
              {Math.round((progress.completed.length / 8) * 100)} %
            </strong>
          </label>
        </div>
        {map}
        <div className="shortcuts">
          {[
            ['flask', 'Expérimenter', 'Simulations interactives', '#ateliers'],
            [
              'message',
              'Dialoguer avec MicroAlbert',
              'Tutorat guidé par des indices',
              '#laboratoire-8',
            ],
            [
              'code',
              'Coder et tester',
              'Exécution de Python dans le navigateur',
              '#laboratoire-8',
            ],
            [
              'target',
              'Évaluer vos acquis',
              'Quiz, corrections et progression',
              '#progression',
            ],
          ].map(([ico, title, desc, href]) => (
            <a key={title} className="shortcut" href={href}>
              <Icon name={ico} />
              <div>
                <strong>{title}</strong>
                <p>{desc}</p>
              </div>
            </a>
          ))}
        </div>
        <section className="panel thread">
          <h2>Le fil conducteur</h2>
          <p>{question}</p>
        </section>
      </>
    )
  } else if (page === 'progression' || page === 'parametres') {
    content = (
      <>
        <h1>{page === 'progression' ? 'Tableau de bord' : 'Paramètres'}</h1>
        <section className="panel">
          <h2>Progression locale</h2>
          <p>{progress.completed.length} séance(s) validée(s) sur 8.</p>
          {map}
          <div className="actions">
            <button onClick={saveFile}>Exporter la progression</button>
            <label className="field">
              Importer une progression JSON
              <input
                type="file"
                accept=".json,application/json"
                onChange={async (e) => {
                  const input = e.currentTarget
                  const file = input.files?.[0]
                  if (!file) return
                  try {
                    if (file.size > 32768) throw new Error()
                    setProgress(parse(JSON.parse(await file.text())))
                    setNotice('Progression importée.')
                  } catch {
                    setNotice(
                      'Ce fichier ne contient pas une progression MicroAlbert valide.',
                    )
                  }
                  input.value = ''
                }}
              />
            </label>
          </div>
          <p role="status">{notice}</p>
        </section>
      </>
    )
  } else if (page === 'ressources') {
    content = (
      <>
        <h1>Ressources</h1>
        <section className="panel">
          <h2>Fil conducteur</h2>
          <p>{question}</p>
          <p>NSI signifie « numérique et sciences informatiques ».</p>
          <h2>Références</h2>
          <ul>
            <li>
              <a href="https://eduscol.education.fr/2068/programmes-et-ressources-en-numerique-et-sciences-informatiques-voie-g">
                Programmes et ressources de NSI · Éduscol
              </a>
            </li>
            <li>
              <a href="https://arxiv.org/abs/1706.03762">
                Attention Is All You Need · Vaswani et al., 2017
              </a>
            </li>
            <li>
              <a href="https://docs.python.org/fr/3/tutorial/controlflow.html">
                Contrôle du flux · Documentation Python
              </a>
            </li>
          </ul>
        </section>
      </>
    )
  } else {
    content = (
      <>
        <h1>{page === 'ateliers' ? 'Ateliers pratiques' : 'Parcours guidé'}</h1>
        <p>{question}</p>
        {map}
        <div className="catalog">
          {labs.map((lab, i) => (
            <a className="panel" key={lab[0]} href={`#laboratoire-${i + 1}`}>
              <Icon name={lab[2]} />
              <h2>{lab[0]}</h2>
              <p>{lab[3]}</p>
            </a>
          ))}
        </div>
      </>
    )
  }
  const matches = search.trim()
    ? labs
        .map((l, i) => ({ title: l[0], i }))
        .filter((r) =>
          r.title
            .toLocaleLowerCase('fr')
            .normalize('NFD')
            .replace(/\p{M}/gu, '')
            .includes(
              search
                .trim()
                .toLocaleLowerCase('fr')
                .normalize('NFD')
                .replace(/\p{M}/gu, ''),
            ),
        )
    : []
  return (
    <>
      <a
        className="skip"
        href="#contenu"
        onClick={(e) => {
          e.preventDefault()
          document.querySelector('main')?.focus()
        }}
      >
        Aller au contenu
      </a>
      <header className="mast">
        <Icon name="cap" />
        <div>
          <a href="#accueil">
            MicroAlbert <span>— Du token à l’agent IA</span>
          </a>
          <p>
            Comprendre, expérimenter et construire un assistant pédagogique
            intelligent
          </p>
        </div>
      </header>
      <div className="shell">
        <aside>
          <a className="brand" href="#accueil">
            <img src={sprite} alt="" />
            <span>
              <strong>MicroAlbert</strong>
              <small>NSI · IA · LLM</small>
            </span>
          </a>
          <button
            className="nav-toggle"
            onClick={() => setNav(!nav)}
            aria-controls="navigation"
            aria-expanded={nav}
          >
            Navigation
          </button>
          <nav
            id="navigation"
            aria-label="Navigation principale"
            className={nav ? 'opened' : ''}
          >
            {[
              ['home', 'Accueil', 'accueil'],
              ['cap', 'Parcours guidé', 'parcours'],
              ['flask', 'Ateliers pratiques', 'ateliers'],
              ['bot', 'Agent pédagogique', 'laboratoire-8'],
              ['book', 'Ressources', 'ressources'],
              ['target', 'Évaluations', 'progression'],
              ['gear', 'Paramètres', 'parametres'],
            ].map(([ico, title, path]) => (
              <a
                key={path}
                href={'#' + path}
                aria-current={page === path ? 'page' : undefined}
              >
                <Icon name={ico} />
                {title}
              </a>
            ))}
          </nav>
        </aside>
        <div className="body">
          <div className="toolbar">
            <div className="search">
              <Icon name="search" />
              <input
                id="search"
                type="search"
                aria-label="Rechercher une notion ou un atelier"
                placeholder="Rechercher une notion, un atelier…"
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearch('')
                  if (e.key === 'Enter' && matches.length) {
                    location.hash = 'laboratoire-' + (matches[0].i + 1)
                    setSearch('')
                  }
                }}
              />
              <kbd>Ctrl + K</kbd>
              {search.trim() && (
                <ul className="search-results">
                  {matches.length ? (
                    matches.map((r) => (
                      <li key={r.i}>
                        <a
                          href={`#laboratoire-${r.i + 1}`}
                          onClick={() => setSearch('')}
                        >
                          {r.title}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li>Aucune séance trouvée</li>
                  )}
                </ul>
              )}
            </div>
            <label className="theme">
              <Icon name="sun" />
              <span>Affichage</span>
              <select
                aria-label="Mode d’affichage"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
              >
                <option value="sombre">Sombre</option>
                <option value="clair">Clair</option>
                <option value="vidéoprojecteur">Vidéoprojecteur</option>
              </select>
            </label>
          </div>
          <main tabIndex={-1} id="contenu">
            {content}
          </main>
        </div>
      </div>
      <footer>MicroAlbert · Du token à l’agent IA</footer>
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
