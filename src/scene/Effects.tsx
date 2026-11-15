import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { motion, useSimFrame } from './motionState'

/* ───────────── generic particle pool ───────────── */
export type EmitOpts = {
  pos: THREE.Vector3
  count: number
  speed?: number
  spread?: number // radial randomness
  up?: number // upward bias
  dir?: THREE.Vector3 // base direction
  life?: number
  size?: number
  color?: THREE.ColorRepresentation
  gravity?: number
  drag?: number
  grow?: number
}
export type ParticlesHandle = { emit: (o: EmitOpts) => void; clear: () => void }

const N = 2200
export const Particles = forwardRef<ParticlesHandle, { additive?: boolean }>(function Particles({ additive }, ref) {
  const st = useMemo(() => {
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const size = new Float32Array(N)
    const alpha = new Float32Array(N)
    const vel = new Float32Array(N * 3)
    const age = new Float32Array(N).fill(1e9)
    const life = new Float32Array(N).fill(1)
    const grav = new Float32Array(N)
    const drag = new Float32Array(N)
    const s0 = new Float32Array(N)
    const grow = new Float32Array(N)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.setAttribute('size', new THREE.BufferAttribute(size, 1))
    g.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1))
    return { pos, col, size, alpha, vel, age, life, grav, drag, s0, grow, g, head: 0 }
  }, [])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        vertexColors: true,
        uniforms: { scale: { value: 600 } },
        vertexShader: `attribute float size; attribute float alpha; varying float vA; varying vec3 vC;
          uniform float scale;
          void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = size*scale/ max(-mv.z, 0.1); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `varying float vA; varying vec3 vC; void main(){ vec2 d = gl_PointCoord-0.5; float r = length(d); if(r>0.5) discard; float s = smoothstep(0.5,0.0,r); gl_FragColor = vec4(vC, vA*s); }`,
      }),
    [additive],
  )
  const c = new THREE.Color()
  useImperativeHandle(ref, () => ({
    emit(o) {
      c.set(o.color ?? '#bbb')
      for (let k = 0; k < o.count; k++) {
        const i = st.head
        st.head = (st.head + 1) % N
        const sp = o.speed ?? 1
        const spread = o.spread ?? 1
        let vx = (Math.random() - 0.5) * 2 * spread, vy = (Math.random() - 0.2) * spread * 0.6 + (o.up ?? 0.5), vz = (Math.random() - 0.5) * 2 * spread
        if (o.dir) {
          vx += o.dir.x
          vy += o.dir.y
          vz += o.dir.z
        }
        st.vel[i * 3] = vx * sp
        st.vel[i * 3 + 1] = vy * sp
        st.vel[i * 3 + 2] = vz * sp
        st.pos[i * 3] = o.pos.x + (Math.random() - 0.5) * 0.2
        st.pos[i * 3 + 1] = o.pos.y
        st.pos[i * 3 + 2] = o.pos.z + (Math.random() - 0.5) * 0.2
        const shade = 0.85 + Math.random() * 0.3
        st.col[i * 3] = c.r * shade
        st.col[i * 3 + 1] = c.g * shade
        st.col[i * 3 + 2] = c.b * shade
        st.age[i] = 0
        st.life[i] = (o.life ?? 1.5) * (0.6 + Math.random() * 0.8)
        st.s0[i] = (o.size ?? 0.08) * (0.6 + Math.random() * 0.8)
        st.grav[i] = o.gravity ?? 1.6
        st.drag[i] = o.drag ?? 0
        st.grow[i] = o.grow ?? 0
      }
    },
    clear() {
      st.age.fill(1e9)
    },
  }))
  useSimFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    for (let i = 0; i < N; i++) {
      if (st.age[i] > st.life[i]) {
        st.alpha[i] = 0
        continue
      }
      st.age[i] += dt
      const dr = Math.max(0, 1 - st.drag[i] * dt)
      st.vel[i * 3] *= dr
      st.vel[i * 3 + 2] *= dr
      st.vel[i * 3 + 1] = st.vel[i * 3 + 1] * dr - st.grav[i] * dt
      st.pos[i * 3] += st.vel[i * 3] * dt
      st.pos[i * 3 + 1] += st.vel[i * 3 + 1] * dt
      st.pos[i * 3 + 2] += st.vel[i * 3 + 2] * dt
      const k = st.age[i] / st.life[i]
      st.alpha[i] = Math.min(1, k * 8) * (1 - k) * 0.9
      st.size[i] = st.s0[i] * (1 + st.grow[i] * k)
    }
    st.g.attributes.position.needsUpdate = true
    st.g.attributes.alpha.needsUpdate = true
    st.g.attributes.size.needsUpdate = true
    st.g.attributes.color.needsUpdate = true
  })
  return <points geometry={st.g} material={mat} frustumCulled={false} />
})

/* ───────────── engine flame ───────────── */
export function Flame({
  get,
  color = '#ffb35c',
  core = '#fff4d6',
  length = 1,
  radius = 0.25,
}: {
  get: () => { on: number; pos: THREE.Vector3; dir?: THREE.Vector3 }
  color?: string
  core?: string
  length?: number
  radius?: number
}) {
  const g = useRef<THREE.Group>(null)
  const q = useMemo(() => new THREE.Quaternion(), [])
  const down = useMemo(() => new THREE.Vector3(0, -1, 0), [])
  useSimFrame(({ clock }) => {
    if (!g.current) return
    const s = get()
    g.current.visible = s.on > 0.02
    if (!g.current.visible) return
    g.current.position.copy(s.pos)
    q.setFromUnitVectors(down, (s.dir ?? down).clone().normalize())
    g.current.quaternion.copy(q)
    const f = 0.85 + Math.sin(clock.elapsedTime * 47) * 0.08 + Math.random() * 0.1
    g.current.scale.set(s.on, s.on * f, s.on)
  })
  return (
    <group ref={g}>
      <mesh position={[0, -length / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[radius, length, 20, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -length * 0.3, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[radius * 0.5, length * 0.6, 16, 1, true]} />
        <meshBasicMaterial color={core} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={6} distance={6} />
    </group>
  )
}

/* ───────────── wheel tracks ───────────── */
export type TracksHandle = { add: (x: number, y: number, z: number, yaw: number, half: number) => void; clear: () => void }
const TN = 900
export const Tracks = forwardRef<TracksHandle, { color: string }>(function Tracks({ color }, ref) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const head = useRef(0)
  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const e = useMemo(() => new THREE.Euler(), [])
  useImperativeHandle(ref, () => ({
    add(x, y, z, yaw, half) {
      const im = mesh.current
      if (!im) return
      for (const side of [-1, 1]) {
        const ox = Math.cos(yaw) * half * side, oz = -Math.sin(yaw) * half * side
        e.set(-Math.PI / 2, 0, yaw)
        q.setFromEuler(e)
        m.compose(new THREE.Vector3(x + ox, y + 0.015, z + oz), q, new THREE.Vector3(1, 1, 1))
        im.setMatrixAt(head.current, m)
        head.current = (head.current + 1) % TN
      }
      im.count = Math.max(im.count, Math.min(TN, head.current === 0 ? TN : head.current))
      im.instanceMatrix.needsUpdate = true
    },
    clear() {
      if (mesh.current) mesh.current.count = 0
      head.current = 0
    },
  }))
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, TN]} count={0} frustumCulled={false} receiveShadow>
      <planeGeometry args={[0.16, 0.22]} />
      <meshStandardMaterial color={color} transparent opacity={0.55} roughness={1} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </instancedMesh>
  )
})

/* ───────────── weather: snow / dust storm / sunlight ───────────── */
export function Weather({ center }: { center?: THREE.Vector3 }) {
  const n = 2600
  const st = useMemo(() => {
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40
      pos[i * 3 + 1] = Math.random() * 14
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { pos, g }
  }, [])
  const mat = useMemo(() => new THREE.PointsMaterial({ size: 0.06, transparent: true, opacity: 0, depthWrite: false, color: '#fff' }), [])
  useSimFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const mode = motion.storm > 0.01 ? 'storm' : motion.snow > 0.01 ? 'snow' : motion.sun > 0.01 ? 'sun' : ''
    mat.opacity = mode === 'storm' ? motion.storm * 0.75 : mode === 'snow' ? motion.snow * 0.9 : mode === 'sun' ? motion.sun * 0.8 : 0
    if (!mode) return
    mat.color.set(mode === 'storm' ? '#c78b5e' : mode === 'snow' ? '#f4f8ff' : '#ffd98a')
    mat.size = mode === 'storm' ? 0.09 : mode === 'snow' ? 0.05 : 0.04
    mat.blending = mode === 'sun' ? THREE.AdditiveBlending : THREE.NormalBlending
    const p = st.pos
    for (let i = 0; i < n; i++) {
      const j = i * 3
      if (mode === 'snow') {
        p[j + 1] -= dt * (0.6 + (i % 7) * 0.08)
        p[j] += Math.sin(p[j + 1] + i) * dt * 0.2
      } else if (mode === 'storm') {
        p[j] += dt * (7 + (i % 5))
        p[j + 1] += Math.sin(p[j] * 0.3 + i) * dt * 0.6
      } else {
        p[j] -= dt * 9
        p[j + 1] -= dt * 1.5
        p[j + 2] += dt * 3
      }
      if (p[j + 1] < 0) p[j + 1] += 14
      if (p[j + 1] > 14) p[j + 1] -= 14
      if (p[j] > 20) p[j] -= 40
      if (p[j] < -20) p[j] += 40
      if (p[j + 2] > 20) p[j + 2] -= 40
    }
    st.g.attributes.position.needsUpdate = true
  })
  return <points geometry={st.g} material={mat} position={center ?? [0, 0, 0]} frustumCulled={false} />
}

/* ───────────── laser ranging beam ───────────── */
export function Laser({ from, to }: { from: THREE.Vector3; to: THREE.Vector3 }) {
  const { pos, quat, len } = useMemo(() => {
    const d = new THREE.Vector3().subVectors(from, to)
    const len = d.length()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())
    return { pos: new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5), quat: q, len }
  }, [from, to])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { t: { value: 0 }, len: { value: len } },
        vertexShader: `varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `uniform float t; uniform float len; varying float vY;
          void main(){ float y = vY + len*0.5; float pulse = smoothstep(0.85,1.0, fract(y*0.08 - t*1.2)); float a = 0.18 + pulse*0.9; gl_FragColor = vec4(0.35,1.0,0.55,a); }`,
      }),
    [len],
  )
  useSimFrame(({ clock }) => {
    mat.uniforms.t.value = clock.elapsedTime
  })
  return (
    <group>
      <mesh position={pos} quaternion={quat} material={mat}>
        <cylinderGeometry args={[0.03, 0.03, len, 6, 1, true]} />
      </mesh>
      <mesh position={to}>
        <sphereGeometry args={[0.12, 12, 8]} />
        <meshBasicMaterial color="#7dff9a" transparent opacity={0.8} toneMapped={false} />
      </mesh>
    </group>
  )
}
