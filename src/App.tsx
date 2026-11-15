import { CameraControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { ARTIFACTS, WORLD_META, byId, type Artifact, type World } from './data/artifacts'
import { ASSET_CREDITS, CHALLENGE_URL, RESOURCES } from './data/resources'
import { preloadModels } from './scene/Models'
import { ArtifactStage, DeepSpace, Globe, Hub } from './scene/Worlds'
import { CruiseScene, EntryScene, FlybyScene, InteriorScene, LaunchScene, OrbitScene, TransitScene } from './scene/Cinematic'
import { playback, resetMotion } from './scene/motionState'
import type { Beat, Phase } from './data/missions'
import { Hud } from './Hud'
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
  const [replay, setReplay] = useState(0)
  const [playing, setPlaying] = useState(true)
  playback.paused = !playing

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
    setPlaying(true)
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
          {current && <MissionScene key={current.id + ':' + Math.min(chapter, current.chapters.length - 1) + ':' + replay} a={current} beat={current.chapters[Math.min(chapter, current.chapters.length - 1)]} replay={replay} />}
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
        <>
          <Hud a={current} beat={current.chapters[Math.min(chapter, current.chapters.length - 1)]} idx={chapter * 1000 + replay} />
          <div className="scene-fade" key={current.id + chapter + ':' + replay} />
        </>
      )}
      {current && (
        <StoryPanel
          playing={playing}
          setPlaying={setPlaying}
          replay={replay}
          onReplay={() => setReplay((r) => r + 1)}
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
          deep space. Each one has a story. Fly to a world, find the glowing ghost signals, and watch each machine's whole mission: from launch on Earth, across space, to its landing, its discoveries, and where it rests today. Told in its own words.
        </p>
        <button className="cta" onClick={onGo} autoFocus>
          Begin exploring
        </button>
        <p className="hint">Stories play like a film · pause any time to orbit the 3D scene · ← → skip scenes · Esc to go back</p>
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
              ▶ Watch the full mission
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

/* ───────────── mission playback ───────────── */
function MissionScene({ a, beat, replay }: { a: Artifact; beat: Beat; replay: number }) {
  useMemo(() => resetMotion(), [a.id, beat, replay]) // eslint-disable-line
  switch (beat.scene) {
    case 'launch':
      return <LaunchScene a={a} beat={beat} />
    case 'cruise':
      return <CruiseScene a={a} beat={beat} />
    case 'entry':
      return <EntryScene a={a} beat={beat} />
    case 'orbit':
      return <OrbitScene a={a} beat={beat} />
    case 'flyby':
      return <FlybyScene a={a} beat={beat} />
    case 'interior':
      return <InteriorScene beat={beat} />
    case 'transit':
      return <TransitScene beat={beat} />
    default:
      return <ArtifactStage a={a} beat={beat} replay={replay} />
  }
}

const MIN_DUR: Partial<Record<string, number>> = {
  launch: 21, cruise: 16, entry: 14, orbit: 12, flyby: 16, interior: 12, transit: 14,
  land: 10, bounce: 11, airbag: 10, skycrane: 14, dropoff: 12, fly: 15, liftoff: 12, deploy: 7, crash: 11, driveIn: 9,
}
function beatDuration(b: Beat) {
  const words = b.text.split(/\s+/).length
  const read = words / 2.7 + 2.5
  const min = (b.scene === 'stage' ? MIN_DUR[b.act ?? ''] : MIN_DUR[b.scene]) ?? 9
  return Math.max(read, min)
}

const PHASES: Phase[] = ['Launch', 'Cruise', 'Arrival', 'Mission', 'Discovery', 'Legacy', 'Today']

/* speech */
function speak(text: string, onEnd?: () => void) {
  try {
    const s = window.speechSynthesis
    s.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.98
    u.pitch = 0.95
    if (onEnd) u.onend = onEnd
    s.speak(u)
  } catch {
    onEnd?.()
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
  playing,
  setPlaying,
  replay,
  onReplay,
}: {
  a: Artifact
  chapter: number
  setChapter: (n: number) => void
  onBack: () => void
  onComplete: () => void
  done: boolean
  playing: boolean
  setPlaying: (b: boolean) => void
  replay: number
  onReplay: () => void
}) {
  const total = a.chapters.length
  const onQuiz = chapter >= total
  const ch = a.chapters[Math.min(chapter, total - 1)]
  const [narrate, setNarrate] = useState(false)
  const [pick, setPick] = useState<number | null>(null)
  const dur = beatDuration(ch)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => setPick(null), [a.id])

  // auto-advance: wait for the scene's minimum time and (if narrating) the end of speech
  useEffect(() => {
    if (onQuiz) {
      stopSpeech()
      return
    }
    let timeDone = false
    let speechDone = !narrate
    let cancelled = false
    const next = () => {
      if (!cancelled && timeDone && speechDone && playing) setChapter(chapter + 1)
    }
    if (narrate)
      speak(`${ch.title}. ${ch.text}`, () => {
        speechDone = true
        next()
      })
    else stopSpeech()
    const id = window.setTimeout(() => {
      timeDone = true
      next()
    }, dur * 1000)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [chapter, playing, narrate, replay, a.id]) // eslint-disable-line
  useEffect(() => () => stopSpeech(), [])

  const phaseIdx = PHASES.indexOf(ch.phase)

  return (
    <aside className={'story' + (collapsed ? ' collapsed' : '')} aria-label={`Story of ${a.name}`}>
      <div className="story-head">
        <button className="back" onClick={onBack}>
          ← Back to map
        </button>
        <button className="collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand story' : 'Collapse story'}>
          {collapsed ? '▴' : '▾'}
        </button>
      </div>
      <h2>{a.name}</h2>
      <p className="tagline">“{a.tagline}”</p>

      <ol className="phases" aria-label="Mission phases">
        {PHASES.map((p, i) => {
          const first = a.chapters.findIndex((b) => b.phase === p)
          if (first < 0) return null
          return (
            <li key={p} className={(i === phaseIdx && !onQuiz ? 'on ' : '') + (i < phaseIdx || onQuiz ? 'past' : '')}>
              <button onClick={() => setChapter(first)}>{p}</button>
            </li>
          )
        })}
      </ol>

      <div className="beats" role="tablist" aria-label="Story beats">
        {a.chapters.map((b, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={chapter === i}
            className={chapter === i ? 'on' : i < chapter ? 'past' : ''}
            onClick={() => setChapter(i)}
            title={`${b.phase}: ${b.title}`}
          >
            {chapter === i && !onQuiz && (
              <i className="fill" key={chapter + ':' + replay} style={{ animationDuration: dur + 's', animationPlayState: playing ? 'running' : 'paused' }} />
            )}
          </button>
        ))}
        <button role="tab" aria-selected={onQuiz} className={'quiz-tab ' + (onQuiz ? 'on' : '')} onClick={() => setChapter(total)} title="Mission check">
          ?
        </button>
      </div>

      {!onQuiz ? (
        <article className="chapter" key={a.id + chapter}>
          <p className="voice">
            {a.voice} · {chapter + 1}/{total}
          </p>
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
              {pick === a.quiz.answer ? `Correct. ${a.voice} is now in your ghost fleet log.` : 'Not quite. Replay the story and try again.'}
              {pick !== a.quiz.answer && (
                <button className="link" onClick={() => setPick(null)}>
                  Retry
                </button>
              )}
            </p>
          )}
          {done && pick === null && <p className="verdict">Already in your log ◉</p>}
          <button className="ghost-btn" style={{ marginTop: 12 }} onClick={() => setChapter(0)}>
            ↺ Watch again from launch
          </button>
        </article>
      )}

      <div className="player">
        <button className="ghost-btn icon" disabled={chapter === 0} onClick={() => setChapter(chapter - 1)} aria-label="Previous">
          ⏮
        </button>
        <button className="cta play" onClick={() => setPlaying(!playing)} aria-pressed={playing} disabled={onQuiz}>
          {playing ? '❚❚ Pause' : '▶ Play'}
        </button>
        <button className="ghost-btn icon" disabled={chapter >= total} onClick={() => setChapter(chapter + 1)} aria-label="Next">
          ⏭
        </button>
        <button className="ghost-btn icon" onClick={onReplay} disabled={onQuiz} aria-label="Replay this scene" title="Replay scene">
          ↻
        </button>
        <button className={'ghost-btn' + (narrate ? ' active' : '')} onClick={() => setNarrate(!narrate)} aria-pressed={narrate}>
          {narrate ? '■ Voice' : '🔊 Voice'}
        </button>
      </div>

      <details className="drawer">
        <summary>Mission data</summary>
        <dl className="facts">
          <div>
            <dt>Rocket</dt>
            <dd>{a.mission.rocketName}</dd>
          </div>
          <div>
            <dt>Launch site</dt>
            <dd>{a.mission.site}</dd>
          </div>
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
