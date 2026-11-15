import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CameraControls as CC } from '@react-three/drei'
import type { Artifact } from '../data/artifacts'
import type { Act } from '../data/missions'
import { Flame, Laser, Particles, Tracks, type ParticlesHandle, type TracksHandle } from './Effects'
import { ArtifactModel, newRig, type Rig } from './Models'
import { motion, smooth } from './motionState'
import { terrainHeight } from './util'

type Ground = 'moon' | 'mars' | null
const DRIVE: Act[] = ['drive', 'driveBack', 'driveIn', 'stuck']

export function Actor({ a, act, ground, replay, ascentGone }: { a: Artifact; act: Act; ground: Ground; replay: number; ascentGone?: boolean }) {
  const rig = useMemo<Rig>(() => newRig(), [a.id]) // eslint-disable-line
  const body = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const parts = useRef<ParticlesHandle>(null)
  const tracks = useRef<TracksHandle>(null)
  const start = useRef(-1)
  const st = useRef({ s: 0, wheel: 0, rotor: 0, rotorSpeed: 0, lastY: 0, emitAcc: 0, trackAcc: 0, lastX: 0, lastZ: 0, contact: false })
  const flame = useRef({ on: 0, pos: new THREE.Vector3(), dir: new THREE.Vector3(0, -1, 0) })
  const ctl = useThree((s) => s.controls) as unknown as CC | null
  const size = a.model.type === 'glb' ? a.model.size ?? 3 : 3
  const grounded = ground !== null || a.backdrop === 'eros'
  const H = (x: number, z: number) => (ground ? terrainHeight(ground, x, z) : 0)
  const dustColor = ground === 'mars' ? '#c58a60' : ground === 'moon' ? '#b8b6b2' : '#9a8670'
  // moon: no air, dust flies in ballistic arcs; mars: thin air, dust drifts
  const dustPhys = ground === 'moon' ? { gravity: 1.6, drag: 0 } : { gravity: 0.25, drag: 1.2 }

  useEffect(() => {
    start.current = -1
    const s = st.current
    s.s = 0
    s.emitAcc = 0
    s.contact = false
    tracks.current?.clear()
    parts.current?.clear()
    if (rig.ascent) rig.ascent.position.copy(rig.ascentBase)
    rig.arm.forEach((o, i) => o.quaternion.copy(rig.armBase[i]))
    motion.dim = 0
    motion.signal = 1
    motion.storm = 0
    motion.snow = 0
    motion.sun = 0
    motion.quake = 0
    motion.alt = -1
    motion.odo = -1
    motion.label = ''
    motion.sub = ''
    return () => {
      if (rig.ascent) rig.ascent.position.copy(rig.ascentBase)
    }
  }, [act, a.id, replay, rig])

  const emit = (pos: THREE.Vector3, count: number, speed = 1.2, up = 0.6, size2 = 0.12, life = 1.6) =>
    parts.current?.emit({ pos, count, speed, up, size: size2, life, color: dustColor, ...dustPhys, spread: 1 })

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    if (start.current < 0) start.current = clock.elapsedTime
    const t = clock.elapsedTime - start.current
    motion.t = t
    if (rig.ascent) rig.ascent.visible = !ascentGone
    const g = body.current
    if (!g) return
    const s = st.current
    let x = 0, z = 0, y = H(0, 0), yaw = 0, pitch = 0, roll = 0
    let visible = true
    flame.current.on = 0
    let wheelSpeed = 0
    let rotorTarget = 0

    const groundAt = (px: number, pz: number) => H(px, pz)

    switch (act) {
      case 'land': {
        const D = 6
        const h0 = grounded ? 7 : 5
        const k = Math.min(t / D, 1)
        const alt = h0 * Math.pow(1 - k, 2)
        y += alt
        flame.current.on = t < D ? 1 : Math.max(0, 1 - (t - D) * 2.5)
        flame.current.pos.set(0, y + 0.15, 0)
        motion.alt = alt * 30
        motion.label = t < D ? 'POWERED DESCENT' : t < D + 2 ? 'TOUCHDOWN' : ''
        if (grounded && alt < 2.8 && flame.current.on > 0.1) {
          s.emitAcc += dt * 140 * (1 - alt / 2.8)
          while (s.emitAcc > 1) {
            s.emitAcc--
            const ang = Math.random() * Math.PI * 2
            emit(new THREE.Vector3(Math.cos(ang) * 0.6, groundAt(0, 0) + 0.05, Math.sin(ang) * 0.6), 1, 3.2, 0.25, 0.16, 1.8)
          }
        }
        if (t > D + 2) motion.alt = -1
        break
      }
      case 'bounce': {
        const D = 4
        if (t < D) {
          const alt = 6 * Math.pow(1 - t / D, 2)
          y += alt
          flame.current.on = 1
          motion.label = 'DESCENDING ON RADAR'
        } else {
          const tb = t - D
          const b = 0.9 * Math.abs(Math.sin(tb * 2.6)) * Math.exp(-tb * 0.9)
          y += tb < 5 ? b : 0
          flame.current.on = tb < 2.4 ? 0.6 : 0
          motion.label = tb < 2.4 ? 'ENGINES STILL FIRING!' : tb < 5 ? 'BOUNCE' : 'SETTLED'
          const touching = b < 0.03
          if (touching && !s.contact && tb < 5) emit(new THREE.Vector3(0, y, 0), 60, 2, 0.4, 0.14, 1.6)
          s.contact = touching
        }
        flame.current.pos.set(0, y + 0.4, 0)
        if (grounded && y - H(0, 0) < 2 && flame.current.on > 0.1) emit(new THREE.Vector3((Math.random() - 0.5) * 1.5, H(0, 0), (Math.random() - 0.5) * 1.5), 2, 2.5, 0.2)
        break
      }
      case 'liftoff': {
        const T0 = 3
        motion.label = t < T0 ? `ASCENT ENGINE ARM · ${Math.ceil(T0 - t)}` : t < T0 + 6 ? 'LIFTOFF' : ''
        if (rig.ascent && t > T0) {
          const tl = t - T0
          const rise = 0.55 * tl * tl
          rig.ascent.position.set(rig.ascentBase.x, rig.ascentBase.y + rise / rig.scale, rig.ascentBase.z)
          const wp = new THREE.Vector3()
          rig.ascent.getWorldPosition(wp)
          flame.current.on = 0.8
          flame.current.pos.set(0, y + size * 0.47 + rise, 0)
          if (tl < 0.4) emit(new THREE.Vector3(0, y + size * 0.47, 0), 30, 3.5, 0.6, 0.06, 2.2)
        }
        break
      }
      case 'deploy': {
        const k = smooth(0, 3.2, t)
        pitch = -Math.PI / 2 * (1 - k)
        y += 1.4 * (1 - k)
        z = -0.6 * (1 - k)
        if (t > 3.2 && !s.contact) {
          emit(new THREE.Vector3(0, H(0, 0), 0), 40, 1.5, 0.4)
          s.contact = true
        }
        motion.label = t < 3.2 ? 'UNFOLDING' : ''
        break
      }
      case 'drive':
      case 'driveBack':
      case 'stuck': {
        const R = a.model.type === 'proc' && a.model.kind === 'sojourner' ? 2.4 : size * 1.4
        const speed = act === 'stuck' ? 0 : (act === 'driveBack' ? -1 : 1) * (a.id === 'lrv' ? 1.6 : a.id === 'sojourner' ? 0.35 : 0.55)
        s.s += speed * dt
        const th = s.s / R
        x = R * Math.sin(th)
        z = -R + R * Math.cos(th)
        const dx = Math.cos(th), dz = -Math.sin(th)
        yaw = Math.atan2(dx, dz)
        const fx = x + dx * 0.6, fz = z + dz * 0.6, bx = x - dx * 0.6, bz = z - dz * 0.6
        pitch = -Math.atan2(groundAt(fx, fz) - groundAt(bx, bz), 1.2)
        const lx = x + dz * 0.5, lz = z - dx * 0.5, rx = x - dz * 0.5, rz = z + dx * 0.5
        roll = Math.atan2(groundAt(lx, lz) - groundAt(rx, rz), 1.0)
        y = groundAt(x, z)
        wheelSpeed = act === 'stuck' ? 8 : speed / 0.35
        if (act === 'stuck') {
          y -= 0.1 * Math.min(t / 6, 1)
          x += (Math.random() - 0.5) * 0.01
          motion.label = t > 3 ? 'WHEELS SPINNING · NO TRACTION' : ''
          if (Math.random() < 0.6) emit(new THREE.Vector3(x - dx * 0.8, y + 0.1, z - dz * 0.8), 2, 1.4, 0.8, 0.07, 1.2)
          motion.dim = smooth(6, 14, t) * 0.55
          motion.signal = t > 12 ? 0 : 1
        } else {
          motion.odo = Math.abs(s.s) * (a.id === 'sojourner' ? 0.3 : 1)
          s.trackAcc += Math.abs(speed) * dt
          if (s.trackAcc > 0.18) {
            s.trackAcc = 0
            const half = a.id === 'lrv' ? 0.68 : a.id === 'sojourner' ? 0.77 : size * 0.22
            tracks.current?.add(x, y, z, yaw, half)
          }
          if (ground && Math.random() < Math.abs(speed) * 0.6) emit(new THREE.Vector3(x - dx * 0.7, y + 0.1, z - dz * 0.7), 1, 0.8, 0.5, 0.08, 1.2)
        }
        break
      }
      case 'driveIn': {
        // down the Pathfinder ramp
        const k = smooth(1, 7, t)
        z = -2.5 + k * 3.1
        const onPetal = z < -1.6
        y = onPetal ? H(0, z) + 0.16 : H(0, z) + Math.max(0, 0.16 - (z + 1.6) * 0.18)
        pitch = z > -1.6 && z < -0.7 ? 0.18 : 0
        wheelSpeed = t > 1 && t < 7 ? 1.5 : 0
        motion.odo = Math.max(0, k * 3.1) * 0.3
        if (wheelSpeed) {
          s.trackAcc += dt
          if (s.trackAcc > 0.15 && !onPetal) {
            s.trackAcc = 0
            tracks.current?.add(0, y, z, 0, 0.77)
          }
        }
        break
      }
      case 'dig': {
        if (rig.arm.length) {
          const w = Math.sin(t * 1.6) * 0.18
          rig.arm.forEach((o, i) => {
            o.quaternion.copy(rig.armBase[i])
            o.rotateZ(w * (i ? -1 : 1))
          })
        }
        if (Math.sin(t * 1.6) > 0.95 && Math.random() < 0.5) emit(new THREE.Vector3(size * 0.45, H(0, 0) + 0.05, size * 0.25), 6, 0.7, 0.6, 0.08, 1.4)
        motion.label = 'SAMPLING SOIL'
        break
      }
      case 'quake': {
        const ph = t % 5
        motion.quake = ph < 2.2 ? Math.exp(-ph * 1.6) * (0.7 + 0.3 * Math.sin(t * 13)) : 0
        if (ph < 0.05 && Math.random() < 0.7 && ground) emit(new THREE.Vector3((Math.random() - 0.5) * 4, H(0, 0), (Math.random() - 0.5) * 4), 20, 0.6, 0.6)
        motion.label = motion.quake > 0.15 ? 'SEISMIC EVENT DETECTED' : 'LISTENING'
        break
      }
      case 'rest':
      case 'frost':
      case 'dust': {
        motion.dim = smooth(3, 12, t) * (act === 'dust' ? 0.7 : 0.5)
        if (act === 'dust') motion.storm = smooth(1, 6, t)
        if (act === 'frost') motion.snow = smooth(0, 3, t)
        motion.signal = t > 9 ? 0 : 1
        break
      }
      case 'snow':
        motion.snow = smooth(0, 3, t)
        break
      case 'airbag': {
        const D = 7
        visible = t > D + 0.6
        break
      }
      case 'fly': {
        const C = 15
        const u = t % C
        const climb = smooth(2.5, 4.5, u) - smooth(10.5, 12.5, u)
        const travel = smooth(4.5, 7.5, u) - smooth(7.5, 10.5, u)
        rotorTarget = u > 1 && u < 13.5 ? 1 : 0
        y += climb * 3
        x = travel * 3
        pitch = (smooth(4.5, 5.5, u) - smooth(6.5, 7.5, u) - smooth(7.5, 8.5, u) + smooth(9.5, 10.5, u)) * 0.15
        motion.alt = climb * 3 * 1.5
        motion.label = u < 2.5 ? 'ROTORS SPINNING UP' : u < 4.5 ? 'TAKEOFF' : u < 10.5 ? 'FLYING' : u < 12.5 ? 'LANDING' : 'TOUCHDOWN'
        if (rotorTarget && climb < 0.5 && ground) {
          if (Math.random() < 0.8) {
            const ang = Math.random() * Math.PI * 2
            emit(new THREE.Vector3(x + Math.cos(ang) * 0.5, H(x, 0) + 0.02, Math.sin(ang) * 0.5), 1, 1.8 * (1 - climb * 2), 0.2, 0.08, 1.2)
          }
        }
        break
      }
      case 'crash': {
        const climb = smooth(1.5, 3, t) - smooth(3.5, 5, t)
        rotorTarget = t < 5.2 ? 1 : 0
        y += climb * 1.2
        roll = smooth(4.8, 5.4, t) * 0.22
        if (t > 4.9 && !s.contact) {
          emit(new THREE.Vector3(0, H(0, 0), 0), 50, 1.6, 0.5)
          s.contact = true
        }
        motion.label = t < 5 ? 'FLIGHT 72' : t < 9 ? 'ROTOR BLADES DAMAGED' : ''
        motion.dim = smooth(8, 16, t) * 0.4
        break
      }
      case 'drift': {
        const u = t % 30
        z = -u * 0.9
        x = u * 0.3
        y = u * 0.05
        motion.dim = 0
        motion.signal = u > 10 ? 0 : 1
        break
      }
      case 'coast':
        roll = Math.sin(t * 0.2) * 0.3
        pitch = t * 0.05
        motion.signal = t > 8 ? 0 : 1
        break
      case 'sunlight':
        motion.sun = smooth(0, 2, t)
        roll = Math.sin(t * 0.7) * 0.05
        break
      default:
        break
    }

    // rotors
    s.rotorSpeed += (rotorTarget - s.rotorSpeed) * Math.min(1, dt * (rotorTarget ? 1.2 : 0.5))
    if (rig.rotors.length) {
      rig.rotors.forEach((r, i) => {
        r.pivot.rotateOnAxis(r.axis, (i ? -1 : 1) * s.rotorSpeed * 32 * dt)
      })
    }
    // wheels
    s.wheel += wheelSpeed * dt
    rig.wheels.forEach((w) => (w.rotation.y = s.wheel))

    g.position.set(x, y, z)
    g.rotation.set(0, yaw, 0)
    if (inner.current) inner.current.rotation.set(pitch, 0, roll)
    g.visible = visible

    // camera follows moving rovers / helicopter
    if (ctl && (DRIVE.includes(act) || act === 'fly' || act === 'drift')) {
      const tgt = new THREE.Vector3()
      ctl.getTarget(tgt)
      const want = new THREE.Vector3(x, y + (act === 'fly' ? 0.3 : size * 0.3), z)
      tgt.lerp(want, Math.min(1, dt * 2.5))
      ctl.moveTo(tgt.x, tgt.y, tgt.z, false)
    }
  })

  const laserTarget = useMemo(() => {
    if (a.id === 'alsep') return new THREE.Vector3(-0.5, 0.35, -1.6)
    return new THREE.Vector3(2.4, H(2.4, 1.4) + 0.2, 1.4)
  }, [a.id]) // eslint-disable-line
  const laserFrom = useMemo(() => new THREE.Vector3(-60, 38, -110), [])

  return (
    <>
      <group ref={body}>
        <group ref={inner}>
          <ArtifactModel key={a.id} spec={a.model} grounded={grounded} spin={!grounded && act !== 'drift' && act !== 'coast'} rig={rig} />
        </group>
      </group>
      <Flame get={() => flame.current} length={size * 0.45} radius={size * 0.09} />
      <Particles ref={parts} />
      {ground && <Tracks ref={tracks} color={ground === 'mars' ? '#5e3420' : '#55534f'} />}
      {act === 'laser' && (
        <>
          {a.id === 'eagle' && (
            <mesh position={laserTarget} rotation={[-0.5, 0.4, 0]} castShadow>
              <boxGeometry args={[0.45, 0.04, 0.45]} />
              <meshStandardMaterial color="#7a8899" metalness={0.95} roughness={0.15} />
            </mesh>
          )}
          <Laser from={laserFrom} to={laserTarget} />
        </>
      )}
      {act === 'airbag' && <Airbags ground={ground} onDust={(p) => emit(p, 50, 2.2, 0.5, 0.14, 1.8)} />}
      {(act === 'skycrane' || act === 'dropoff') && (
        <Suspense fallback={null}>
          <SkyCrane act={act} ground={ground} hideActor={body} emit={(p, n) => emit(p, n, 3, 0.2, 0.16, 2)} />
        </Suspense>
      )}
      {a.id === 'sojourner' && <PathfinderLander y={H(0, -4.5)} />}
    </>
  )
}

/* airbag cluster bouncing in (Pathfinder, Spirit, Opportunity) */
function Airbags({ ground, onDust }: { ground: Ground; onDust: (p: THREE.Vector3) => void }) {
  const g = useRef<THREE.Group>(null)
  const start = useRef(-1)
  const last = useRef(1)
  const balls = useMemo(() => {
    const out: [number, number, number][] = []
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2
      out.push([Math.cos(a) * 0.75, 0, Math.sin(a) * 0.75], [Math.cos(a + 0.4) * 0.6, 0.75, Math.sin(a + 0.4) * 0.6], [Math.cos(a) * 0.6, -0.75, Math.sin(a) * 0.6])
    }
    return out
  }, [])
  useFrame(({ clock }) => {
    if (!g.current) return
    if (start.current < 0) start.current = clock.elapsedTime
    const t = clock.elapsedTime - start.current
    const D = 7
    const k = Math.min(t / D, 1)
    // decaying bounces
    const n = 6
    const ph = k * n
    const i = Math.floor(ph), f = ph - i
    const amp = 6 * Math.pow(0.55, i) * (1 - k * 0.3)
    const h = k >= 1 ? 0 : 4 * amp * f * (1 - f)
    const x = -14 * (1 - k)
    const ground0 = ground ? terrainHeight(ground, x, 0) : 0
    g.current.position.set(x, ground0 + 1.3 + h, 0)
    g.current.rotation.z += 0.05 * (1 - k)
    const sc = t > D ? Math.max(0.01, 1 - (t - D) * 1.5) : 1
    g.current.scale.set(sc, sc * (t > D ? 0.6 : 1), sc)
    g.current.visible = sc > 0.02
    if (h < 0.05 && last.current >= 0.05 && k < 1) onDust(new THREE.Vector3(x, ground0, 0))
    last.current = h
    motion.label = t < D ? 'AIRBAG BOUNCES' : t < D + 1 ? 'DEFLATING AIRBAGS' : ''
  })
  return (
    <group ref={g}>
      {balls.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[0.7, 20, 14]} />
          <meshStandardMaterial color="#e9e3d2" roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/* Mars 2020 sky crane lowering Perseverance, then dropping off Ingenuity */
function SkyCrane({
  act,
  ground,
  hideActor,
  emit,
}: {
  act: Act
  ground: Ground
  hideActor: React.RefObject<THREE.Group | null>
  emit: (p: THREE.Vector3, n: number) => void
}) {
  const { scene } = useGLTF('/models/perseverance.glb')
  const rover = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const sz = box.getSize(new THREE.Vector3())
    const s = 3 / Math.max(sz.x, sz.y, sz.z)
    const ctr = box.getCenter(new THREE.Vector3())
    const wrap = new THREE.Group()
    c.position.set(-ctr.x, -box.min.y, -ctr.z)
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true
    })
    wrap.add(c)
    wrap.scale.setScalar(s)
    return wrap
  }, [scene])
  const rv = useRef<THREE.Group>(null)
  const crane = useRef<THREE.Group>(null)
  const cables = useRef<THREE.Group>(null)
  const start = useRef(-1)
  const flames = useRef({ on: 0, pos: new THREE.Vector3() })
  const g0 = ground ? terrainHeight(ground, 0, 0) : 0
  useFrame(({ clock }) => {
    if (start.current < 0) start.current = clock.elapsedTime
    const t = clock.elapsedTime - start.current
    if (!rv.current || !crane.current || !cables.current) return
    if (act === 'skycrane') {
      if (hideActor.current) hideActor.current.visible = false
      const craneY = g0 + 9 - 2.5 * smooth(0, 4, t) + 12 * smooth(9, 13, t)
      const craneX = -10 * smooth(9, 13, t)
      const cable = 3.4 * smooth(3.5, 7.5, t)
      const roverY = t < 8 ? craneY - 1.2 - cable - 0.0 : g0
      crane.current.position.set(craneX, craneY, 0)
      rv.current.position.set(0, Math.max(g0, Math.min(roverY, craneY - 1.2)), 0)
      cables.current.visible = t < 8
      cables.current.scale.y = Math.max(0.01, craneY - 1.2 - rv.current.position.y - 2)
      cables.current.position.set(0, craneY - 1.2, 0)
      flames.current.on = t < 13 ? 1 : 0
      flames.current.pos.set(craneX, craneY - 0.4, 0)
      if (t > 4 && t < 9 && Math.random() < 0.9) emit(new THREE.Vector3((Math.random() - 0.5) * 6, g0, (Math.random() - 0.5) * 6), 2)
      motion.label = t < 3.5 ? 'POWERED DESCENT' : t < 7.5 ? 'SKY CRANE: LOWERING ROVER' : t < 9 ? 'TOUCHDOWN CONFIRMED' : 'FLYAWAY'
      crane.current.visible = t < 14
    } else {
      // dropoff: rover stands over Ingenuity, then drives away
      crane.current.visible = false
      cables.current.visible = false
      flames.current.on = 0
      if (hideActor.current) {
        hideActor.current.visible = true
        hideActor.current.position.y = g0 + 0.9 * (1 - smooth(0.5, 3.5, t))
      }
      rv.current.position.set(0, g0, 7 * smooth(4.5, 11, t))
      motion.label = t < 3.5 ? 'LOWERING INGENUITY' : t < 11 ? 'ROVER DRIVING AWAY' : 'ALONE ON MARS'
    }
  })
  return (
    <>
      <group ref={rv}>
        <primitive object={rover} />
      </group>
      <group ref={crane}>
        <mesh castShadow>
          <boxGeometry args={[2.6, 0.5, 2.0]} />
          <meshStandardMaterial color="#cfcfcb" metalness={0.6} roughness={0.4} />
        </mesh>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={sx + ':' + sz} position={[sx * 1.4, 0, sz * 1.1]} castShadow>
              <cylinderGeometry args={[0.18, 0.25, 0.5, 12]} />
              <meshStandardMaterial color="#5b5e63" metalness={0.7} />
            </mesh>
          )),
        )}
      </group>
      <group ref={cables}>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, -0.5, 0]}>
            <boxGeometry args={[0.02, 1, 0.02]} />
            <meshBasicMaterial color="#ddd" />
          </mesh>
        ))}
      </group>
      <Flame get={() => flames.current} length={1.8} radius={0.5} />
    </>
  )
}

function PathfinderLander({ y }: { y: number }) {
  return (
    <group position={[0, y, -4.5]} scale={2.4}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.5, 3]} />
        <meshStandardMaterial color="#d8c08a" metalness={0.6} roughness={0.4} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.95, 0.06, -Math.sin(a) * 0.95]} rotation={[-Math.PI / 2, 0, a - Math.PI / 2]} castShadow receiveShadow>
            <circleGeometry args={[0.95, 3]} />
            <meshStandardMaterial color="#1d2c4c" metalness={0.5} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
      {/* deflated airbags */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.3
        return (
          <mesh key={'b' + i} position={[Math.cos(a) * 1.3, 0.12, -Math.sin(a) * 1.3]} scale={[0.9, 0.18, 0.6]}>
            <sphereGeometry args={[0.5, 12, 8]} />
            <meshStandardMaterial color="#d9d2bf" roughness={0.9} />
          </mesh>
        )
      })}
      {/* IMP camera mast */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8]} />
        <meshStandardMaterial color="#aaa" />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.25, 0.15, 0.15]} />
        <meshStandardMaterial color="#ddd" />
      </mesh>
      {/* ramp */}
      <mesh position={[0, 0.12, 1.25]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.35, 0.02, 0.9]} />
        <meshStandardMaterial color="#b9b9b5" metalness={0.7} />
      </mesh>
    </group>
  )
}
