import { useEffect, useRef } from 'react'
import type { Artifact, Beat } from './data/artifacts'
import { motion } from './scene/motionState'

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

export function Hud({ a, beat, idx }: { a: Artifact; beat: Beat; idx: number }) {
  const label = useRef<HTMLDivElement>(null)
  const sub = useRef<HTMLDivElement>(null)
  const tele = useRef<HTMLDivElement>(null)
  const lost = useRef<HTMLDivElement>(null)
  const seis = useRef<HTMLCanvasElement>(null)
  const curve = useRef<HTMLCanvasElement>(null)
  const showSeis = beat.act === 'quake'
  const showCurve = beat.scene === 'transit'

  useEffect(() => {
    let raf = 0
    const hist: number[] = []
    const flux: number[] = []
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (label.current) label.current.textContent = motion.label
      if (sub.current) sub.current.textContent = motion.sub
      if (tele.current) {
        const parts: string[] = []
        if (motion.day >= 0) parts.push(`DAY ${fmt(motion.day)} / ${fmt(motion.days)}`)
        if (motion.alt >= 0) parts.push(`ALT ${motion.alt.toFixed(1)} m`)
        if (motion.odo >= 0) parts.push(`ODOMETER ${motion.odo.toFixed(1)} m`)
        tele.current.textContent = parts.join('  ·  ')
      }
      if (lost.current) lost.current.style.opacity = motion.signal < 0.5 ? String(0.55 + 0.45 * Math.sin(performance.now() / 180)) : '0'
      const draw = (cv: HTMLCanvasElement | null, data: number[], color: string, center: boolean) => {
        if (!cv) return
        const g = cv.getContext('2d')!
        const w = cv.width, h = cv.height
        g.clearRect(0, 0, w, h)
        g.strokeStyle = 'rgba(160,190,230,0.18)'
        g.beginPath()
        g.moveTo(0, center ? h / 2 : h * 0.25)
        g.lineTo(w, center ? h / 2 : h * 0.25)
        g.stroke()
        g.strokeStyle = color
        g.lineWidth = 1.6
        g.beginPath()
        data.forEach((v, i) => {
          const x = (i / 240) * w
          const y = center ? h / 2 - v * h * 0.45 : h * 0.25 + v * h * 0.7
          if (i) g.lineTo(x, y)
          else g.moveTo(x, y)
        })
        g.stroke()
      }
      if (showSeis) {
        const q = motion.quake
        hist.push((Math.random() - 0.5) * (0.04 + q * 1.8))
        if (hist.length > 240) hist.shift()
        draw(seis.current, hist, '#7dffd0', true)
      }
      if (showCurve && motion.flux >= 0) {
        // dip depth exaggerated x8 so it is visible
        flux.push(Math.min(1, (1 - motion.flux) * 8))
        if (flux.length > 240) flux.shift()
        draw(curve.current, flux, '#ffd27a', false)
      }
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [showSeis, showCurve, idx])

  return (
    <div className="hud" aria-hidden="true">
      <div className="hud-top">
        <span className={'phase-chip ph-' + beat.phase.toLowerCase()}>{beat.phase}</span>
        {beat.date && <span className="hud-date">{beat.date}</span>}
      </div>
      <div className="hud-label" ref={label} />
      <div className="hud-sub" ref={sub} />
      <div className="hud-tele" ref={tele} />
      {showSeis && (
        <div className="hud-graph">
          <span>SEISMOMETER</span>
          <canvas ref={seis} width={300} height={80} />
        </div>
      )}
      {showCurve && (
        <div className="hud-graph">
          <span>BRIGHTNESS OF STAR (dips exaggerated)</span>
          <canvas ref={curve} width={300} height={90} />
        </div>
      )}
      <div className="hud-lost" ref={lost}>
        ◉ SIGNAL LOST
      </div>
      {beat.highlight && (
        <div className="highlight" key={a.id + idx}>
          <small>{beat.phase === 'Discovery' ? 'Discovery' : beat.phase === 'Legacy' ? 'Legacy' : 'Fact'}</small>
          <b>{beat.highlight}</b>
        </div>
      )}
    </div>
  )
}
