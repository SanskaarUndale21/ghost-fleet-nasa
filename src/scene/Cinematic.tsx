import { Html, Line, useGLTF, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CameraControls as CC } from '@react-three/drei'
import type { Artifact } from '../data/artifacts'
import type { Beat, Body, Craft } from '../data/missions'
import { Flame, Particles, type ParticlesHandle } from './Effects'
import { ArtifactModel, ModelFit, NASA_MODELS, newRig } from './Models'
import { motion, playback, smooth, useSimFrame } from './motionState'
import { fbm, latLonToVec } from './util'
import { SpaceSky } from './Worlds'
import { Earth, Sun, TEX } from './Planets'
import { LaunchTower, ProcRocket, getSpec, stage1Height } from './Rockets'

const useCtl = () => useThree((s) => s.controls) as unknown as CC | null

// cinematic scenes drive the camera themselves
function useDirector(fn: (t: number, cam: (px: number, py: number, pz: number, tx: number, ty: number, tz: number, rate?: number) => void) => void, key: unknown) {
  const ctl = useCtl()
  const start = useRef(-1)
  const camPos = useRef(new THREE.Vector3())
  const camTgt = useRef(new THREE.Vector3())
  const first = useRef(true)
  useEffect(() => {
    start.current = -1
    first.current = true
    if (!ctl) return
    ctl.enabled = false
    return () => {
      ctl.enabled = true
    }
  }, [ctl, key])
  // paused: hand the camera to the user; playing: the director drives it
  useFrame(() => {
    if (ctl) ctl.enabled = playback.paused
  })
  useSimFrame(({ clock }, dt) => {
    if (start.current < 0) start.current = clock.elapsedTime
    const t = clock.elapsedTime - start.current
    motion.t = t
    fn(t, (px, py, pz, tx, ty, tz, rate = 3) => {
      if (!ctl || playback.paused) return
      const k = first.current ? 1 : Math.min(1, dt * rate)
      first.current = false
      camPos.current.lerp(new THREE.Vector3(px, py, pz), k)
      camTgt.current.lerp(new THREE.Vector3(tx, ty, tz), k)
      ctl.setLookAt(camPos.current.x, camPos.current.y, camPos.current.z, camTgt.current.x, camTgt.current.y, camTgt.current.z, false)
    })
  })
}

/* ═════════════════════ ROCKETS (see Rockets.tsx) ═════════════════════ */
function SaturnV({ stage1 }: { stage1: React.RefObject<THREE.Group | null> }) {
  const { scene } = useGLTF('/models/saturn-v.glb')
  const { obj, s, off, lower } = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const sz = box.getSize(new THREE.Vector3())
    const s = 14 / sz.y
    const ctr = box.getCenter(new THREE.Vector3())
    const lower = new THREE.Group()
    c.add(lower)
    c.updateMatrixWorld(true)
    const cut = box.min.y + sz.y * 0.31 // S-IC first stage is the bottom ~30%
    const meshes: THREE.Mesh[] = []
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh)
    })
    for (const m of meshes) {
      m.castShadow = true
      const b = new THREE.Box3().setFromObject(m)
      if (b.getCenter(new THREE.Vector3()).y < cut) lower.attach(m)
    }
    return { obj: c, s, off: new THREE.Vector3(-ctr.x, -box.min.y, -ctr.z), lower }
  }, [scene])
  useEffect(() => {
    ;(stage1 as { current: THREE.Object3D | null }).current = lower
  }, [lower, stage1])
  return (
    <group scale={s}>
      <primitive object={obj} position={off} />
    </group>
  )
}

/* ═════════════════════ LAUNCH ═════════════════════ */
export function LaunchScene({ a, beat }: { a: Artifact; beat: Beat }) {
  const m = a.mission
  const rocket = useRef<THREE.Group>(null)
  const stage1 = useRef<THREE.Group | null>(null)
  const smoke = useRef<ParticlesHandle>(null)
  const sky = useRef<THREE.Mesh>(null)
  const ground = useRef<THREE.Group>(null)
  const earth = useRef<THREE.Group>(null)
  const skyGroup = useRef<THREE.Group>(null)
  const flame = useRef({ on: 0, pos: new THREE.Vector3(), dir: new THREE.Vector3(0, -1, 0) })
  const sep = useRef({ done: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), spin: 0 })
  const H = useMemo(() => {
    if (m.rocket === 'saturnv') return 14
    const sp = getSpec(m.rocket, m.rocketName)
    return sp.core.h + (sp.interstage?.h ?? 0) + sp.upper.h + (sp.fairing.boattail ?? 0) + sp.fairing.cyl + sp.fairing.nose
  }, [m])
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: { k: { value: 0 } },
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `uniform float k; varying vec3 vP; void main(){ float h = clamp(vP.y,0.,1.);
          vec3 low = vec3(0.72,0.84,0.95); vec3 high = vec3(0.22,0.45,0.82); vec3 c = mix(low, high, pow(h,0.5));
          gl_FragColor = vec4(c, 1.0 - k); }`,
      }),
    [],
  )
  const night = a.id === 'kepler'

  useDirector((t, cam) => {
    const g = rocket.current
    if (!g) return
    const T0 = 4
    const tl = Math.max(0, t - T0)
    const y = tl > 0 ? 0.9 * tl * tl : 0
    const x = Math.pow(y / 300, 2) * 110
    g.position.set(x, y, 0)
    g.rotation.z = -Math.min(0.9, Math.pow(y / 380, 1.5))
    const altK = smooth(40, 200, y)
    skyMat.uniforms.k.value = night ? 1 : altK
    if (ground.current) ground.current.visible = y < 250
    if (skyGroup.current) skyGroup.current.position.copy(g.position)
    if (earth.current) {
      earth.current.visible = y > 90
      earth.current.position.set(x, y - 600 - 25 - y * 0.25, 0)
    }
    // flame + smoke
    const ign = smooth(T0 - 1, T0, t)
    flame.current.on = ign * 1.4
    const up = new THREE.Vector3(0, 1, 0).applyEuler(g.rotation)
    const baseY = sep.current.done ? (m.rocket === 'saturnv' ? H * 0.31 : stage1Height(m.rocket, m.rocketName)) : 0
    flame.current.pos.set(0, baseY - 0.3, 0)
    const flameWorld = g.position.clone().addScaledVector(up, baseY - 0.3)
    if (ign > 0.1 && y < 30) {
      for (let i = 0; i < 4; i++)
        smoke.current?.emit({
          pos: new THREE.Vector3((Math.random() - 0.5) * 2, 0.4, (Math.random() - 0.5) * 2),
          count: 1,
          speed: 5,
          spread: 1.2,
          up: 0.25,
          size: 2.4,
          grow: 3,
          life: 5,
          color: '#e8e6e2',
          gravity: -0.3,
          drag: 0.6,
        })
    }
    if (ign > 0.1 && y >= 30 && Math.random() < 0.8)
      smoke.current?.emit({ pos: flameWorld.clone().addScaledVector(up, -2.5), count: 1, speed: 0.6, spread: 0.4, up: 0, size: 1.6, grow: 2, life: 4, color: '#d9d7d2', gravity: 0, drag: 1 })
    // staging
    const stageAt = 7.2
    const s1 = stage1.current
    if (s1) {
      if (tl > stageAt && !sep.current.done) {
        sep.current.done = true
        sep.current.pos.copy(g.position)
        sep.current.vel.set(up.x * 6, up.y * 6, 0)
        g.parent?.attach(s1)
      }
      if (sep.current.done) {
        sep.current.vel.y -= 9 * (1 / 60)
        s1.position.addScaledVector(sep.current.vel, 1 / 60)
        s1.rotation.z += 0.01
      }
    }
    motion.label =
      t < T0 - 1 ? `T-${Math.ceil(T0 - t)}` : t < T0 ? 'IGNITION' : tl < 2.5 ? 'LIFTOFF' : tl < 5 ? 'CLEAR OF THE TOWER' : tl < stageAt ? 'MAX Q' : tl < stageAt + 2 ? 'STAGE SEPARATION' : 'ON THE WAY TO SPACE'
    motion.sub = `${m.rocketName} · ${m.site}`

    // camera
    if (tl < 3) cam(16, 3, 22, 0, H * 0.45 + y, 0)
    else {
      const p = g.position
      const side = new THREE.Vector3(18 - Math.min(tl, 10) * 0.6, -6, 20)
      cam(p.x + side.x, p.y + side.y, p.z + side.z, p.x + up.x * H * 0.4, p.y + up.y * H * 0.4, p.z, 14)
    }
  }, beat)

  useEffect(() => {
    sep.current.done = false
    if (stage1.current && rocket.current && stage1.current.parent !== rocket.current) {
      // rebuild happens via remount key
    }
  }, [beat])

  return (
    <>
      <group ref={skyGroup}>
        <SpaceSky />
        <mesh ref={sky} material={skyMat}>
          <sphereGeometry args={[380, 32, 16]} />
        </mesh>
      </group>
      <hemisphereLight args={['#cfe3ff', '#4a5a3a', night ? 0.25 : 0.9]} />
      <directionalLight position={[40, 60, 30]} intensity={night ? 0.4 : 2.4} castShadow shadow-mapSize={[1024, 1024]} />
      <group ref={ground}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[300, 48]} />
          <meshStandardMaterial color={m.site.includes('California') ? '#8f8a63' : '#5f7550'} roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-160, 0.05, 0]}>
          <planeGeometry args={[200, 600]} />
          <meshStandardMaterial color="#2c5c80" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* pad + tower */}
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <cylinderGeometry args={[6, 7, 0.4, 32]} />
          <meshStandardMaterial color="#9b9a95" roughness={1} />
        </mesh>
        {m.rocket === 'saturnv' && (
          <group position={[-70, 0, -150]} rotation={[0, 0.5, 0]}>
            <Suspense fallback={null}>
              <ModelFit url={NASA_MODELS.vab} size={30} anchor="bottom" />
            </Suspense>
          </group>
        )}
        <LaunchTower height={H * 1.08} color={m.rocket === 'saturnv' ? '#b5432f' : '#8a8d93'} side={-1} />
        {/* flame trench + lightning masts + water tower */}
        <mesh position={[0, 0.41, 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 4]} />
          <meshStandardMaterial color="#2a2a28" roughness={1} />
        </mesh>
        {[[-7, -6], [7, -6], [7, 6], [-7, 6]].map(([x, z], i) => (
          <mesh key={i} position={[x, H * 0.75, z]}>
            <cylinderGeometry args={[0.05, 0.12, H * 1.5, 8]} />
            <meshStandardMaterial color="#9a9ca1" />
          </mesh>
        ))}
        <group position={[16, 0, -14]}>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.15, 0.4, 8, 8]} />
            <meshStandardMaterial color="#c9c9c4" />
          </mesh>
          <mesh position={[0, 8.6, 0]}>
            <sphereGeometry args={[1.4, 24, 16]} />
            <meshStandardMaterial color="#e8e8e3" />
          </mesh>
        </group>
        {night &&
          [0, 1, 2, 3].map((i) => (
            <pointLight key={i} position={[Math.cos(i * 1.6) * 8, 6, Math.sin(i * 1.6) * 8]} intensity={18} distance={30} color="#fff2cc" />
          ))}
      </group>
      <group ref={earth} visible={false}>
        <Earth r={600} sunDir={new THREE.Vector3(0.6, 0.5, 0.6)} spin={0} tilt={0} />
      </group>
      <group ref={rocket} key={a.id + beat.title}>
        <Suspense fallback={null}>
          {m.rocket === 'saturnv' ? (
            <SaturnV stage1={stage1} />
          ) : (
            <ProcRocket kind={m.rocket} variant={m.rocketName} stage1={stage1} />
          )}
        </Suspense>
        <Flame get={() => flame.current} length={m.rocket === 'saturnv' ? 6 : 4.5} radius={m.rocket === 'saturnv' ? 0.75 : 0.45} />
      </group>
      <Particles ref={smoke} />
    </>
  )
}

/* ═════════════════════ CRAFTS ═════════════════════ */
function Aeroshell({ cruiseStage = true }: { cruiseStage?: boolean }) {
  return (
    <group rotation={[0, 0, 0]}>
      {/* heat shield */}
      <mesh position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[1.3, 0.55, 40]} />
        <meshStandardMaterial color="#6e4a33" roughness={0.9} />
      </mesh>
      {/* backshell */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.55, 1.3, 0.75, 40]} />
        <meshStandardMaterial color="#e9e7e1" roughness={0.6} metalness={0.2} />
      </mesh>
      {cruiseStage && (
        <group position={[0, 0.85, 0]}>
          <mesh>
            <cylinderGeometry args={[1.25, 1.25, 0.18, 40]} />
            <meshStandardMaterial color="#1c2a48" metalness={0.6} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.25, 0.4, 0.3, 16]} />
            <meshStandardMaterial color="#c9a24a" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function ApolloStack({ lmOffset = 0 }: { lmOffset?: number }) {
  const { scene } = useGLTF('/models/apollo-lm.glb')
  const lm = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const s = 1.6 / box.getSize(new THREE.Vector3()).y
    const ctr = box.getCenter(new THREE.Vector3())
    const w = new THREE.Group()
    c.position.set(-ctr.x, -box.max.y, -ctr.z)
    w.add(c)
    w.scale.setScalar(s)
    return w
  }, [scene])
  return (
    <group>
      {/* CSM: service module + command module cone + engine bell; nose points +y */}
      <mesh position={[0, -1.2, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 32]} />
        <meshStandardMaterial color="#d7d8da" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -2.25, 0]}>
        <cylinderGeometry args={[0.18, 0.42, 0.55, 20, 1, true]} />
        <meshStandardMaterial color="#555" metalness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.05, 0]} castShadow>
        <coneGeometry args={[0.5, 0.75, 32]} />
        <meshStandardMaterial color="#e3e3df" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* LM docked nose to nose, flipped */}
      <group position={[0, 0.35 + lmOffset, 0]} rotation={[Math.PI, 0, 0]}>
        <primitive object={lm} position={[0, -0.05, 0]} />
      </group>
    </group>
  )
}

function CraftModel({ a, craft, lmOffset }: { a: Artifact; craft: Craft; lmOffset?: number }) {
  const rig = useMemo(() => newRig(), [])
  if (craft === 'aeroshell') return <Aeroshell />
  if (craft === 'apollo') return <ApolloStack lmOffset={lmOffset} />
  return <ArtifactModel spec={a.model} grounded={false} rig={rig} />
}

/* ═════════════════════ BODIES ═════════════════════ */
function useBodyTex(body: Body) {
  const [moon, mars, jup] = useTexture([TEX.moon, TEX.mars, TEX.jupiter])
  for (const t of [moon, mars, jup]) t.colorSpace = THREE.SRGBColorSpace
  return body === 'mars' ? mars : body === 'jupiter' ? jup : body === 'sun' ? null : moon
}

function BodyMesh({ body, r }: { body: Body; r: number }) {
  const tex = useBodyTex(body)
  const geo = useMemo(() => {
    if (body !== 'eros' && body !== 'vesta') return new THREE.SphereGeometry(r, 96, 64)
    const g = new THREE.IcosahedronGeometry(r, 20)
    const p = g.attributes.position as THREE.BufferAttribute
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      const n = v.clone().normalize()
      const k = 1 + (fbm(n.x * 3 + 5, n.z * 3 + n.y * 2, 4) - 0.5) * (body === 'eros' ? 0.35 : 0.18)
      v.copy(n.multiplyScalar(r * k))
      if (body === 'eros') {
        v.x *= 2.1
        v.y *= 0.8
      } else v.y *= 0.82
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [body, r])
  const color = body === 'ceres' ? '#8d8a86' : body === 'vesta' ? '#a49c90' : body === 'eros' ? '#a08a6c' : '#ffffff'
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial map={tex} color={color} roughness={1} flatShading={body === 'eros'} />
      </mesh>
      {body === 'ceres' &&
        [
          [20, 220, 0.5],
          [21, 224, 0.25],
        ].map(([la, lo, s], i) => (
          <mesh key={i} position={latLonToVec(la, lo, r * 1.002)}>
            <sphereGeometry args={[s, 12, 8]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        ))}
    </group>
  )
}

/* ═════════════════════ CRUISE ═════════════════════ */
const DEST_R: Record<Body, number> = { moon: 2.2, mars: 3, vesta: 1.2, ceres: 1.8, eros: 0.7, jupiter: 9, sun: 6 }
const DAYS: Record<string, number> = {
  surveyor: 3, eagle: 4, alsep: 4, lrv: 4, viking: 304, sojourner: 212, spirit: 208, opportunity: 202,
  phoenix: 295, insight: 205, ingenuity: 203, pioneer: 641, near: 1458, dawn: 1388, kepler: 60,
}

export function CruiseScene({ a, beat }: { a: Artifact; beat: Beat }) {
  const m = a.mission
  const craft = useRef<THREE.Group>(null)
  const ion = useRef<ParticlesHandle>(null)
  const dest: Body = m.dest === 'sun' ? 'sun' : m.dest === 'ceres' ? 'vesta' : m.dest
  const E = useMemo(() => new THREE.Vector3(-34, 0, 0), [])
  const D = useMemo(() => new THREE.Vector3(34, 0, -6), [])
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(E.clone().add(new THREE.Vector3(4, 0, 0)), new THREE.Vector3(0, 6, 18), D.clone().add(new THREE.Vector3(-DEST_R[dest] - 3, 0, 0))), [E, D, dest])
  const pts = useMemo(() => curve.getPoints(120), [curve])
  const belt = useMemo(() => {
    if (!['pioneer', 'near', 'dawn'].includes(a.id)) return []
    const out: [number, number, number, number][] = []
    for (let i = 0; i < 160; i++) {
      const u = 0.35 + Math.random() * 0.4
      const p = curve.getPoint(u)
      out.push([p.x + (Math.random() - 0.5) * 14, p.y + (Math.random() - 0.5) * 6, p.z + (Math.random() - 0.5) * 14, 0.05 + Math.random() * 0.25])
    }
    return out
  }, [a.id, curve])
  const DUR = 16

  useDirector((t, cam) => {
    const u = smooth(0, DUR, t)
    const p = curve.getPoint(u)
    const tan = curve.getTangent(u)
    if (craft.current) {
      craft.current.position.copy(p)
      craft.current.lookAt(p.clone().add(tan))
      craft.current.rotateX(Math.PI / 2)
    }
    motion.days = DAYS[a.id] ?? 100
    motion.day = Math.max(1, Math.round(u * motion.days))
    motion.label = u < 0.15 ? 'LEAVING EARTH' : u < 0.85 ? 'CRUISE' : 'APPROACHING ' + (m.dest === 'sun' ? 'SOLAR ORBIT' : m.dest.toUpperCase())
    motion.sub = `${beat.date ?? ''}`
    if (a.id === 'dawn' && Math.random() < 0.9)
      ion.current?.emit({ pos: p.clone().addScaledVector(tan, -1.2), count: 2, speed: 3, spread: 0.08, up: 0, dir: tan.clone().multiplyScalar(-1), size: 0.25, life: 1.2, color: '#6fb6ff', gravity: 0, drag: 0 })
    // early: look back at Earth over the craft; later: look ahead to the destination
    const fwd = smooth(0.22, 0.42, u) * 2 - 1
    const side = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize()
    const cpos = p.clone().addScaledVector(tan, -fwd * 8).addScaledVector(side, 4).add(new THREE.Vector3(0, 2.2, 0))
    const tgt = p.clone().addScaledVector(tan, fwd * 6)
    cam(cpos.x, cpos.y, cpos.z, tgt.x, tgt.y, tgt.z, 2)
  }, beat)

  return (
    <>
      <SpaceSky />
      <ambientLight intensity={0.2} />
      <directionalLight position={[-20, 10, 30]} intensity={2.4} />
      <group position={E}>
        <Earth r={4} sunDir={new THREE.Vector3(-0.6, 0.3, 0.75)} spin={0.03} />
        <Html position={[0, -5.2, 0]} center className="space-tag">
          Earth
        </Html>
      </group>
      <group position={D}>
        {dest === 'sun' ? (
          <Sun r={DEST_R.sun} />
        ) : (
          <Suspense fallback={null}>
            <BodyMesh body={dest} r={DEST_R[dest]} />
          </Suspense>
        )}
        <Html position={[0, -DEST_R[dest] - 1.2, 0]} center className="space-tag">
          {dest === 'sun' ? 'Sun' : m.dest === 'ceres' ? 'Vesta, then Ceres' : dest[0].toUpperCase() + dest.slice(1)}
        </Html>
      </group>
      <Line points={pts} color="#7dffd0" lineWidth={1.2} dashed dashSize={0.6} gapSize={0.4} transparent opacity={0.6} />
      {belt.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[i, i * 2, 0]}>
          <dodecahedronGeometry args={[s, 0]} />
          <meshStandardMaterial color="#7d7468" roughness={1} flatShading />
        </mesh>
      ))}
      <group ref={craft}>
        <group scale={m.craft === 'self' ? 0.55 : 0.8}>
          <Suspense fallback={null}>
            <CraftModel a={a} craft={m.craft} />
          </Suspense>
        </group>
      </group>
      <Particles ref={ion} additive />
    </>
  )
}

/* ═════════════════════ MARS ENTRY ═════════════════════ */
export function EntryScene({ a, beat }: { a: Artifact; beat: Beat }) {
  const capsule = useRef<THREE.Group>(null)
  const shield = useRef<THREE.Group>(null)
  const chute = useRef<THREE.Group>(null)
  const plasma = useRef<THREE.Mesh>(null)
  const mars = useRef<THREE.Group>(null)
  const streaks = useRef<ParticlesHandle>(null)
  const atmo = useRef<THREE.Mesh>(null)
  const airbags = a.id === 'sojourner' || a.id === 'spirit' || a.id === 'opportunity'
  useDirector((t, cam) => {
    const heat = smooth(0.5, 2.5, t) * (1 - smooth(6, 7.5, t))
    if (plasma.current) {
      plasma.current.visible = heat > 0.02
      plasma.current.scale.setScalar(1 + Math.sin(t * 30) * 0.03)
      ;(plasma.current.material as THREE.MeshBasicMaterial).opacity = heat * 0.22
    }
    if (heat > 0.1)
      for (let i = 0; i < 6; i++)
        streaks.current?.emit({ pos: new THREE.Vector3((Math.random() - 0.5) * 2.6, -0.6, (Math.random() - 0.5) * 2.6), count: 1, speed: 9, spread: 0.1, up: 1, size: 0.18, life: 0.7, color: '#ffb066', gravity: 0, drag: 0 })
    const chuteK = smooth(8, 9, t)
    if (chute.current) {
      chute.current.visible = t > 8
      chute.current.scale.set(chuteK, 0.5 + chuteK * 0.5, chuteK)
    }
    if (shield.current) {
      const ft = Math.max(0, t - 10.5)
      shield.current.position.y = -0.25 - ft * ft * 1.5
      shield.current.rotation.x = ft * 0.6
    }
    if (capsule.current) {
      capsule.current.rotation.z = 0.35 * (1 - smooth(7, 9, t)) + Math.sin(t * 2) * 0.03 * chuteK
    }
    if (mars.current) mars.current.position.y = -205 + smooth(0, 14, t) * 55
    if (atmo.current) (atmo.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + smooth(6, 12, t) * 0.5
    motion.label = t < 1 ? 'ATMOSPHERIC ENTRY' : t < 7 ? 'PEAK HEATING' : t < 8 ? 'SLOWING DOWN' : t < 10.5 ? 'PARACHUTE DEPLOYED' : t < 12.5 ? 'HEAT SHIELD SEPARATION' : airbags ? 'AIRBAGS NEXT' : 'RADAR LOCK ON GROUND'
    motion.sub = a.mission.rocketName + ' launch · ' + (beat.date ?? '')
    const ang = t * 0.12
    const d = t < 8 ? 7 : 17
    cam(Math.cos(ang) * d, 1.5 + (t > 8 ? 2 : 0), Math.sin(ang) * d, 0, t > 8 ? 3.5 : 0, 0)
  }, beat)
  return (
    <>
      <color attach="background" args={['#120a08']} />
      <SpaceSky dim={0.4} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 10]} intensity={2.2} color="#ffe7cf" />
      <group ref={mars}>
        <Suspense fallback={null}>
          <group rotation={[0.3, 0, 0]}>
            <BodyMesh body="mars" r={140} />
          </group>
        </Suspense>
        <mesh ref={atmo}>
          <sphereGeometry args={[146, 64, 32]} />
          <meshBasicMaterial color="#d99566" transparent opacity={0.3} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      </group>
      <group ref={capsule}>
        <group ref={shield}>
          <mesh position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[1.3, 0.55, 40]} />
            <meshStandardMaterial color="#5f3d2a" roughness={0.9} emissive="#ff5a1a" emissiveIntensity={0.6} />
          </mesh>
        </group>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.55, 1.3, 0.75, 40]} />
          <meshStandardMaterial color="#e9e7e1" roughness={0.6} />
        </mesh>
        <mesh ref={plasma} position={[0, -0.35, 0]} scale={1}>
          <sphereGeometry args={[1.45, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshBasicMaterial color="#ff4d1a" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <group ref={chute} position={[0, 0.8, 0]} visible={false}>
          {Array.from({ length: 12 }).map((_, i) => {
            const ang = (i / 12) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(ang) * 1.6, 3, Math.sin(ang) * 1.6]} rotation={[0, -ang, Math.atan2(1.6, 3)]}>
                <boxGeometry args={[0.01, 6.8, 0.01]} />
                <meshBasicMaterial color="#cccccc" />
              </mesh>
            )
          })}
          <mesh position={[0, 6.2, 0]}>
            <sphereGeometry args={[3.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
            <meshStandardMaterial color="#f2f0ea" side={THREE.DoubleSide} roughness={0.8} />
          </mesh>
          {[0, 2, 4].map((k) => (
            <mesh key={k} position={[0, 6.21, 0]} rotation={[0, (k / 6) * Math.PI * 2, 0]}>
              <sphereGeometry args={[3.42, 24, 12, 0, Math.PI / 3, 0, Math.PI / 2.4]} />
              <meshStandardMaterial color="#d8642b" side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      </group>
      <Particles ref={streaks} additive />
      {a.id === 'phoenix' && (
        <group position={[-3, 2.5, 2.2]} rotation={[0.4, 0.8, 0]}>
          <Suspense fallback={null}>
            <ModelFit url={NASA_MODELS.mro} size={2.4} />
          </Suspense>
          <Html position={[0, -1.6, 0]} center className="model-tag">
            <b>Mars Reconnaissance Orbiter</b>
            <span>photographing Phoenix under its parachute</span>
          </Html>
        </group>
      )}
    </>
  )
}

/* ═════════════════════ ORBIT ═════════════════════ */
export function OrbitScene({ a, beat }: { a: Artifact; beat: Beat }) {
  const body = beat.body ?? 'moon'
  const craft = useRef<THREE.Group>(null)
  const ion = useRef<ParticlesHandle>(null)
  const R = body === 'eros' ? 3.2 : 9
  const orbitR = body === 'eros' ? 9 : 13
  const apollo = a.mission.craft === 'apollo'
  const lmRef = useRef(0)
  useDirector((t, cam) => {
    const ang = -0.6 + t * 0.06
    const p = new THREE.Vector3(Math.cos(ang) * orbitR, 1.2, Math.sin(ang) * orbitR)
    if (craft.current) {
      craft.current.position.copy(p)
      craft.current.rotation.set(0, -ang, Math.PI / 2)
    }
    lmRef.current = apollo ? smooth(3, 10, t) * 1.6 : 0
    if (a.id === 'dawn' && Math.random() < 0.9) {
      const tan = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang))
      ion.current?.emit({ pos: p.clone().addScaledVector(tan, -1), count: 2, speed: 3, spread: 0.06, up: 0, dir: tan.clone().multiplyScalar(-1), size: 0.22, life: 1.2, color: '#6fb6ff', gravity: 0, drag: 0 })
    }
    motion.label =
      apollo ? (t < 3 ? 'LUNAR ORBIT' : t < 10 ? 'UNDOCKING' : 'DESCENT ORBIT') : body === 'eros' ? 'ORBITING 433 EROS' : `IN ORBIT · ${body.toUpperCase()}`
    motion.sub = beat.date ?? ''
    const out = p.clone().setY(0).normalize()
    const tan = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang))
    const c = p.clone().addScaledVector(out, 5).addScaledVector(tan, -6).add(new THREE.Vector3(0, 2.4, 0))
    cam(c.x, c.y, c.z, p.x * 0.7, p.y * 0.5, p.z * 0.7)
  }, beat)
  return (
    <>
      <SpaceSky />
      <ambientLight intensity={0.15} />
      <directionalLight position={[30, 10, 20]} intensity={2.8} />
      <Suspense fallback={null}>
        <group rotation={[0.2, 0, 0]}>
          <BodyMesh body={body} r={R} />
        </group>
      </Suspense>
      {body === 'mars' && <mesh><sphereGeometry args={[R * 1.03, 64, 32]} /><meshBasicMaterial color="#e39a6a" transparent opacity={0.12} side={THREE.BackSide} /></mesh>}
      <group ref={craft}>
        <group scale={apollo ? 0.9 : a.mission.craft === 'aeroshell' ? 0.6 : 0.55}>
          <Suspense fallback={null}>
            {apollo ? <ApolloSep lm={lmRef} /> : <CraftModel a={a} craft={a.id === 'viking' ? 'aeroshell' : 'self'} />}
          </Suspense>
        </group>
      </group>
      <Particles ref={ion} additive />
    </>
  )
}

function ApolloSep({ lm }: { lm: { current: number } }) {
  const g = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/apollo-lm.glb')
  const lmObj = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const s = 1.6 / box.getSize(new THREE.Vector3()).y
    const ctr = box.getCenter(new THREE.Vector3())
    const w = new THREE.Group()
    c.position.set(-ctr.x, -box.max.y, -ctr.z)
    w.add(c)
    w.scale.setScalar(s)
    return w
  }, [scene])
  useSimFrame(() => {
    if (g.current) g.current.position.y = 0.3 + lm.current
  })
  return (
    <group>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 32]} />
        <meshStandardMaterial color="#d7d8da" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <coneGeometry args={[0.5, 0.75, 32]} />
        <meshStandardMaterial color="#e3e3df" metalness={0.9} roughness={0.2} />
      </mesh>
      <group ref={g} rotation={[Math.PI, 0, 0]}>
        <primitive object={lmObj} />
      </group>
    </group>
  )
}

/* ═════════════════════ JUPITER FLYBY ═════════════════════ */
export function FlybyScene({ a, beat }: { a: Artifact; beat: Beat }) {
  const craft = useRef<THREE.Group>(null)
  const voyager = useRef<THREE.Group>(null)
  const legacy = beat.phase === 'Legacy'
  useDirector((t, cam) => {
    const u = t / 18
    const p = new THREE.Vector3(14 - u * 30, 2, 22 - u * 6)
    if (craft.current) {
      craft.current.position.copy(p)
      craft.current.rotation.y = t * 0.4
    }
    if (voyager.current) {
      voyager.current.position.set(p.x + 5 - t * 0.4, p.y + 1.5, p.z - 3)
      voyager.current.rotation.y = -t * 0.3
    }
    motion.label = legacy ? 'GRAVITY ASSIST' : t < 6 ? 'APPROACH' : t < 12 ? 'CLOSEST APPROACH · INTENSE RADIATION' : 'DEPARTING JUPITER'
    motion.sub = beat.date ?? ''
    cam(p.x + 6, p.y + 2, p.z + 7, p.x * 0.5, 0, p.z * 0.2 - 6)
  }, beat)
  return (
    <>
      <SpaceSky />
      <ambientLight intensity={0.12} />
      <directionalLight position={[60, 10, 40]} intensity={2.6} />
      <group position={[0, -2, -20]} rotation={[0.05, 0, 0.05]}>
        <BodyMesh body="jupiter" r={22} />
      </group>
      {legacy && (
        <group position={[-60, 6, -40]}>
          <mesh>
            <sphereGeometry args={[5, 48, 32]} />
            <meshStandardMaterial color="#e0cc98" roughness={1} />
          </mesh>
          <mesh rotation={[1.2, 0, 0.2]}>
            <ringGeometry args={[7, 12, 64]} />
            <meshBasicMaterial color="#d8c69a" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
          <Html position={[0, -8, 0]} center className="space-tag">
            Saturn (Pioneer 11, 1979)
          </Html>
        </group>
      )}
      <group ref={craft}>
        <group scale={0.6}>
          <Suspense fallback={null}>
            <CraftModel a={a} craft="self" />
          </Suspense>
        </group>
      </group>
      {legacy && (
        <group ref={voyager}>
          <Suspense fallback={null}>
            <ModelFit url={NASA_MODELS.voyager} size={3.4} />
          </Suspense>
          <Html position={[0, -2.4, 0]} center className="model-tag">
            <b>Voyager 1 &amp; 2</b>
            <span>Launched 1977, followed the path Pioneer opened</span>
          </Html>
        </group>
      )}
    </>
  )
}

/* ═════════════════════ INTERIOR CUTAWAY ═════════════════════ */
export function InteriorScene({ beat }: { beat: Beat }) {
  const body = beat.body ?? 'mars'
  const tex = useBodyTex(body)
  const L = body === 'mars' ? { crust: 1, mantle: 0.95, core: 0.54 } : { crust: 1, mantle: 0.96, core: 0.2 }
  const R = 6
  const waves = useRef<THREE.Group>(null)
  // open wedge faces direction (-1, 0, -1); quake source sits near its rim
  const cutDir = useMemo(() => new THREE.Vector3(-1, 0, -1).normalize(), [])
  const src = useMemo(() => new THREE.Vector3(-0.2, 0.75, -0.62).normalize().multiplyScalar(R), [])
  useDirector((t, cam) => {
    const ang = Math.PI * 1.25 + Math.sin(t * 0.15) * 0.35
    cam(Math.cos(ang) * 17, 5, Math.sin(ang) * 17, 0, 0, 0)
    if (waves.current) {
      waves.current.children.forEach((c, i) => {
        const k = ((t * 0.35 + i / 3) % 1)
        c.scale.setScalar(0.01 + k * R * 1.9)
        ;((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.22
      })
    }
    motion.label = 'SEISMIC WAVES REVEAL THE LAYERS'
    motion.sub = body === 'mars' ? 'Core radius ~1,830 km of 3,390 km' : 'Small iron core, ~20% of the radius'
  }, beat)
  const cut = { phiStart: 0, phiLength: Math.PI * 1.5 }
  const shell = (r: number, color: string, map?: THREE.Texture | null) => (
    <mesh>
      <sphereGeometry args={[r, 96, 64, cut.phiStart, cut.phiLength]} />
      <meshStandardMaterial color={color} map={map ?? null} side={THREE.DoubleSide} roughness={1} />
    </mesh>
  )
  return (
    <>
      <SpaceSky />
      <ambientLight intensity={0.5} />
      <directionalLight position={[20, 10, 15]} intensity={2.2} />
      {shell(R * L.crust, '#ffffff', tex)}
      {shell(R * L.mantle, body === 'mars' ? '#b0532c' : '#8a6a4a')}
      <mesh>
        <sphereGeometry args={[R * L.core, 64, 48]} />
        <meshStandardMaterial color={body === 'mars' ? '#f2b43a' : '#d99a3a'} emissive="#b05a10" emissiveIntensity={0.5} />
      </mesh>
      <group ref={waves} position={src}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 32, 16]} />
            <meshBasicMaterial color="#7dffd0" transparent opacity={0.3} depthWrite={false} side={THREE.BackSide} />
          </mesh>
        ))}
      </group>
      <mesh position={src}>
        <sphereGeometry args={[0.15, 12, 8]} />
        <meshBasicMaterial color="#7dffd0" toneMapped={false} />
      </mesh>
      <Html position={src.clone().multiplyScalar(1.15)} center className="space-tag">
        {body === 'mars' ? 'InSight' : 'Apollo seismometers'}
      </Html>
      <Html position={cutDir.clone().multiplyScalar(R * 1.02).add(new THREE.Vector3(0, -R * 0.35, 0))} center className="layer-tag">
        Crust
      </Html>
      <Html position={cutDir.clone().multiplyScalar(R * (L.mantle + L.core) * 0.5).add(new THREE.Vector3(0, -R * 0.15, 0))} center className="layer-tag">
        Mantle
      </Html>
      <Html position={cutDir.clone().multiplyScalar(R * L.core * 0.3)} center className="layer-tag core">
        Core
      </Html>
    </>
  )
}

/* ═════════════════════ EXOPLANET TRANSIT ═════════════════════ */
export function TransitScene({ beat }: { beat: Beat }) {
  const many = beat.phase !== 'Mission'
  const planets = useMemo(
    () =>
      (many
        ? [
            { r: 0.7, a: 9, p: 8, c: '#3b6fb6' },
            { r: 0.45, a: 12, p: 13, c: '#c98b5a' },
            { r: 1.0, a: 15.5, p: 21, c: '#8fb4c9' },
          ]
        : [{ r: 0.8, a: 10, p: 9, c: '#3b6fb6' }]
      ).map((x) => ({ ...x, ph: Math.random() })),
    [many],
  )
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const STAR = 5
  useDirector((t, cam) => {
    let blocked = 0
    planets.forEach((pl, i) => {
      const ang = ((t / pl.p + pl.ph) % 1) * Math.PI * 2
      const x = Math.cos(ang) * pl.a
      const z = Math.sin(ang) * pl.a
      const m = refs.current[i]
      if (m) m.position.set(x, 0, z)
      if (z > 0 && Math.abs(x) < STAR + pl.r) {
        const ov = Math.min(1, (STAR + pl.r - Math.abs(x)) / (2 * pl.r))
        blocked += ov * (pl.r * pl.r) / (STAR * STAR)
      }
    })
    motion.flux = 1 - blocked
    motion.label = blocked > 0.001 ? 'TRANSIT: STAR DIMMING' : 'WATCHING STARLIGHT'
    motion.sub = many ? 'Multi-planet system' : 'One planet, one star'
    cam(0, 2.2, 30, 0, 0, 0)
  }, beat)
  return (
    <>
      <SpaceSky />
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 0, 0]} intensity={300} distance={80} color="#fff1d0" />
      <Sun r={STAR} glow={0.8} />
      {planets.map((pl, i) => (
        <group key={i}>
          <mesh ref={(m) => { refs.current[i] = m }}>
            <sphereGeometry args={[pl.r, 32, 24]} />
            <meshStandardMaterial color={pl.c} roughness={0.9} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[pl.a, 0.015, 6, 160]} />
            <meshBasicMaterial color="#7d8aa6" transparent opacity={0.35} />
          </mesh>
        </group>
      ))}
    </>
  )
}

useGLTF.preload('/models/saturn-v.glb')

/* ═════════════════════ LEGACY: the missions that followed ═════════════════════ */
const SUCCESSORS: Record<string, { url: string; label: string; sub: string; size: number }> = {
  osiris: { url: NASA_MODELS.osiris, label: 'OSIRIS-REx', sub: 'Touched asteroid Bennu in 2020, samples landed 2023', size: 3.2 },
  bennu: { url: NASA_MODELS.bennu, label: 'Asteroid Bennu', sub: 'about 500 m wide', size: 6 },
  tess: { url: NASA_MODELS.tess, label: 'TESS', sub: 'Planet hunter launched 2018, scans almost the whole sky', size: 3 },
  jwst: { url: NASA_MODELS.jwst, label: 'James Webb Space Telescope', sub: 'Studies exoplanet atmospheres since 2022', size: 5.5 },
}
export function LegacyScene({ a, beat }: { a: Artifact; beat: Beat }) {
  const list = (beat.with ?? []).map((k) => SUCCESSORS[k])
  const g = useRef<THREE.Group>(null)
  useDirector((t, cam) => {
    const ang = -0.5 + t * 0.06
    cam(Math.sin(ang) * 16, 3 + Math.sin(t * 0.2), Math.cos(ang) * 16, 0, 0.3, 0)
    if (g.current) g.current.children.forEach((c, i) => (c.rotation.y = t * (0.15 + i * 0.05)))
    motion.label = 'THE MISSIONS THAT FOLLOWED'
    motion.sub = `${a.name} → ${list.map((x) => x.label).join(' + ')}`
  }, beat)
  const pos: [number, number, number][] = list.length === 2 ? [[-4.2, 0, 0], [4.2, 0, -1]] : [[0, 0, 0]]
  return (
    <>
      <SpaceSky />
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 8, 10]} intensity={2.6} />
      <directionalLight position={[-10, -4, -6]} intensity={0.6} color="#8fb4ff" />
      <group ref={g}>
        {list.map((m, i) => (
          <group key={m.label} position={pos[i]}>
            <Suspense fallback={null}>
              <ModelFit url={m.url} size={m.size} />
            </Suspense>
          </group>
        ))}
      </group>
      {list.map((m, i) => (
        <Html key={m.label} position={[pos[i][0], -m.size * 0.55 - 0.8, pos[i][2]]} center className="model-tag">
          <b>{m.label}</b>
          <span>{m.sub}</span>
        </Html>
      ))}
      <group position={[0, 4.4, -6]} scale={0.35}>
        <Suspense fallback={null}>
          <CraftModel a={a} craft="self" />
        </Suspense>
      </group>
      <Html position={[0, 3.2, -6]} center className="model-tag dim">
        <b>{a.name}</b>
      </Html>
    </>
  )
}

/* ═════════════════════ DEEP SPACE NETWORK: listening for a faint signal ═════════════════════ */
export function DsnScene({ a, beat }: { a: Artifact; beat: Beat }) {
  const waves = useRef<THREE.Group>(null)
  useDirector((t, cam) => {
    const ang = 0.8 + t * 0.03
    cam(Math.cos(ang) * 30, 9, Math.sin(ang) * 30, 0, 7, 0)
    const fade = Math.max(0, 1 - t / 12)
    if (waves.current)
      waves.current.children.forEach((c, i) => {
        const k = (t * 0.25 + i / 4) % 1
        c.position.y = 16 + (1 - k) * 40
        c.scale.setScalar(0.5 + (1 - k) * 2)
        ;((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = k * 0.6 * fade
      })
    motion.signal = t > 12 ? 0 : 1
    motion.label = t < 6 ? 'DEEP SPACE NETWORK · LISTENING' : t < 12 ? 'SIGNAL VERY FAINT' : 'NO SIGNAL'
    motion.sub = `70 m antenna, Goldstone, California · ${a.name}`
  }, beat)
  return (
    <>
      <SpaceSky dim={1.2} />
      <hemisphereLight args={['#5b6c99', '#2a2219', 0.6]} />
      <directionalLight position={[-20, 15, 10]} intensity={0.9} color="#c8d4ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[200, 48]} />
        <meshStandardMaterial color="#5a4a3a" roughness={1} />
      </mesh>
      {[[-60, -90], [70, -110], [-120, -40]].map(([x, z], i) => (
        <mesh key={i} position={[x, 6, z]} scale={[30, 12, 18]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#3a3026" roughness={1} flatShading />
        </mesh>
      ))}
      <Suspense fallback={null}>
        <ModelFit url={NASA_MODELS.dsn} size={18} anchor="bottom" />
      </Suspense>
      <group ref={waves}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.5, 0.05, 6, 48]} />
            <meshBasicMaterial color="#7dffd0" transparent opacity={0.4} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </>
  )
}
