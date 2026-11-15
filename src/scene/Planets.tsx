import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// Textures: Solar System Scope (CC BY 4.0) and NASA SVS CGI Moon Kit
export const TEX = {
  earthDay: '/textures/earth-day.jpg',
  earthNight: '/textures/earth-night.jpg',
  earthClouds: '/textures/earth-clouds.jpg',
  mars: '/textures/mars.jpg',
  moon: '/textures/moonmap.jpg',
  jupiter: '/textures/jupiter.jpg',
  sun: '/textures/sun.jpg',
  stars: '/textures/milkyway.jpg',
}

/** Atmosphere rim glow */
export function Atmosphere({ r, color = '#6fa8ff', power = 3.2, strength = 1.1, scale = 1.06 }: { r: number; color?: string; power?: number; strength?: number; scale?: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { c: { value: new THREE.Color(color) }, p: { value: power }, s: { value: strength } },
        vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `uniform vec3 c; uniform float p; uniform float s; varying vec3 vN; varying vec3 vV;
          void main(){ float f = pow(1.0 - abs(dot(vN, vV)), p) * s; gl_FragColor = vec4(c * f, f); }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [color, power, strength],
  )
  return (
    <mesh material={mat} scale={scale}>
      <sphereGeometry args={[r, 64, 48]} />
    </mesh>
  )
}

/** Earth with day/night terminator, city lights, clouds and atmosphere */
export function Earth({ r, sunDir = new THREE.Vector3(1, 0.25, 0.6), spin = 0.02, tilt = 0.41 }: { r: number; sunDir?: THREE.Vector3; spin?: number; tilt?: number }) {
  const [day, night, clouds] = useTexture([TEX.earthDay, TEX.earthNight, TEX.earthClouds])
  day.colorSpace = night.colorSpace = THREE.SRGBColorSpace
  day.anisotropy = night.anisotropy = 8
  const surf = useRef<THREE.Mesh>(null)
  const cl = useRef<THREE.Mesh>(null)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { day: { value: day }, night: { value: night }, sun: { value: sunDir.clone().normalize() } },
        vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: `uniform sampler2D day; uniform sampler2D night; uniform vec3 sun; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
          void main(){
            vec3 n = normalize(vN);
            float d = dot(n, normalize(sun));
            vec3 dc = texture2D(day, vUv).rgb;
            vec3 nc = texture2D(night, vUv).rgb;
            float lit = smoothstep(-0.12, 0.25, d);
            vec3 viewDir = normalize(cameraPosition - vW);
            vec3 h = normalize(normalize(sun) + viewDir);
            float ocean = smoothstep(0.12, 0.02, dc.r + dc.g * 0.3 - dc.b * 0.4);
            float spec = pow(max(dot(n, h), 0.0), 40.0) * ocean * 0.6 * lit;
            vec3 col = dc * (0.03 + 1.15 * max(d, 0.0)) + vec3(1.0,0.95,0.85) * spec;
            col += nc * vec3(1.0, 0.82, 0.55) * 1.6 * (1.0 - lit);
            float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
            col += vec3(0.25, 0.5, 1.0) * rim * 0.6 * smoothstep(-0.3, 0.4, d);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [day, night, sunDir],
  )
  useFrame((_, dt) => {
    if (surf.current) surf.current.rotation.y += dt * spin
    if (cl.current) cl.current.rotation.y += dt * spin * 1.25
  })
  return (
    <group rotation={[0, 0, tilt]}>
      <mesh ref={surf} material={mat}>
        <sphereGeometry args={[r, 128, 96]} />
      </mesh>
      <mesh ref={cl} scale={1.008}>
        <sphereGeometry args={[r, 96, 72]} />
        <meshStandardMaterial alphaMap={clouds} transparent depthWrite={false} color="#ffffff" opacity={0.95} roughness={1} />
      </mesh>
      <Atmosphere r={r} scale={1.025} color="#5b95ff" power={5} strength={0.9} />
    </group>
  )
}

export function Planet({ tex, r, color = '#ffffff', atmo, spin = 0.015 }: { tex: string; r: number; color?: string; atmo?: string; spin?: number }) {
  const map = useTexture(tex)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8
  const m = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (m.current) m.current.rotation.y += dt * spin
  })
  return (
    <group>
      <mesh ref={m}>
        <sphereGeometry args={[r, 96, 64]} />
        <meshStandardMaterial map={map} color={color} roughness={1} metalness={0} />
      </mesh>
      {atmo && <Atmosphere r={r} color={atmo} scale={1.04} power={3} strength={0.9} />}
    </group>
  )
}

/** The Sun: animated churning surface from the equirectangular texture, limb darkening and corona */
export function Sun({ r, glow = 1 }: { r: number; glow?: number }) {
  const map = useTexture(TEX.sun)
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { map: { value: map }, t: { value: 0 } },
        vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `uniform sampler2D map; uniform float t; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){
            vec2 w = vec2(sin(vUv.y*40.0 + t*0.6), cos(vUv.x*60.0 - t*0.5)) * 0.004;
            vec3 a = texture2D(map, vUv + w + vec2(t*0.004, 0.0)).rgb;
            vec3 b = texture2D(map, vUv*1.9 - w + vec2(-t*0.006, t*0.002)).rgb;
            vec3 c = mix(a, a*b*1.8, 0.45);
            float mu = max(dot(normalize(vN), normalize(vV)), 0.0);
            float limb = 0.35 + 0.65*pow(mu, 0.5);
            c *= limb * 1.5;
            c += vec3(1.0, 0.55, 0.15) * pow(1.0 - mu, 3.0) * 0.6;
            gl_FragColor = vec4(c, 1.0);
          }`,
        toneMapped: false,
      }),
    [map],
  )
  const m = useRef<THREE.Mesh>(null)
  useFrame(({ clock }, dt) => {
    mat.uniforms.t.value = clock.elapsedTime
    if (m.current) m.current.rotation.y += dt * 0.02
  })
  return (
    <group>
      <mesh ref={m} material={mat}>
        <sphereGeometry args={[r, 96, 64]} />
      </mesh>
      <Atmosphere r={r} color="#ffb347" scale={1.18} power={1.8} strength={1.6 * glow} />
      <Atmosphere r={r} color="#ff7a2a" scale={1.32} power={2.4} strength={0.5 * glow} />
      <pointLight intensity={0} />
    </group>
  )
}
