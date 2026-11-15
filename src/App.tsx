import { CameraControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { ARTIFACTS, WORLD_META, byId, type Artifact, type World } from './data/artifacts'
import { ASSET_CREDITS, CHALLENGE_URL, RESOURCES } from './data/resources'
import { preloadModels } from './scene/Models'
import { ArtifactStage, DeepSpace, Globe, Hub } from './scene/Worlds'
import { CruiseScene, DsnScene, EntryScene, FlybyScene, InteriorScene, LaunchScene, LegacyScene, OrbitScene, TransitScene } from './scene/Cinematic'
import { SimClock, playback, resetMotion } from './scene/motionState'
import type { Beat } from './data/missions'
import { StoryPlayer } from './StoryPlayer'
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
  // pausing freezes the 3D world only inside a story; the home and maps keep moving
  playback.paused = view.mode === 'artifact' && !playing

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
        <SimClock />
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
      {current && <div className="scene-fade" key={current.id + chapter + ':' + replay} />}
      {current && (
        <StoryPlayer
          a={current}
          chapter={chapter}
          setChapter={setChapter}
          onBack={back}
          onComplete={() => markVisited(current.id)}
          done={visited.has(current.id)}
          playing={playing}
          setPlaying={setPlaying}
          replay={replay}
          onReplay={() => setReplay((r) => r + 1)}
          onNextMission={() => {
            const order = [...ARTIFACTS].sort((x, y) => x.year - y.year)
            const i = order.findIndex((x) => x.id === current.id)
            openArtifact(order[(i + 1) % order.length].id)
          }}
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
  const sorted = useMemo(() => [...ARTIFACTS].sort((a, b) => a.year - b.year), [])
  const worldLabel = { moon: 'Moon', mars: 'Mars', deep: 'Deep space' } as const
  return (
    <>
      <section className="hero">
        <p className="eyebrow">NASA Space Apps 2026 · Abandoned but not Forgotten</p>
        <h1>
          The machines
          <br />
          we left behind
        </h1>
        <p className="hero-sub">
          Since 1966, NASA has left landers, rovers and probes on the Moon, on Mars and across deep space. Pick a destination, or
          choose a machine below and watch its whole mission, from launch to where it rests today.
        </p>
      </section>
      <div className="nav-hint">
        <span>Drag to orbit · right-drag to pan · scroll to zoom</span>
        <button className="t-pill" onClick={() => window.dispatchEvent(new Event('ghostfleet:resetview'))}>
          ⟲ Reset view
        </button>
      </div>
      <section className="roster" aria-label="All machines, by launch year">
        <div className="roster-head">
          <span>The ghost fleet · 1966 to 2024</span>
          <span>{visited.size} of {ARTIFACTS.length} stories heard</span>
        </div>
        <div className="roster-row">
          {sorted.map((a) => (
            <button key={a.id} className={'roster-card w-' + a.world + (visited.has(a.id) ? ' seen' : '')} onClick={() => onOpen(a.id)}>
              <span className="rc-year">{a.year}</span>
              <span className="rc-name">{a.name}</span>
              <span className="rc-meta">
                <i /> {worldLabel[a.world]} {visited.has(a.id) ? '· heard' : ''}
              </span>
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
    case 'legacy':
      return <LegacyScene a={a} beat={beat} />
    case 'dsn':
      return <DsnScene a={a} beat={beat} />
    default:
      return <ArtifactStage a={a} beat={beat} replay={replay} />
  }
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
