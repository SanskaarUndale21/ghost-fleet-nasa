import { Html, Line, Stars, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { CameraControls as CC } from '@react-three/drei'
import { ARTIFACTS, type Artifact, type World } from '../data/artifacts'
import type { Act, Beat } from '../data/missions'
import { Actor } from './Actor'
import { Weather } from './Effects'
import { motion } from './motionState'
import { fbm, latLonToVec, terrainHeight } from './util'

type Ctl = CC | null
const useCtl = () => useThree((s) => s.controls) as unknown as Ctl

/* ───────────── shared sky ───────────── */
export function SpaceSky({ dim = 1 }: { dim?: number }) {
  const tex = useTexture('/textures/stars.jpg')
  tex.colorSpace = THREE.SRGBColorSpace
  return (
    <>
      <mesh scale={-1} renderOrder={-1}>
        <sphereGeometry args={[400, 48, 32]} />
        <meshBasicMaterial map={tex} side={THREE.BackSide} color={new THREE.Color(0.55 * dim, 0.55 * dim, 0.6 * dim)} depthWrite={false} toneMapped={false} />
      </mesh>
      <Stars radius={150} depth={60} count={2500} factor={4} fade speed={0.4} />
    </>
  )
}

/* ───────────── HUB ───────────── */
export function Hub({ onWorld, visited }: { onWorld: (w: World) => void; visited: Set<string> }) {
  const ctl = useCtl()
  const portrait = useThree((s) => s.size.width < s.size.height)
  useEffect(() => {
    if (portrait) ctl?.setLookAt(0, 0, 17, 0, 0.2, 0, true)
    else ctl?.setLookAt(0, 1.2, 11, 0, 0, 0, true)
  }, [ctl, portrait])
  const pos = (i: number): [number, number, number] => (portrait ? [-1.2, 4.0 - i * 3.7, 0] : [-4.2 + i * 4.2, 0, 0])
  return (
    <>
      <SpaceSky />
      <ambientLight intensity={0.12} />
      <directionalLight position={[-6, 3, 6]} intensity={2.6} />
      <HubItem position={pos(0)} portrait={portrait} world="moon" onWorld={onWorld} visited={visited}>
        <Planet tex="/textures/moonmap.jpg" r={1.3} />
      </HubItem>
      <HubItem position={pos(1)} portrait={portrait} world="mars" onWorld={onWorld} visited={visited}>
        <Planet tex="/textures/mars.jpg" r={1.5} halo="#e0905c" />
      </HubItem>
      <HubItem position={pos(2)} portrait={portrait} world="deep" onWorld={onWorld} visited={visited}>
        <MiniSystem />
      </HubItem>
    </>
  )
}

function HubItem({
  position,
  portrait,
  world,
  onWorld,
  visited,
  children,
}: {
  position: [number, number, number]
  portrait: boolean
  world: World
  onWorld: (w: World) => void
  visited: Set<string>
  children: React.ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.rotation.y += dt * 0.12
    const t = hover ? 1.12 : 1
    ref.current.scale.lerp(new THREE.Vector3(t, t, t), 0.1)
  })
  const list = ARTIFACTS.filter((a) => a.world === world)
  const found = list.filter((a) => visited.has(a.id)).length
  const label = world === 'moon' ? 'The Moon' : world === 'mars' ? 'Mars' : 'Deep Space'
  return (
    <group position={position}>
      <group
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          document.body.style.cursor = ''
          onWorld(world)
        }}
      >
        {children}
      </group>
      <Html position={portrait ? [2.9, 0, 0] : [0, -2.15, 0]} center zIndexRange={[10, 0]}>
        <button className={'hub-label' + (hover ? ' on' : '')} onClick={() => onWorld(world)}>
          <span className="hub-name">{label}</span>
          <span className="hub-count">
            {found}/{list.length} ghosts found
          </span>
        </button>
      </Html>
    </group>
  )
}

function Planet({ tex, r, halo }: { tex: string; r: number; halo?: string }) {
  const map = useTexture(tex)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8
  return (
    <group>
      <mesh>
        <sphereGeometry args={[r, 96, 64]} />
        <meshStandardMaterial map={map} roughness={1} metalness={0} />
      </mesh>
      {halo && <Halo r={r} color={halo} />}
    </group>
  )
}

function Halo({ r, color }: { r: number; color: string }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { c: { value: new THREE.Color(color) } },
        vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 4.0); gl_FragColor = vec4(c, f*0.7); }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [color],
  )
  return (
    <mesh material={mat}>
      <sphereGeometry args={[r * 1.05, 64, 48]} />
    </mesh>
  )
}

function MiniSystem() {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.4
  })
  return (
    <group rotation={[0.45, 0, 0.15]}>
      <mesh>
        <sphereGeometry args={[0.38, 32, 24]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <pointLight intensity={4} distance={4} color="#ffcc88" />
      {[0.8, 1.15, 1.55].map((r) => (
        <mesh key={r} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.006, 6, 96]} />
          <meshBasicMaterial color="#7d8aa6" transparent opacity={0.6} />
        </mesh>
      ))}
      <group ref={g}>
        <mesh position={[1.15, 0, 0]}>
          <sphereGeometry args={[0.09, 16, 12]} />
          <meshStandardMaterial color="#6fa3ff" />
        </mesh>
        <mesh position={[-1.55, 0, 0.2]}>
          <octahedronGeometry args={[0.07]} />
          <meshBasicMaterial color="#7dffd0" toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/* ───────────── GLOBE (Moon / Mars) ───────────── */
const GLOBE_R = 2.4

export function Globe({
  world,
  selected,
  onSelect,
  visited,
}: {
  world: 'moon' | 'mars'
  selected: string | null
  onSelect: (id: string | null) => void
  visited: Set<string>
}) {
  const ctl = useCtl()
  const map = useTexture(world === 'moon' ? '/textures/moonmap.jpg' : '/textures/mars.jpg')
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8
  const list = ARTIFACTS.filter((a) => a.world === world)
  const idle = useRef(0)

  useEffect(() => {
    if (!ctl) return
    if (!selected) {
      const p = latLonToVec(world === 'moon' ? 5 : 15, world === 'moon' ? 0 : -20, 8.5)
      ctl.setLookAt(p.x, p.y, p.z, 0, 0, 0, true)
      return
    }
    const a = list.find((x) => x.id === selected)
    if (!a) return
    // average of sites
    const v = new THREE.Vector3()
    a.sites.forEach((s) => v.add(latLonToVec(s.lat, s.lon, 1)))
    v.normalize().multiplyScalar(6.2)
    ctl.setLookAt(v.x, v.y, v.z, 0, 0, 0, true)
  }, [ctl, selected, world]) // eslint-disable-line

  useFrame((_, dt) => {
    if (!ctl || selected) return
    idle.current += dt
    if (idle.current > 1.5 && !(ctl as unknown as { active: boolean }).active) ctl.azimuthAngle += dt * 0.05
  })

  return (
    <>
      <SpaceSky />
      <ambientLight intensity={0.18} />
      <directionalLight position={[8, 3, 6]} intensity={2.8} />
      <directionalLight position={[-8, -2, -6]} intensity={0.25} color="#8aa4ff" />
      <mesh onClick={() => onSelect(null)} onPointerDown={() => (idle.current = 0)}>
        <sphereGeometry args={[GLOBE_R, 128, 96]} />
        <meshStandardMaterial map={map} roughness={1} metalness={0} />
      </mesh>
      {world === 'mars' && <Halo r={GLOBE_R} color="#e39a6a" />}
      {list.flatMap((a) =>
        a.sites.map((s, i) => (
          <Marker
            key={a.id + i}
            a={a}
            siteLabel={s.label}
            pos={latLonToVec(s.lat, s.lon, GLOBE_R + 0.01)}
            active={selected === a.id}
            seen={visited.has(a.id)}
            onSelect={onSelect}
          />
        )),
      )}
    </>
  )
}

function Marker({
  a,
  siteLabel,
  pos,
  active,
  seen,
  onSelect,
}: {
  a: Artifact
  siteLabel: string
  pos: THREE.Vector3
  active: boolean
  seen: boolean
  onSelect: (id: string) => void
}) {
  const ring = useRef<THREE.Mesh>(null)
  const [hover, setHover] = useState(false)
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()), [pos])
  const color = active ? '#7dffd0' : seen ? '#ffd27a' : '#9fd8ff'
  useFrame(({ clock }) => {
    if (!ring.current) return
    const t = (clock.elapsedTime * 0.8 + pos.x) % 1
    ring.current.scale.setScalar(1 + t * 1.8)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.8
  })
  const camera = useThree((s) => s.camera)
  const [facing, setFacing] = useState(true)
  useFrame(() => {
    const f = camera.position.clone().normalize().dot(pos.clone().normalize()) > 0.15
    if (f !== facing) setFacing(f)
  })
  return (
    <group position={pos} quaternion={q}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(a.id)
        }}
      >
        <circleGeometry args={[0.11, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.026, 20]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.032, 0.04, 32]} />
        <meshBasicMaterial color={color} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      {/* ghost beacon */}
      <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.003, 0.009, 0.22, 6, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
      </mesh>
      {facing && (hover || active) && (
        <Html position={[0, 0, 0.3]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="pin-label">
            <b>{siteLabel}</b>
            <span>{a.span}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

/* ───────────── DEEP SPACE (schematic) ───────────── */
const polar = (r: number, deg: number, y = 0) => {
  const a = THREE.MathUtils.degToRad(deg)
  return new THREE.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r)
}

export function DeepSpace({
  selected,
  onSelect,
  visited,
}: {
  selected: string | null
  onSelect: (id: string | null) => void
  visited: Set<string>
}) {
  const ctl = useCtl()
  const list = ARTIFACTS.filter((a) => a.world === 'deep')
  const earthTex = useTexture('/textures/earth.jpg')
  const marsTex = useTexture('/textures/mars.jpg')
  earthTex.colorSpace = marsTex.colorSpace = THREE.SRGBColorSpace

  const pos = (a: Artifact) => {
    const o = a.orbit!
    if (o.escape) return polar(17.5, o.angle, 1.2)
    if (o.body === 'Eros') return erosPoint(o.angle)
    return polar(o.r, o.angle, 0.35)
  }

  useEffect(() => {
    if (!ctl) return
    if (!selected) {
      ctl.setLookAt(0, 16, 22, 0, 0, 0, true)
      return
    }
    const a = list.find((x) => x.id === selected)
    if (!a) return
    const p = pos(a)
    const dir = p.clone().setY(0).normalize()
    ctl.setLookAt(p.x + dir.x * 6, p.y + 4, p.z + dir.z * 6, p.x, p.y, p.z, true)
  }, [ctl, selected]) // eslint-disable-line

  const rings: { r: number; label: string; color: string }[] = [
    { r: 3.4, label: 'Earth', color: '#4f7bd6' },
    { r: 4.6, label: 'Mars', color: '#c1683c' },
    { r: 6.4, label: 'Vesta', color: '#8d8a84' },
    { r: 7.2, label: 'Ceres', color: '#9b9690' },
    { r: 10.5, label: 'Jupiter', color: '#c9a37a' },
    { r: 13.5, label: 'Saturn', color: '#d8c38f' },
  ]
  const bodies: { r: number; ang: number; size: number; tex?: THREE.Texture; color?: string; label: string }[] = [
    { r: 3.4, ang: 320, size: 0.2, tex: earthTex, label: 'Earth' },
    { r: 4.6, ang: 70, size: 0.15, tex: marsTex, label: 'Mars' },
    { r: 6.4, ang: 160, size: 0.08, color: '#9c968e', label: 'Vesta' },
    { r: 7.2, ang: 120, size: 0.11, color: '#a8a39c', label: 'Ceres' },
    { r: 10.5, ang: 30, size: 0.55, color: '#d6b48a', label: 'Jupiter' },
    { r: 13.5, ang: 250, size: 0.45, color: '#e0cc98', label: 'Saturn' },
  ]

  const erosCurve = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 128; i++) pts.push(erosPoint((i / 128) * 360))
    return pts
  }, [])

  const p10 = useMemo(() => escapePath(40, 0), [])
  const p11 = useMemo(() => escapePath(140, 1), [])

  return (
    <>
      <SpaceSky />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={60} distance={60} decay={1.4} color="#fff0d6" />
      {/* Sun */}
      <mesh>
        <sphereGeometry args={[0.9, 48, 32]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <Halo r={1.2} color="#ffb347" />
      <Html position={[0, -1.4, 0]} center className="space-tag">
        Sun
      </Html>
      {rings.map((r) => (
        <mesh key={r.label} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r.r, 0.008, 6, 200]} />
          <meshBasicMaterial color={r.color} transparent opacity={0.45} />
        </mesh>
      ))}
      <Line points={erosCurve} color="#a7927a" lineWidth={1} dashed dashSize={0.2} gapSize={0.12} transparent opacity={0.7} />
      {bodies.map((b) => {
        const p = polar(b.r, b.ang)
        return (
          <group key={b.label} position={p}>
            <mesh>
              <sphereGeometry args={[b.size, 32, 24]} />
              <meshStandardMaterial map={b.tex ?? null} color={b.tex ? '#ffffff' : b.color} roughness={1} />
            </mesh>
            <Html position={[0, -b.size - 0.25, 0]} center className="space-tag">
              {b.label}
            </Html>
          </group>
        )
      })}
      {/* Pioneer escape trajectories */}
      <Line points={p10} color="#7dffd0" lineWidth={1.4} dashed dashSize={0.35} gapSize={0.2} />
      <Line points={p11} color="#7dffd0" lineWidth={1.4} dashed dashSize={0.35} gapSize={0.2} transparent opacity={0.6} />
      <Html position={p11[p11.length - 1]} center className="space-tag dim">
        Pioneer 11 (toward Aquila)
      </Html>
      {/* Kepler trail arc */}
      <Line
        points={Array.from({ length: 30 }, (_, i) => polar(3.4, 320 - i * 0.7, 0.02 * i))}
        color="#7dffd0"
        lineWidth={1}
        transparent
        opacity={0.5}
      />
      {list.map((a) => (
        <SpaceProbe key={a.id} a={a} p={pos(a)} active={selected === a.id} seen={visited.has(a.id)} onSelect={onSelect} />
      ))}
      <Html position={[0, -3, 15.5]} center className="space-tag dim">
        Schematic view. Distances not to scale.
      </Html>
    </>
  )
}

function erosPoint(deg: number) {
  // Eros orbit: 1.13 to 1.78 AU, mapped between Earth and Mars rings, tilted
  const a = THREE.MathUtils.degToRad(deg)
  const rx = 4.5, rz = 3.8
  return new THREE.Vector3(Math.cos(a) * rx + 0.6, Math.sin(a) * 0.5, -Math.sin(a) * rz)
}

function escapePath(deg: number, seed: number) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 80; i++) {
    const t = i / 80
    const r = 3.4 + t * 14.5
    const ang = deg - 70 * (1 - t) * (1 - t) - seed * 6
    pts.push(polar(r, ang, t * (seed ? -1.5 : 1.2)))
  }
  return pts
}

function SpaceProbe({
  a,
  p,
  active,
  seen,
  onSelect,
}: {
  a: Artifact
  p: THREE.Vector3
  active: boolean
  seen: boolean
  onSelect: (id: string) => void
}) {
  const ref = useRef<THREE.Mesh>(null)
  const [hover, setHover] = useState(false)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 1.2
  })
  const color = active ? '#7dffd0' : seen ? '#ffd27a' : '#9fd8ff'
  return (
    <group position={p}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(a.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
        scale={hover || active ? 1.5 : 1}
      >
        <octahedronGeometry args={[0.2]} />
        <meshBasicMaterial color={color} toneMapped={false} wireframe={!seen} />
      </mesh>
      {a.orbit?.body === 'Eros' && (
        <mesh position={[0.25, -0.1, 0]} scale={[0.22, 0.1, 0.1]}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#8c7a64" roughness={1} />
        </mesh>
      )}
      <Html position={[0, 0.5, 0]} center zIndexRange={[20, 0]}>
        <button className={'probe-tag' + (active ? ' on' : '')} onClick={() => onSelect(a.id)}>
          {a.name}
        </button>
      </Html>
    </group>
  )
}

/* ───────────── ARTIFACT STAGE ───────────── */
export function ArtifactStage({ a, beat, replay }: { a: Artifact; beat: Beat; replay: number }) {
  const liftIdx = a.chapters.findIndex((b) => b.act === 'liftoff')
  const ascentGone = liftIdx >= 0 && a.chapters.indexOf(beat) > liftIdx
  const ctl = useCtl()
  const grounded = a.backdrop === 'moon' || a.backdrop === 'mars' || a.backdrop === 'eros'
  const target = new THREE.Vector3(0, grounded ? 1.1 : 0, 0)
  const width = useThree((s) => s.size.width)
  const act: Act = beat.act ?? 'idle'
  const shake = useRef<THREE.Group>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const scene = useThree((s) => s.scene)
  const base = a.backdrop === 'moon' ? 3.4 : 2.6

  useEffect(() => {
    if (!ctl) return
    ctl.enabled = true
    const [az, pol, mul] = beat.cam ?? [40, 70, 1]
    const size = a.model.type === 'glb' ? a.model.size ?? 3 : 3
    let d = Math.max(3.2, 6.2 * mul * (size / 3)) * (width > 760 ? 1 : 1.7)
    target.y = grounded ? Math.min(1.1, size * 0.33) : 0
    if (act === 'skycrane') {
      d = 17
      target.y = 4.5
    } else if (act === 'dropoff') {
      d = 10
      target.set(0, 1, 2)
    } else if (act === 'fly') {
      d = Math.max(d, 7)
      target.y = 1.5
    }
    const s = new THREE.Spherical(d, THREE.MathUtils.degToRad(pol), THREE.MathUtils.degToRad(az))
    const p = new THREE.Vector3().setFromSpherical(s).add(target)
    ctl.setLookAt(p.x, Math.max(p.y, grounded ? 0.4 : -99), p.z, target.x, target.y, target.z, true)
  }, [ctl, a, beat, width, replay]) // eslint-disable-line

  // shift subject left of the story panel (desktop) or up (mobile)
  useEffect(() => {
    if (!ctl) return
    const size = a.model.type === 'glb' ? a.model.size ?? 3 : 3
    ctl.setFocalOffset(width > 760 ? size * 0.42 : 0, width > 760 ? 0 : size * 0.7, 0, true)
    return () => {
      ctl.setFocalOffset(0, 0, 0, true)
    }
  }, [ctl, a, width])

  useFrame(() => {
    const q = motion.quake
    if (shake.current) shake.current.position.set((Math.random() - 0.5) * q * 0.12, (Math.random() - 0.5) * q * 0.06, (Math.random() - 0.5) * q * 0.12)
    const k = 1 - motion.dim
    if (sun.current) sun.current.intensity = base * k * (1 - motion.storm * 0.6)
    if (hemi.current) hemi.current.intensity = (a.backdrop === 'mars' ? 0.7 : 0.25) * (0.4 + 0.6 * k)
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      scene.fog.near = 18 - motion.storm * 16
      scene.fog.far = 60 - motion.storm * 48
    }
  })

  return (
    <>
      {a.backdrop === 'mars' ? <MarsSky /> : <SpaceSky dim={a.backdrop === 'moon' ? 0.8 : 1} />}
      <hemisphereLight ref={hemi} args={[a.backdrop === 'mars' ? '#f3c7a0' : '#9fb0d0', a.backdrop === 'mars' ? '#5a2f1c' : '#222', a.backdrop === 'mars' ? 0.7 : 0.25]} />
      <directionalLight
        ref={sun}
        position={a.backdrop === 'moon' ? [10, 6, 4] : [8, 10, 6]}
        intensity={base}
        color={a.backdrop === 'mars' ? '#ffe2c4' : '#ffffff'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />
      <group ref={shake}>
        {(a.backdrop === 'moon' || a.backdrop === 'mars') && <Terrain kind={a.backdrop} />}
        {a.backdrop === 'eros' && <ErosSurface />}
        <Suspense fallback={<LoadingProbe />}>
          <Floaty enabled={!grounded && act !== 'drift'}>
            <Actor key={a.id + ':' + replay} a={a} act={act} ground={a.backdrop === 'moon' || a.backdrop === 'mars' ? a.backdrop : null} replay={replay} ascentGone={ascentGone} />
          </Floaty>
        </Suspense>
      </group>
      {a.backdrop === 'moon' && <EarthInSky />}
      {a.backdrop === 'ceres' && <CeresBackdrop />}
      {a.backdrop === 'earthTrail' && <DistantEarth />}
      {a.backdrop === 'void' && <DistantSun />}
      <Weather />
    </>
  )
}

function LoadingProbe() {
  const r = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (r.current) r.current.rotation.y += dt * 2
  })
  return (
    <mesh ref={r} position={[0, 1, 0]}>
      <octahedronGeometry args={[0.4]} />
      <meshBasicMaterial color="#7dffd0" wireframe />
    </mesh>
  )
}

function Floaty({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (g.current && enabled) {
      g.current.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.12
      g.current.rotation.z = Math.sin(clock.elapsedTime * 0.3) * 0.05
    }
  })
  return <group ref={g}>{children}</group>
}

function Terrain({ kind }: { kind: 'moon' | 'mars' }) {
  const tex = useTexture(kind === 'moon' ? '/textures/lunar-terrain.jpg' : '/textures/mars-terrain.jpg')
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(90, 90, 220, 220)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      const h = terrainHeight(kind, p.getX(i), p.getZ(i))
      p.setY(i, h)
    }
    g.computeVertexNormals()
    return g
  }, [kind])
  const map = useMemo(() => {
    const t = tex.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(kind === 'moon' ? 7 : 5, kind === 'moon' ? 7 : 5)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }, [tex, kind])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={map} color={kind === 'moon' ? '#b9b6b0' : '#e2a27c'} roughness={1} metalness={0} />
    </mesh>
  )
}

function MarsSky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {},
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `varying vec3 vP; void main(){ float h = clamp(vP.y, -0.1, 1.0);
          vec3 horizon = vec3(0.86,0.62,0.45); vec3 zen = vec3(0.42,0.27,0.2);
          vec3 c = mix(horizon, zen, pow(max(h,0.0), 0.6));
          gl_FragColor = vec4(c,1.); }`,
      }),
    [],
  )
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    scene.fog = new THREE.Fog('#c89a78', 18, 60)
    return () => {
      scene.fog = null
    }
  }, [scene])
  return (
    <mesh material={mat}>
      <sphereGeometry args={[300, 32, 16]} />
    </mesh>
  )
}

function EarthInSky() {
  const tex = useTexture('/textures/earth.jpg')
  tex.colorSpace = THREE.SRGBColorSpace
  return (
    <group position={[-60, 38, -110]}>
      <mesh rotation={[0.3, 2, 0]}>
        <sphereGeometry args={[6, 64, 48]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
      <Halo r={6} color="#7fb2ff" />
    </group>
  )
}

function ErosSurface() {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(30, 24)
    const p = g.attributes.position as THREE.BufferAttribute
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      const n = v.clone().normalize()
      const k = 1 + (fbm(n.x * 4 + 10, n.z * 4 + n.y * 3, 5) - 0.5) * 0.12
      v.copy(n.multiplyScalar(30 * k))
      v.x *= 1.9
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [])
  // top point roughly at y=30*k; place so surface near y=0
  return (
    <mesh geometry={geo} position={[0, -30.2, 0]} receiveShadow>
      <meshStandardMaterial color="#8a7660" roughness={1} flatShading />
    </mesh>
  )
}

function CeresBackdrop() {
  const tex = useTexture('/textures/moonmap.jpg')
  return (
    <group position={[14, -10, -40]}>
      <mesh rotation={[0.2, 1, 0]}>
        <sphereGeometry args={[16, 96, 64]} />
        <meshStandardMaterial map={tex} color="#9a958e" roughness={1} />
      </mesh>
      {/* Occator bright spots */}
      <mesh position={latLonToVec(20, 260, 16.02).applyEuler(new THREE.Euler(0.2, 1, 0))}>
        <sphereGeometry args={[0.35, 12, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}

function DistantEarth() {
  const tex = useTexture('/textures/earth.jpg')
  tex.colorSpace = THREE.SRGBColorSpace
  return (
    <>
      <group position={[-40, 6, -90]}>
        <mesh>
          <sphereGeometry args={[2.2, 48, 32]} />
          <meshStandardMaterial map={tex} roughness={1} />
        </mesh>
        <Halo r={2.2} color="#7fb2ff" />
      </group>
      <DistantSun />
    </>
  )
}

function DistantSun() {
  return (
    <group position={[120, 30, -60]}>
      <mesh>
        <sphereGeometry args={[2, 24, 16]} />
        <meshBasicMaterial color="#fff2c8" toneMapped={false} />
      </mesh>
      <Halo r={4} color="#ffcf80" />
    </group>
  )
}
