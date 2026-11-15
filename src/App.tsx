import { CameraControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { ARTIFACTS, WORLD_META, byId, type Artifact, type World } from './data/artifacts'
import { ASSET_CREDITS, CHALLENGE_URL, RESOURCES } from './data/resources'
import { preloadModels } from './scene/Models'
import { ArtifactStage, DeepSpace, Globe, Hub } from './scene/Worlds'
import './App.css'

type View = { mode: 'hub' } | { mode: 'world'; world: World } | { mode: 'artifact'; id: string; from: World }

const KEY = 'ghostfleet.visited.v1'
function loadVisited(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'))
  } catch {
    return new Set()
  }
}

preloadModels([...new Set(ARTIFACTS.flatMap((a) => (a.model.type === 'glb' ? [a.model.url] : [])))])

export default function App() {
  const [view, setView] = useState<View>({ mode: 'hub' })
  const [selected, setSelected] = useState<string | null>(null)
  const [chapter, setChapter] = useState(0)
  const [visited, setVisited] = useState<Set<string>>(loadVisited)
  const [showSources, setShowSources] = useState(false)
  const [intro, setIntro] = useState(true)

  const markVisited = useCallback((id: string) => {
    setVisited((prev) => {
      if (prev.has(id)) return prev
      const n = new Set(prev).add(id)
      try {
        localStorage.setItem(KEY, JSON.stringify([...n]))
      } catch {
        /* ignore */
      }
      return n
    })
  }, [])

  const goWorld = (w: World) => {
    setSelected(null)
    setView({ mode: 'world', world: w })
  }
  const openArtifact = (id: string) => {
    const a = byId(id)
    setChapter(0)
    setView({ mode: 'artifact', id, from: a.world })
  }
  const back = () => {
    stopSpeech()
    if (view.mode === 'artifact') {
      setSelected(view.id)
      setView({ mode: 'world', world: view.from })
    } else setView({ mode: 'hub' })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSources) setShowSources(false)
        else if (view.mode !== 'hub') back()
      }
      if (view.mode === 'artifact') {
        const a = byId(view.id)
        if (e.key === 'ArrowRight') setChapter((c) => Math.min(c + 1, a.chapters.length))
        if (e.key === 'ArrowLeft') setChapter((c) => Math.max(c - 1, 0))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // eslint-disable-line

  const current = view.mode === 'artifact' ? byId(view.id) : null

  return (
    <div className="app">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.2, 11], fov: 45, near: 0.05, far: 2000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onPointerMissed={() => view.mode === 'world' && setSelected(null)}
      >
        <color attach="background" args={['#03050a']} />
        <CameraControls
          makeDefault
          minDistance={view.mode === 'artifact' ? 2.2 : view.mode === 'world' && view.world !== 'deep' ? 3.1 : 3}
          maxDistance={view.mode === 'artifact' ? 22 : 45}
          maxPolarAngle={current && (current.backdrop === 'moon' || current.backdrop === 'mars') ? Math.PI / 2.05 : Math.PI}
          smoothTime={0.6}
        />
        <Suspense fallback={null}>
          {view.mode === 'hub' && <Hub onWorld={goWorld} visited={visited} />}
          {view.mode === 'world' && view.world !== 'deep' && (
            <Globe world={view.world} selected={selected} onSelect={setSelected} visited={visited} />
          )}
          {view.mode === 'world' && view.world === 'deep' && (
            <DeepSpace selected={selected} onSelect={setSelected} visited={visited} />
          )}
          {current && <ArtifactStage a={current} chapter={Math.min(chapter, current.chapters.length - 1)} />}
        </Suspense>
      </Canvas>

      <TopBar
        view={view}
        onHome={() => {
          stopSpeech()
          setView({ mode: 'hub' })
        }}
        onWorld={goWorld}
        visitedCount={visited.size}
        onSources={() => setShowSources(true)}
      />

      {view.mode === 'hub' && <HubOverlay onOpen={openArtifact} visited={visited} />}
      {view.mode === 'world' && (
        <WorldPanel world={view.world} selected={selected} onSelect={setSelected} onOpen={openArtifact} visited={visited} />
      )}
      {current && (
        <StoryPanel
          a={current}
          chapter={chapter}
          setChapter={setChapter}
          onBack={back}
          onComplete={() => markVisited(current.id)}
          done={visited.has(current.id)}
        />
      )}
      {showSources && <Sources onClose={() => setShowSources(false)} />}
      {intro && view.mode === 'hub' && <Intro onGo={() => setIntro(false)} />}
    </div>
  )
}

/* ───────────── UI pieces ───────────── */

function TopBar({
  view,
  onHome,
  onWorld,
  visitedCount,
  onSources,
}: {
  view: View
  onHome: () => void
  onWorld: (w: World) => void
  visitedCount: number
  onSources: () => void
}) {
  return (
    <header className="topbar">
      <button className="brand" onClick={onHome} aria-label="Home">
        <span className="brand-mark" aria-hidden>
          ◎
        </span>
        <span>
          <b>GHOST FLEET</b>
          <small>abandoned, not forgotten</small>
        </span>
      </button>
      <nav className="crumbs" aria-label="Breadcrumb">
        {view.mode !== 'hub' && (
          <>
            <span className="sep">/</span>
            <button onClick={() => onWorld(view.mode === 'world' ? view.world : view.from)}>
              {WORLD_META[view.mode === 'world' ? view.world : view.from].label}
            </button>
          </>
        )}
        {view.mode === 'artifact' && (
          <>
            <span className="sep">/</span>
            <span className="here">{byId(view.id).name}</span>
          </>
        )}
      </nav>
      <div className="top-right">
        <span className="badge" title="Stories completed">
          <span className="dot" /> {visitedCount}/{ARTIFACTS.length} ghosts found
        </span>
        <button className="ghost-btn" onClick={onSources}>
          Sources
        </button>
      </div>
    </header>
  )
}

function Intro({ onGo }: { onGo: () => void }) {
  return (
    <div className="intro" role="dialog" aria-modal="true" aria-labelledby="intro-h">
      <div className="intro-card">
        <p className="eyebrow">Transmission received</p>
        <h1 id="intro-h">
          They finished their missions.
          <br />
          <em>They never came home.</em>
        </h1>
        <p>
          Since 1966, NASA has left rovers, landers, science stations and probes on the Moon, on Mars and drifting through
          deep space. Each one has a story. Fly to a world, find the glowing ghost signals, and let the machines tell you
          what they discovered, in their own words.
        </p>
        <button className="cta" onClick={onGo} autoFocus>
          Begin exploring
        </button>
        <p className="hint">Drag to orbit · scroll to zoom · ← → to change chapters · Esc to go back</p>
      </div>
    </div>
  )
}

function HubOverlay({ onOpen, visited }: { onOpen: (id: string) => void; visited: Set<string> }) {
  const min = 1964, max = 2026
  // greedy lane packing so labels never overlap (label ~12% of track width)
  const sorted = useMemo(() => {
    const ends: number[] = []
    return [...ARTIFACTS]
      .sort((a, b) => a.year - b.year)
      .map((a) => {
        const x = ((a.year - min) / (max - min)) * 100
        let lane = ends.findIndex((e) => e < x)
        if (lane === -1) lane = ends.length
        ends[lane] = x + 12.5
        return { a, x, lane }
      })
  }, [])
  return (
    <>
      <div className="hub-title">
        <p className="eyebrow">Choose a destination</p>
        <h2>Where were they left behind?</h2>
      </div>
      <section className="timeline" aria-label="Timeline of artifacts">
        <div className="tl-axis">
          {[1970, 1980, 1990, 2000, 2010, 2020].map((y) => (
            <span key={y} style={{ left: `${((y - min) / (max - min)) * 100}%` }}>
              {y}
            </span>
          ))}
        </div>
        <div className="tl-track">
          {sorted.map(({ a, x, lane }) => (
            <button
              key={a.id}
              className={'tl-dot w-' + a.world + (visited.has(a.id) ? ' seen' : '')}
              style={{ left: `${x}%`, top: `${lane * 19}px` }}
              onClick={() => onOpen(a.id)}
              title={`${a.year}: ${a.name}`}
            >
              <i />
              <span>{a.name}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

function WorldPanel({
  world,
  selected,
  onSelect,
  onOpen,
  visited,
}: {
  world: World
  selected: string | null
  onSelect: (id: string | null) => void
  onOpen: (id: string) => void
  visited: Set<string>
}) {
  const list = ARTIFACTS.filter((a) => a.world === world).sort((a, b) => a.year - b.year)
  const sel = selected ? byId(selected) : null
  return (
    <>
      <aside className="world-list" aria-label={`${WORLD_META[world].label} artifacts`}>
        <p className="eyebrow">{WORLD_META[world].label}</p>
        <p className="blurb">{WORLD_META[world].blurb}</p>
        <ul>
          {list.map((a) => (
            <li key={a.id}>
              <button className={(selected === a.id ? 'on ' : '') + (visited.has(a.id) ? 'seen' : '')} onClick={() => onSelect(a.id)}>
                <span className="yr">{a.year}</span>
                <span className="nm">{a.name}</span>
                <span className="st" aria-label={visited.has(a.id) ? 'story completed' : 'not yet heard'}>
                  {visited.has(a.id) ? '◉' : '○'}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!sel && <p className="tip">Click a glowing signal{world !== 'deep' ? ' on the globe' : ''} or pick from the list.</p>}
      </aside>
      {sel && (
        <div className="preview" role="region" aria-live="polite">
          <p className="eyebrow">
            {sel.span} · {sel.where}
          </p>
          <h3>{sel.name}</h3>
          <p className="tagline">“{sel.tagline}”</p>
          <p className="status">
            <span className="pulse" /> {sel.status}
          </p>
          <div className="row">
            <button className="cta" onClick={() => onOpen(sel.id)}>
              Hear the story →
            </button>
            <button className="ghost-btn" onClick={() => onSelect(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* speech */
function speak(text: string) {
  try {
    const s = window.speechSynthesis
    s.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.95
    u.pitch = 0.9
    s.speak(u)
  } catch {
    /* unsupported */
  }
}
function stopSpeech() {
  try {
    window.speechSynthesis.cancel()
  } catch {
    /* noop */
  }
}

function StoryPanel({
  a,
  chapter,
  setChapter,
  onBack,
  onComplete,
  done,
}: {
  a: Artifact
  chapter: number
  setChapter: (n: number) => void
  onBack: () => void
  onComplete: () => void
  done: boolean
}) {
  const total = a.chapters.length
  const onQuiz = chapter >= total
  const ch = a.chapters[Math.min(chapter, total - 1)]
  const [narrate, setNarrate] = useState(false)
  const [pick, setPick] = useState<number | null>(null)

  useEffect(() => {
    setPick(null)
  }, [a.id])
  useEffect(() => {
    if (narrate && !onQuiz) speak(`${ch.title}. ${ch.text}`)
    else stopSpeech()
  }, [narrate, chapter, a.id]) // eslint-disable-line
  useEffect(() => () => stopSpeech(), [])

  return (
    <aside className="story" aria-label={`Story of ${a.name}`}>
      <button className="back" onClick={onBack}>
        ← Back to map
      </button>
      <p className="eyebrow">
        {a.span} · {a.where}
      </p>
      <h2>{a.name}</h2>
      <p className="tagline">“{a.tagline}”</p>

      <div className="chapters" role="tablist" aria-label="Chapters">
        {a.chapters.map((c, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={chapter === i}
            className={chapter === i ? 'on' : i < chapter ? 'past' : ''}
            onClick={() => setChapter(i)}
            title={c.title}
          >
            {i + 1}
          </button>
        ))}
        <button
          role="tab"
          aria-selected={onQuiz}
          className={'quiz-tab ' + (onQuiz ? 'on' : '')}
          onClick={() => setChapter(total)}
          title="Mission check"
        >
          ?
        </button>
      </div>

      {!onQuiz ? (
        <article className="chapter" key={a.id + chapter}>
          <p className="voice">{a.voice} speaking · chapter {chapter + 1} of {total}</p>
          <h3>{ch.title}</h3>
          <p className="text">{ch.text}</p>
        </article>
      ) : (
        <article className="chapter quiz" key={a.id + 'quiz'}>
          <p className="voice">Mission check</p>
          <h3>{a.quiz.q}</h3>
          <div className="opts">
            {a.quiz.options.map((o, i) => (
              <button
                key={i}
                className={pick === null ? '' : i === a.quiz.answer ? 'right' : pick === i ? 'wrong' : 'off'}
                disabled={pick !== null}
                onClick={() => {
                  setPick(i)
                  if (i === a.quiz.answer) onComplete()
                }}
              >
                {o}
              </button>
            ))}
          </div>
          {pick !== null && (
            <p className="verdict" role="status">
              {pick === a.quiz.answer
                ? `Correct. ${a.voice} has been added to your ghost fleet log.`
                : 'Not quite. Re-read the chapters and try again.'}
              {pick !== a.quiz.answer && (
                <button className="link" onClick={() => setPick(null)}>
                  Retry
                </button>
              )}
            </p>
          )}
          {done && pick === null && <p className="verdict">Already in your log ◉</p>}
        </article>
      )}

      <div className="nav-row">
        <button className="ghost-btn" disabled={chapter === 0} onClick={() => setChapter(chapter - 1)}>
          ← Prev
        </button>
        <button className={'ghost-btn' + (narrate ? ' active' : '')} onClick={() => setNarrate(!narrate)} aria-pressed={narrate}>
          {narrate ? '■ Stop voice' : '▶ Read aloud'}
        </button>
        <button className="ghost-btn" disabled={chapter >= total} onClick={() => setChapter(chapter + 1)}>
          Next →
        </button>
      </div>

      <details className="drawer" open>
        <summary>Mission data</summary>
        <dl className="facts">
          {a.facts.map((f) => (
            <div key={f.k}>
              <dt>{f.k}</dt>
              <dd>{f.v}</dd>
            </div>
          ))}
          <div>
            <dt>Status now</dt>
            <dd>{a.status}</dd>
          </div>
        </dl>
      </details>
      <details className="drawer">
        <summary>Engineering → science</summary>
        <ul className="sci">
          {a.science.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </details>
      <p className="src">
        Source:{' '}
        <a href={a.source.url} target="_blank" rel="noreferrer">
          {a.source.label} ↗
        </a>
        {a.modelNote && <span className="model-note"> · Model: {a.modelNote}</span>}
      </p>
    </aside>
  )
}

function Sources({ onClose }: { onClose: () => void }) {
  const groups = [...new Set(RESOURCES.map((r) => r.group))]
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="src-h" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <p className="eyebrow">NASA Space Apps 2026</p>
        <h2 id="src-h">Sources and resources</h2>
        <p>
          Built for the challenge{' '}
          <a href={CHALLENGE_URL} target="_blank" rel="noreferrer">
            Abandoned but not Forgotten ↗
          </a>
          . Every fact links back to these NASA resources.
        </p>
        {groups.map((g) => (
          <section key={g}>
            <h4>{g}</h4>
            <ul>
              {RESOURCES.filter((r) => r.group === g).map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.title} ↗
                  </a>
                  <span>{r.note}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section>
          <h4>3D assets</h4>
          <ul>
            {ASSET_CREDITS.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.title} ↗
                </a>
                <span>LRV, Surveyor, ALSEP and Sojourner are simplified models built for this project.</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
