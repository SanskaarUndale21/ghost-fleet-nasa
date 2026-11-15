import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ModelSpec, ProcKind } from '../data/artifacts'

const GOLD = '#c9a24a'
const FOIL = '#d8b25c'
const METAL = '#b9bec6'
const DARK = '#2a2d33'
const PANEL = '#1b2a4a'

export function ArtifactModel({ spec, grounded, spin }: { spec: ModelSpec; grounded: boolean; spin?: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (spin && ref.current) ref.current.rotation.y += dt * 0.15
  })
  return <group ref={ref}>{spec.type === 'glb' ? <Glb spec={spec} grounded={grounded} /> : <Proc kind={spec.kind} />}</group>
}

function Glb({ spec, grounded }: { spec: Extract<ModelSpec, { type: 'glb' }>; grounded: boolean }) {
  const { scene } = useGLTF(spec.url)
  const { obj, scale, offset } = useMemo(() => {
    const c = scene.clone(true)
    c.rotation.set(spec.rotX ?? 0, spec.rotY ?? 0, 0)
    c.updateMatrixWorld(true)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
        const mats = Array.isArray(m.material) ? m.material : [m.material]
        mats.forEach((mat) => {
          const s = mat as THREE.MeshStandardMaterial
          if (s.isMeshStandardMaterial) {
            s.envMapIntensity = 0.8
            if (s.metalness > 0.9 && !s.map) s.metalness = 0.6
          }
          mat.side = THREE.DoubleSide
        })
      }
    })
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = (spec.size ?? 3) / Math.max(size.x, size.y, size.z)
    const off = new THREE.Vector3(-center.x, grounded ? -box.min.y : -center.y, -center.z)
    return { obj: c, scale: s, offset: off }
  }, [scene, spec, grounded])
  return (
    <group scale={scale}>
      <primitive object={obj} position={offset} />
    </group>
  )
}

function std(color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return <meshStandardMaterial color={color} roughness={0.55} metalness={0.4} {...extra} />
}

function Proc({ kind }: { kind: ProcKind }) {
  if (kind === 'lrv') return <LRV />
  if (kind === 'surveyor') return <Surveyor />
  if (kind === 'alsep') return <Alsep />
  return <Sojourner />
}

function WireWheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.41, 0.41, 0.23, 28, 1, true]} />
        <meshStandardMaterial color="#8d8f93" metalness={0.8} roughness={0.4} wireframe />
      </mesh>
      <mesh castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.22, 28, 1, true]} />
        <meshStandardMaterial color="#6c6e72" metalness={0.7} roughness={0.5} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* chevron treads */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.415, 0, Math.sin(a) * 0.415]} rotation={[0, -a, 0]} castShadow>
            <boxGeometry args={[0.02, 0.22, 0.08]} />
            {std('#a7a9ad', { metalness: 0.9 })}
          </mesh>
        )
      })}
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 0.25, 12]} />
        {std(DARK)}
      </mesh>
    </group>
  )
}

function LRV() {
  return (
    <group position={[0, 0, 0]}>
      {/* chassis */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.12, 2.9]} />
        {std('#9aa0a8')}
      </mesh>
      {/* fenders */}
      {[
        [-0.68, 1.05],
        [0.68, 1.05],
        [-0.68, -1.05],
        [0.68, -1.05],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.86, z]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.28, 20, 1, true, 0, Math.PI]} />
          <meshStandardMaterial color="#e6e2d6" side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      ))}
      <WireWheel position={[-0.68, 0.41, 1.05]} />
      <WireWheel position={[0.68, 0.41, 1.05]} />
      <WireWheel position={[-0.68, 0.41, -1.05]} />
      <WireWheel position={[0.68, 0.41, -1.05]} />
      {/* seats */}
      {[-0.28, 0.28].map((x) => (
        <group key={x} position={[x, 0.62, -0.1]}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <boxGeometry args={[0.46, 0.05, 0.46]} />
            {std('#4a5b6e', { metalness: 0.1, roughness: 0.9 })}
          </mesh>
          <mesh position={[0, 0.32, -0.22]} castShadow>
            <boxGeometry args={[0.46, 0.5, 0.04]} />
            {std('#4a5b6e', { metalness: 0.1, roughness: 0.9 })}
          </mesh>
        </group>
      ))}
      {/* control console */}
      <mesh position={[0, 0.95, 0.42]} castShadow>
        <boxGeometry args={[0.32, 0.3, 0.12]} />
        {std(DARK)}
      </mesh>
      <mesh position={[0, 0.75, 0.42]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4]} />
        {std(METAL)}
      </mesh>
      {/* front battery / electronics box with foil */}
      <mesh position={[0, 0.75, 1.15]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.45]} />
        {std(FOIL, { metalness: 0.9, roughness: 0.3 })}
      </mesh>
      {/* high gain umbrella antenna */}
      <group position={[0.35, 0.9, 1.25]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1]} />
          {std(METAL)}
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation={[-0.4, 0, 0]} castShadow>
          <coneGeometry args={[0.48, 0.18, 24, 1, true]} />
          <meshStandardMaterial color="#d9d9d4" side={THREE.DoubleSide} metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
      {/* TV camera */}
      <group position={[-0.3, 1.0, 1.3]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6]} />
          {std(METAL)}
        </mesh>
        <mesh position={[0, 0.62, 0.05]} castShadow>
          <boxGeometry args={[0.16, 0.14, 0.3]} />
          {std('#dcdcd8')}
        </mesh>
      </group>
      {/* low gain whip */}
      <mesh position={[-0.45, 1.3, 0.9]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1.3]} />
        {std(METAL)}
      </mesh>
      {/* rear tool pallet */}
      <mesh position={[0, 0.78, -1.2]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.4]} />
        {std('#7d8288')}
      </mesh>
    </group>
  )
}

function Surveyor() {
  const legs = [0, 1, 2].map((i) => (i / 3) * Math.PI * 2)
  return (
    <group>
      {/* triangular spaceframe */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.75, 0.9, 3, 1, true]} />
        <meshStandardMaterial color="#c8ccd2" wireframe />
      </mesh>
      {/* body / tanks */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.28, 20, 16]} />
        {std(METAL, { metalness: 0.9, roughness: 0.25 })}
      </mesh>
      {[0, 2.1, 4.2].map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.35, 0.7, Math.sin(a) * 0.35]} castShadow>
          <sphereGeometry args={[0.13, 14, 12]} />
          {std('#e8e8e4')}
        </mesh>
      ))}
      {/* thermal boxes */}
      <mesh position={[0.3, 1.25, 0.2]} castShadow>
        <boxGeometry args={[0.38, 0.3, 0.3]} />
        <meshStandardMaterial color="#f2f2ee" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[-0.32, 1.22, 0.1]} castShadow>
        <boxGeometry args={[0.32, 0.26, 0.3]} />
        <meshStandardMaterial color="#f2f2ee" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* legs with footpads */}
      {legs.map((a) => {
        const fx = Math.cos(a) * 1.5, fz = Math.sin(a) * 1.5
        const mid = new THREE.Vector3(fx / 2, 0.45, fz / 2)
        const dir = new THREE.Vector3(fx, -0.8, fz).normalize()
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
        return (
          <group key={a}>
            <mesh position={mid} quaternion={q} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 1.75]} />
              {std(METAL)}
            </mesh>
            <mesh position={[fx, 0.05, fz]} castShadow>
              <cylinderGeometry args={[0.2, 0.24, 0.1, 18]} />
              {std('#d4d4cf')}
            </mesh>
          </group>
        )
      })}
      {/* mast + solar panel + planar antenna */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.8]} />
        {std(METAL)}
      </mesh>
      <mesh position={[0.35, 2.55, 0]} rotation={[0, 0, -0.5]} castShadow>
        <boxGeometry args={[0.85, 0.02, 0.6]} />
        {std(PANEL, { metalness: 0.6, roughness: 0.25 })}
      </mesh>
      <mesh position={[-0.35, 2.45, 0]} rotation={[0, 0, 0.6]} castShadow>
        <boxGeometry args={[0.6, 0.02, 0.6]} />
        {std('#bfc3c9')}
      </mesh>
      {/* TV camera mirror hood */}
      <mesh position={[0.15, 1.45, -0.35]} rotation={[0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.4, 12]} />
        {std('#e0e0db')}
      </mesh>
      {/* scoop arm */}
      <mesh position={[0.0, 0.55, 0.7]} rotation={[1.1, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.9, 0.05]} />
        {std(METAL)}
      </mesh>
    </group>
  )
}

function Alsep() {
  return (
    <group>
      {/* central station */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.6, 0.35, 0.45]} />
          {std(FOIL, { metalness: 0.9, roughness: 0.3 })}
        </mesh>
        {/* sunshade */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.75, 0.02, 0.6]} />
          {std('#e9e9e4', { metalness: 0.2 })}
        </mesh>
        {[-0.34, 0.34].map((x) => (
          <mesh key={x} position={[x, 0.5, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.55]} />
            {std(METAL)}
          </mesh>
        ))}
        {/* helical antenna */}
        <mesh position={[0.15, 1.05, 0]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
          <meshStandardMaterial color="#cfcfcf" wireframe />
        </mesh>
      </group>
      {/* RTG */}
      <group position={[-1.6, 0, 0.6]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.46, 16]} />
          {std('#2f3237', { metalness: 0.6 })}
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.2, 0.3, Math.sin(a) * 0.2]} rotation={[0, -a, 0]} castShadow>
              <boxGeometry args={[0.16, 0.44, 0.015]} />
              {std('#3a3d42', { metalness: 0.7 })}
            </mesh>
          )
        })}
      </group>
      {/* seismometer under thermal shroud */}
      <group position={[1.8, 0, -0.6]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <sphereGeometry args={[0.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {std('#f0f0ec', { metalness: 0.1 })}
        </mesh>
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.8, 32]} />
          <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* laser retroreflector */}
      <group position={[-0.5, 0, -1.6]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.35, 0]} rotation={[-0.6, 0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.6, 0.06]} />
          {std('#6c7a8a', { metalness: 0.95, roughness: 0.1 })}
        </mesh>
        <mesh position={[0, 0.15, 0.1]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3]} />
          {std(METAL)}
        </mesh>
      </group>
      {/* cables */}
      {[
        [-1.6, 0.6],
        [1.8, -0.6],
        [-0.5, -1.6],
      ].map(([x, z], i) => {
        const len = Math.hypot(x, z)
        return (
          <mesh key={i} position={[x / 2, 0.015, z / 2]} rotation={[0, -Math.atan2(z, x), 0]}>
            <boxGeometry args={[len, 0.01, 0.02]} />
            <meshStandardMaterial color="#d6d0bf" />
          </mesh>
        )
      })}
    </group>
  )
}

function Sojourner() {
  const wheel = (x: number, z: number, k: number) => (
    <mesh key={k} position={[x, 0.065, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.065, 0.065, 0.08, 20]} />
      {std('#9ea3aa', { metalness: 0.8 })}
    </mesh>
  )
  return (
    <group scale={3.2}>
      {[-0.24, 0, 0.24].flatMap((z, i) => [wheel(-0.24, z, i * 2), wheel(0.24, z, i * 2 + 1)])}
      {/* rocker bogie arms */}
      {[-0.24, 0.24].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.16, 0.12]} rotation={[0.6, 0, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.28]} />
            {std(METAL)}
          </mesh>
          <mesh position={[x, 0.16, -0.12]} rotation={[-0.6, 0, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.28]} />
            {std(METAL)}
          </mesh>
        </group>
      ))}
      {/* WEB body */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[0.36, 0.13, 0.48]} />
        {std(FOIL, { metalness: 0.85, roughness: 0.35 })}
      </mesh>
      {/* solar panel top */}
      <mesh position={[0, 0.315, 0]} castShadow>
        <boxGeometry args={[0.46, 0.012, 0.6]} />
        {std(PANEL, { metalness: 0.6, roughness: 0.2 })}
      </mesh>
      {/* antenna */}
      <mesh position={[0.15, 0.48, -0.2]}>
        <cylinderGeometry args={[0.004, 0.004, 0.32]} />
        {std(METAL)}
      </mesh>
      {/* APXS on rear */}
      <mesh position={[0, 0.18, -0.29]} rotation={[0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.1, 10]} />
        {std(DARK)}
      </mesh>
      {/* cameras */}
      <mesh position={[0, 0.22, 0.25]}>
        <boxGeometry args={[0.1, 0.04, 0.02]} />
        {std(DARK)}
      </mesh>
    </group>
  )
}

export function preloadModels(urls: string[]) {
  urls.forEach((u) => useGLTF.preload(u))
}
