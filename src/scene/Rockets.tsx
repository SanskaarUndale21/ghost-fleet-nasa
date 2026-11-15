import { useMemo } from 'react'
import * as THREE from 'three'
import type { RocketKind } from '../data/missions'

/* Simplified but proportion-faithful launch vehicles (Saturn V uses NASA's model).
   Units: 1 unit ≈ 3.8 m, so a 40 m rocket ≈ 10.5 units. */

type Kind = Exclude<RocketKind, 'saturnv'>
type Paint = { base: string; seams?: string; text?: string; textColor?: string; band?: string; insulation?: boolean }
type Section = { r: number; h: number; paint: Paint; metal?: number; rough?: number }
type Spec = {
  core: Section
  interstage?: { rTop: number; h: number; color: string }
  upper: Section
  fairing: { r: number; cyl: number; nose: number; color: string; boattail?: number }
  boosters?: { n: number; r: number; h: number; color: string; nose: number; band?: string; segments?: number; air?: number }
  skirt?: { r: number; h: number; color: string }
  engines: { n: number; r: number; h: number }
}

const SPECS: Record<Kind, Spec> = {
  // Atlas SLV-3C + Centaur D: stainless "balloon" tank, silver Centaur, white ogive fairing
  'atlas-centaur': {
    skirt: { r: 0.62, h: 0.9, color: '#b9bdc3' },
    core: { r: 0.4, h: 5.6, paint: { base: '#cfd3d8', seams: '#9aa0a8', text: 'UNITED STATES', textColor: '#1d2433', band: '#8a8f96' }, metal: 0.85, rough: 0.32 },
    interstage: { rTop: 0.4, h: 0.35, color: '#9da2a9' },
    upper: { r: 0.4, h: 2.4, paint: { base: '#e3e5e8', seams: '#b4b8be' }, metal: 0.7, rough: 0.35 },
    fairing: { r: 0.44, cyl: 1.0, nose: 1.5, color: '#f3f3ef', boattail: 0.25 },
    engines: { n: 3, r: 0.16, h: 0.45 },
  },
  // Titan IIIE-Centaur: two 5-segment SRBs, long white Centaur Standard Shroud
  titan3e: {
    core: { r: 0.4, h: 7.0, paint: { base: '#e7e6e1', seams: '#c4c3bd', text: 'UNITED STATES', textColor: '#1d2433', band: '#2b2b2b' }, metal: 0.2, rough: 0.6 },
    interstage: { rTop: 0.4, h: 0.3, color: '#2c2c2c' },
    upper: { r: 0.4, h: 1.4, paint: { base: '#e3e5e8' } },
    fairing: { r: 0.56, cyl: 3.0, nose: 1.4, color: '#f4f4f0', boattail: 0.3 },
    boosters: { n: 2, r: 0.42, h: 7.4, color: '#efefea', nose: 1.0, band: '#1e1e1e', segments: 5 },
    engines: { n: 2, r: 0.2, h: 0.5 },
  },
  // Delta II 7925: teal first stage, 9 white GEM-40 solids, white second stage, 9.5 ft fairing
  delta2: {
    core: { r: 0.32, h: 6.8, paint: { base: '#3c8d93', seams: '#2f7479', text: 'UNITED STATES', textColor: '#ffffff', band: '#2a6468' }, metal: 0.25, rough: 0.55 },
    interstage: { rTop: 0.32, h: 0.45, color: '#e9e9e4' },
    upper: { r: 0.32, h: 0.9, paint: { base: '#efefea' } },
    fairing: { r: 0.38, cyl: 1.1, nose: 1.1, color: '#f5f5f2', boattail: 0.3 },
    boosters: { n: 9, r: 0.14, h: 3.4, color: '#f2f2ee', nose: 0.45 },
    engines: { n: 1, r: 0.2, h: 0.5 },
  },
  // Delta II 7925H: wider GEM-46 solids
  delta2h: {
    core: { r: 0.32, h: 6.8, paint: { base: '#3c8d93', seams: '#2f7479', text: 'UNITED STATES', textColor: '#ffffff', band: '#2a6468' }, metal: 0.25, rough: 0.55 },
    interstage: { rTop: 0.32, h: 0.45, color: '#e9e9e4' },
    upper: { r: 0.32, h: 0.9, paint: { base: '#efefea' } },
    fairing: { r: 0.38, cyl: 1.1, nose: 1.1, color: '#f5f5f2', boattail: 0.3 },
    boosters: { n: 9, r: 0.16, h: 3.9, color: '#f2f2ee', nose: 0.5 },
    engines: { n: 1, r: 0.2, h: 0.5 },
  },
  // Atlas V 401: orange foam-insulated Common Core Booster, Centaur, 4 m fairing
  atlasv: {
    core: { r: 0.5, h: 8.5, paint: { base: '#c97a3e', seams: '#a8612d', text: 'UNITED STATES', textColor: '#1d2433', band: '#9b5a2a', insulation: true }, metal: 0.05, rough: 0.85 },
    interstage: { rTop: 0.4, h: 0.6, color: '#eceae5' },
    upper: { r: 0.4, h: 3.2, paint: { base: '#e8e8e3', seams: '#c9c9c3' }, metal: 0.4, rough: 0.5 },
    fairing: { r: 0.56, cyl: 2.4, nose: 1.8, color: '#f5f5f2', boattail: 0.4 },
    engines: { n: 2, r: 0.22, h: 0.6 },
  },
}

// Atlas V 541: 5 m fairing + 4 solids
const ATLAS_541: Spec = {
  ...SPECS.atlasv,
  fairing: { r: 0.72, cyl: 3.2, nose: 2.2, color: '#f5f5f2', boattail: 0.55 },
  boosters: { n: 4, r: 0.21, h: 5.0, color: '#f2f2ee', nose: 0.9, air: 0.3 },
}

export function getSpec(kind: Kind, variant?: string): Spec {
  return kind === 'atlasv' && variant?.includes('541') ? ATLAS_541 : SPECS[kind]
}
/** height where the first stage ends (used to place the upper-stage flame after staging) */
export function stage1Height(kind: Kind, variant?: string) {
  const s = getSpec(kind, variant)
  return (s.skirt ? 0 : 0) + s.core.h
}

/* ───────── textures ───────── */
const texCache = new Map<string, THREE.CanvasTexture>()
function bodyTexture(p: Paint, aspect: number) {
  const key = JSON.stringify(p) + aspect.toFixed(2)
  const hit = texCache.get(key)
  if (hit) return hit
  const W = 512
  const H = Math.min(2048, Math.max(256, Math.round(W * aspect)))
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  g.fillStyle = p.base
  g.fillRect(0, 0, W, H)
  if (p.insulation) {
    // sprayed-on foam texture
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,220,180' : '90,40,10'},${Math.random() * 0.08})`
      g.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 6, 1 + Math.random() * 3)
    }
  }
  if (p.seams) {
    g.strokeStyle = p.seams
    g.lineWidth = 2
    for (let y = H / 8; y < H; y += H / 8) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(W, y)
      g.stroke()
    }
    g.lineWidth = 1
    g.globalAlpha = 0.5
    for (let x = 0; x < W; x += W / 24) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, H)
      g.stroke()
    }
    g.globalAlpha = 1
  }
  if (p.band) {
    g.fillStyle = p.band
    g.fillRect(0, 0, W, H * 0.03)
    g.fillRect(0, H * 0.97, W, H * 0.03)
  }
  // cable raceway
  g.fillStyle = 'rgba(0,0,0,0.18)'
  g.fillRect(W * 0.74, 0, W * 0.025, H)
  if (p.text) {
    g.save()
    g.fillStyle = p.textColor ?? '#111'
    const fs = Math.min(W * 0.075, (H * 0.6) / p.text.length)
    g.font = `700 ${fs * 1.5}px "Arial Narrow", Arial, sans-serif`
    g.translate(W * 0.25, H * 0.5)
    g.rotate(Math.PI / 2)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(p.text.split('').join(String.fromCharCode(8202)), 0, 0)
    g.restore()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  texCache.set(key, t)
  return t
}

/* ───────── lathe profiles ───────── */
function ogive(r: number, h: number, base = 0, n = 24) {
  const pts: THREE.Vector2[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    pts.push(new THREE.Vector2(Math.max(0.001, r * Math.sqrt(1 - t * t) * (1 - 0.15 * t)), base + t * h))
  }
  return pts
}
function bell(r: number, h: number) {
  const pts: THREE.Vector2[] = []
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    pts.push(new THREE.Vector2(r * (0.32 + 0.68 * Math.pow(1 - t, 1.6)), -h + t * h))
  }
  return pts
}

function Bell({ r, h, x = 0, z = 0, tilt = 0 }: { r: number; h: number; x?: number; z?: number; tilt?: number }) {
  const geo = useMemo(() => new THREE.LatheGeometry(bell(r, h), 28), [r, h])
  return (
    <group position={[x, 0, z]} rotation={[tilt, 0, 0]}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#3b3d42" metalness={0.85} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -h + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.95, 24]} />
        <meshBasicMaterial color="#1a0d06" />
      </mesh>
    </group>
  )
}

function Body({ s, y }: { s: Section; y: number }) {
  const tex = useMemo(() => bodyTexture(s.paint, s.h / (2 * Math.PI * s.r)), [s])
  return (
    <mesh position={[0, y + s.h / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[s.r, s.r, s.h, 48, 1]} />
      <meshStandardMaterial map={tex} metalness={s.metal ?? 0.3} roughness={s.rough ?? 0.5} />
    </mesh>
  )
}

function Fairing({ f, y }: { f: Spec['fairing']; y: number }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = []
    const bt = f.boattail ?? 0
    pts.push(new THREE.Vector2(f.r * 0.75, 0))
    pts.push(new THREE.Vector2(f.r, bt))
    pts.push(new THREE.Vector2(f.r, bt + f.cyl))
    ogive(f.r, f.nose, bt + f.cyl).slice(1).forEach((p) => pts.push(p))
    return new THREE.LatheGeometry(pts, 48)
  }, [f])
  return (
    <group position={[0, y, 0]}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={f.color} roughness={0.45} metalness={0.1} />
      </mesh>
      {/* separation rail */}
      <mesh position={[0, (f.boattail ?? 0) + f.cyl / 2, 0]}>
        <cylinderGeometry args={[f.r + 0.006, f.r + 0.006, f.cyl, 48, 1, true, 0, 0.03]} />
        <meshStandardMaterial color="#9aa0a6" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Booster({ b, x, z }: { b: NonNullable<Spec['boosters']>; x: number; z: number }) {
  const nose = useMemo(() => new THREE.LatheGeometry(ogive(b.r, b.nose), 24), [b])
  const air = b.air ?? 0
  return (
    <group position={[x, air, z]}>
      <mesh position={[0, b.h / 2, 0]} castShadow>
        <cylinderGeometry args={[b.r, b.r, b.h, 24]} />
        <meshStandardMaterial color={b.color} roughness={0.55} metalness={0.15} />
      </mesh>
      {b.segments &&
        Array.from({ length: b.segments - 1 }).map((_, i) => (
          <mesh key={i} position={[0, ((i + 1) / b.segments!) * b.h, 0]}>
            <cylinderGeometry args={[b.r + 0.008, b.r + 0.008, 0.12, 24]} />
            <meshStandardMaterial color={b.band ?? '#222'} />
          </mesh>
        ))}
      <mesh geometry={nose} position={[0, b.h, 0]} castShadow>
        <meshStandardMaterial color={b.band && b.segments ? '#1e1e1e' : b.color} roughness={0.5} />
      </mesh>
      <Bell r={b.r * 0.75} h={b.r * 1.6} tilt={0.06} />
    </group>
  )
}

export function ProcRocket({ kind, variant, stage1 }: { kind: Kind; variant?: string; stage1: React.RefObject<THREE.Group | null> }) {
  const s = getSpec(kind, variant)
  const core0 = 0
  const upper0 = s.core.h + (s.interstage?.h ?? 0)
  const fair0 = upper0 + s.upper.h
  const istGeo = useMemo(
    () => (s.interstage ? new THREE.CylinderGeometry(s.interstage.rTop, s.core.r, s.interstage.h, 48) : null),
    [s],
  )
  const nb = s.boosters?.n ?? 0
  return (
    <group>
      <group ref={stage1}>
        {s.skirt && (
          <mesh position={[0, s.skirt.h / 2, 0]} castShadow>
            <cylinderGeometry args={[s.core.r, s.skirt.r, s.skirt.h, 48]} />
            <meshStandardMaterial color={s.skirt.color} metalness={0.8} roughness={0.35} />
          </mesh>
        )}
        <Body s={s.core} y={core0} />
        {Array.from({ length: s.engines.n }).map((_, i) => {
          const a = (i / s.engines.n) * Math.PI * 2
          const off = s.engines.n > 1 ? s.core.r * 0.45 : 0
          return <Bell key={i} r={s.engines.r} h={s.engines.h} x={Math.cos(a) * off} z={Math.sin(a) * off} />
        })}
        {Array.from({ length: nb }).map((_, i) => {
          const b = s.boosters!
          const a = (i / nb) * Math.PI * 2 + 0.3
          const R = s.core.r + b.r * 0.92
          return <Booster key={i} b={b} x={Math.cos(a) * R} z={Math.sin(a) * R} />
        })}
      </group>
      {istGeo && (
        <mesh geometry={istGeo} position={[0, s.core.h + s.interstage!.h / 2, 0]} castShadow>
          <meshStandardMaterial color={s.interstage!.color} roughness={0.6} />
        </mesh>
      )}
      <Body s={s.upper} y={upper0} />
      <Fairing f={s.fairing} y={fair0} />
    </group>
  )
}

/* ───────── launch tower ───────── */
export function LaunchTower({ height, color, side = -1 }: { height: number; color: string; side?: number }) {
  const beams = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number, number]; r?: [number, number, number] }[] = []
    const w = 1.1
    const levels = Math.round(height / 0.9)
    for (const [cx, cz] of [
      [-w, -w],
      [w, -w],
      [w, w],
      [-w, w],
    ])
      out.push({ p: [cx / 2, height / 2, cz / 2], s: [0.07, height, 0.07] })
    for (let i = 0; i <= levels; i++) {
      const y = (i / levels) * height
      out.push({ p: [0, y, -w / 2], s: [w, 0.05, 0.05] }, { p: [0, y, w / 2], s: [w, 0.05, 0.05] })
      out.push({ p: [-w / 2, y, 0], s: [0.05, 0.05, w] }, { p: [w / 2, y, 0], s: [0.05, 0.05, w] })
      if (i < levels) {
        const dy = height / levels
        const diag = Math.hypot(w, dy)
        const ang = Math.atan2(dy, w)
        out.push({ p: [0, y + dy / 2, -w / 2], s: [diag, 0.035, 0.035], r: [0, 0, (i % 2 ? 1 : -1) * ang] })
        out.push({ p: [0, y + dy / 2, w / 2], s: [diag, 0.035, 0.035], r: [0, 0, (i % 2 ? -1 : 1) * ang] })
      }
    }
    return out
  }, [height])
  return (
    <group position={[side * 1.9, 0, 0]}>
      {beams.map((b, i) => (
        <mesh key={i} position={b.p} rotation={b.r ?? [0, 0, 0]} castShadow>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* swing arms */}
      {[0.35, 0.62, 0.82].map((f) => (
        <mesh key={f} position={[-side * 0.7, height * f, 0]} castShadow>
          <boxGeometry args={[1.4, 0.18, 0.35]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* hammerhead crane */}
      <mesh position={[0.4 * side, height + 0.25, 0]} castShadow>
        <boxGeometry args={[2.6, 0.25, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
