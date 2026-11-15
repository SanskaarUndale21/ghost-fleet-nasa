import { useEffect, useMemo, useRef, useState } from 'react'
import type { Artifact, Beat } from './data/artifacts'
import type { Phase } from './data/missions'
import { Hud } from './Hud'
import './player.css'

/* ───────── narration manifest (pre-generated neural voice + word timings) ───────── */
type Cap = { w: [string, number, number][]; d: number }
let capsPromise: Promise<Record<string, Cap>> | null = null
function loadCaps() {
  capsPromise ??= fetch('/audio/captions.json')
    .then((r) => r.json())
    .catch(() => ({}))
  return capsPromise
}
function useCaps() {
  const [caps, setCaps] = useState<Record<string, Cap>>({})
  useEffect(() => {
    loadCaps().then(setCaps)
  }, [])
  return caps
}

const MIN_DUR: Partial<Record<string, number>> = {
  launch: 21, cruise: 16, entry: 14, orbit: 12, flyby: 16, interior: 12, transit: 14, legacy: 12, dsn: 14,
  land: 10, bounce: 11, airbag: 10, skycrane: 14, dropoff: 12, fly: 15, liftoff: 12, deploy: 7, crash: 11, driveIn: 9,
}
export function minDuration(b: Beat) {
  return (b.scene === 'stage' ? MIN_DUR[b.act ?? ''] : MIN_DUR[b.scene]) ?? 9
}
function readDuration(b: Beat) {
  return b.text.split(/\s+/).length / 2.6 + 1.5
}

const PHASES: Phase[] = ['Launch', 'Cruise', 'Arrival', 'Mission', 'Discovery', 'Legacy', 'Today']
const SOUND_KEY = 'ghostfleet.sound'

export function StoryPlayer({
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
  onNextMission,
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
  onNextMission: () => void
}) {
  const caps = useCaps()
  const total = a.chapters.length
  const ended = chapter >= total
  const beat = a.chapters[Math.min(chapter, total - 1)]
  const [sound, setSound] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== '0'
    } catch {
      return true
    }
  })
  const [file, setFile] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const elapsed = useRef(0)
  const [, force] = useState(0)
  const cap = caps[`${a.id}/${Math.min(chapter, total - 1)}`]
  const audioDur = cap?.d ?? readDuration(beat)
  const dur = Math.max(minDuration(beat), (sound ? audioDur + 0.8 : readDuration(beat)))

  const toggleSound = () => {
    const n = !sound
    setSound(n)
    try {
      localStorage.setItem(SOUND_KEY, n ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  // audio element per beat
  useEffect(() => {
    elapsed.current = 0
    if (ended) return
    const el = new Audio(`/audio/${a.id}/${chapter}.mp3`)
    el.preload = 'auto'
    audio.current = el
    // preload next clip
    if (chapter + 1 < total) {
      const n = new Audio(`/audio/${a.id}/${chapter + 1}.mp3`)
      n.preload = 'auto'
    }
    return () => {
      el.pause()
      el.src = ''
      audio.current = null
    }
  }, [a.id, chapter, replay, ended, total])

  useEffect(() => {
    const el = audio.current
    if (!el) return
    if (playing && sound && !ended) {
      el.play().catch(() => {
        /* autoplay blocked: fall back to timed subtitles */
      })
    } else el.pause()
  }, [playing, sound, chapter, replay, ended, a.id])

  // master clock
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = (now - last) / 1000
      last = now
      if (!playing || ended) return
      elapsed.current += dt
      force((x) => (x + 1) % 1e6)
      const el = audio.current
      const audioDone = !sound || !el || el.ended || el.error != null || (el.paused && el.currentTime === 0 && elapsed.current > 1.5)
      if (elapsed.current >= dur && audioDone) {
        elapsed.current = 0
        setChapter(chapter + 1)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, ended, dur, sound, chapter, setChapter])

  useEffect(() => {
    if (ended) {
      setPlaying(false)
    }
  }, [ended, setPlaying])

  // caption timing: real audio time when narrating, else scaled reading clock
  const el = audio.current
  const tSpeech = sound && el && el.currentTime > 0 ? el.currentTime : elapsed.current * (audioDur / readDuration(beat))
  const tokens = useMemo(() => beat.text.split(/\s+/), [beat])
  const spoken = useMemo(() => {
    if (!cap || !cap.w.length) return Math.floor((tSpeech / Math.max(1, readDuration(beat))) * tokens.length)
    let n = 0
    const k = cap.w.length / tokens.length
    for (let i = 0; i < tokens.length; i++) {
      const w = cap.w[Math.min(cap.w.length - 1, Math.floor(i * k))]
      if (w[1] <= tSpeech) n = i + 1
    }
    return n
  }, [cap, tSpeech, tokens, beat])

  // scrubber geometry
  const weights = a.chapters.map((b, i) => Math.max(minDuration(b), (caps[`${a.id}/${i}`]?.d ?? readDuration(b)) + 0.8))
  const sum = weights.reduce((x, y) => x + y, 0)
  const progress = ended ? 1 : Math.min(1, elapsed.current / dur)

  return (
    <div className={'player-ui' + (ended ? ' ended' : '')}>
      {/* title block */}
      <header className="mission-title">
        <button className="back-link" onClick={onBack}>
          ← {a.world === 'moon' ? 'Moon' : a.world === 'mars' ? 'Mars' : 'Deep space'} map
        </button>
        <p className="eyebrow">
          {a.voice} · {a.span}
        </p>
        <h1>{a.name}</h1>
        {!ended && <Hud a={a} beat={beat} idx={chapter * 1000 + replay} />}
      </header>

      {/* captions */}
      {!ended && (
        <section className="captions" aria-live="polite" key={a.id + chapter + ':' + replay}>
          <p className="cap-title">
            <span className={'cap-phase ph-' + beat.phase.toLowerCase()}>{beat.phase}</span>
            {beat.title}
          </p>
          <p className="cap-text">
            {tokens.map((tk, i) => (
              <span key={i} className={i < spoken ? 'said' : ''}>
                {tk}{' '}
              </span>
            ))}
          </p>
        </section>
      )}

      {ended && (
        <MissionEnd a={a} done={done} onComplete={onComplete} onReplayAll={() => { setChapter(0); setPlaying(true) }} onNext={onNextMission} onBack={onBack} />
      )}

      {/* transport */}
      <footer className="transport">
        <div className="t-left">
          <button className="t-btn" onClick={() => setChapter(Math.max(0, chapter - 1))} disabled={chapter === 0} aria-label="Previous scene">
            ⏮
          </button>
          <button className="t-play" onClick={() => (ended ? (setChapter(0), setPlaying(true)) : setPlaying(!playing))} aria-label={playing ? 'Pause' : 'Play'}>
            {ended ? '↺' : playing ? '❚❚' : '▶'}
          </button>
          <button className="t-btn" onClick={() => setChapter(Math.min(total, chapter + 1))} disabled={ended} aria-label="Next scene">
            ⏭
          </button>
          <button className="t-btn" onClick={onReplay} disabled={ended} aria-label="Replay scene" title="Replay this scene">
            ↻
          </button>
        </div>
        <div className="scrubber" role="tablist" aria-label="Mission timeline">
          {a.chapters.map((b, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === chapter}
              className={'seg ph-' + b.phase.toLowerCase() + (i < chapter || ended ? ' past' : '') + (i === chapter && !ended ? ' now' : '')}
              style={{ flexGrow: weights[i] / sum }}
              onClick={() => {
                setChapter(i)
                setPlaying(true)
              }}
              title={`${b.phase}: ${b.title}`}
            >
              <i style={i === chapter && !ended ? { transform: `scaleX(${progress})` } : undefined} />
              {(i === 0 || a.chapters[i - 1].phase !== b.phase) && <span>{b.phase}</span>}
            </button>
          ))}
        </div>
        <div className="t-right">
          <button className={'t-pill' + (sound ? ' on' : '')} onClick={toggleSound} aria-pressed={sound}>
            {sound ? '🔊 Narration' : '🔈 Muted'}
          </button>
          <button className={'t-pill' + (file ? ' on' : '')} onClick={() => setFile(!file)} aria-expanded={file}>
            ☰ Mission file
          </button>
        </div>
      </footer>

      <aside className={'mission-file' + (file ? ' open' : '')} aria-hidden={!file}>
        <button className="close" onClick={() => setFile(false)} aria-label="Close mission file">
          ✕
        </button>
        <p className="eyebrow">Mission file</p>
        <h2>{a.name}</h2>
        <p className="tagline">“{a.tagline}”</p>
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
          <div className="wide">
            <dt>Where it is now</dt>
            <dd>{a.where}</dd>
          </div>
          <div className="wide">
            <dt>Status</dt>
            <dd>{a.status}</dd>
          </div>
        </dl>
        <h4>Engineering → science</h4>
        <ul className="sci">
          {a.science.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <h4>Mission timeline</h4>
        <ol className="file-beats">
          {a.chapters.map((b, i) => (
            <li key={i} className={i === chapter ? 'on' : ''}>
              <button onClick={() => setChapter(i)}>
                <span className={'dot ph-' + b.phase.toLowerCase()} />
                <span className="fb-phase">{b.phase}</span>
                <span className="fb-title">{b.title}</span>
                {b.date && <span className="fb-date">{b.date}</span>}
              </button>
            </li>
          ))}
        </ol>
        <p className="src">
          Source:{' '}
          <a href={a.source.url} target="_blank" rel="noreferrer">
            {a.source.label} ↗
          </a>
          {a.modelNote && <span> · Model: {a.modelNote}</span>}
        </p>
      </aside>
    </div>
  )
}

function MissionEnd({
  a,
  done,
  onComplete,
  onReplayAll,
  onNext,
  onBack,
}: {
  a: Artifact
  done: boolean
  onComplete: () => void
  onReplayAll: () => void
  onNext: () => void
  onBack: () => void
}) {
  const [pick, setPick] = useState<number | null>(null)
  return (
    <section className="mission-end" role="dialog" aria-labelledby="end-h">
      <p className="eyebrow">Mission complete</p>
      <h2 id="end-h">{a.quiz.q}</h2>
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
          {pick === a.quiz.answer ? `Correct. ${a.voice} joins your ghost fleet log.` : 'Not quite.'}
          {pick !== a.quiz.answer && (
            <button className="link" onClick={() => setPick(null)}>
              Try again
            </button>
          )}
        </p>
      )}
      {done && pick === null && <p className="verdict">Already in your log ◉</p>}
      <div className="row">
        <button className="cta" onClick={onNext}>
          Next mission →
        </button>
        <button className="ghost-btn" onClick={onReplayAll}>
          ↺ Watch again
        </button>
        <button className="ghost-btn" onClick={onBack}>
          Back to map
        </button>
      </div>
    </section>
  )
}

export { PHASES }
