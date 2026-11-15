import * as THREE from 'three'

// lat/lon (deg, east positive) to point on sphere matching three SphereGeometry + equirect texture centered on lon 0
export function latLonToVec(lat: number, lon: number, r: number) {
  const la = THREE.MathUtils.degToRad(lat)
  const lo = THREE.MathUtils.degToRad(lon)
  return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo))
}

// cheap deterministic value noise for terrain
export function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
export function noise2(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
export function fbm(x: number, y: number, oct = 4) {
  let s = 0, amp = 0.5, f = 1
  for (let i = 0; i < oct; i++) {
    s += amp * noise2(x * f, y * f)
    f *= 2
    amp *= 0.5
  }
  return s
}

// terrain height shared by mesh + anything that drives on it
const CRATERS: Record<'moon' | 'mars', number[][]> = {
  moon: [
    [9, -6, 4, 0.9],
    [-12, 4, 6, 1.3],
    [5, 14, 3, 0.6],
    [-6, -14, 2.5, 0.5],
    [20, 10, 8, 1.8],
  ],
  mars: [
    [12, -9, 5, 0.8],
    [-16, 10, 7, 1.1],
  ],
}
export function terrainHeight(kind: 'moon' | 'mars', x: number, z: number) {
  const d = Math.hypot(x, z)
  const s = Math.min(Math.max((d - 3) / 11, 0), 1)
  const flat = s * s * (3 - 2 * s)
  let h = (fbm(x * 0.08, z * 0.08, 5) - 0.5) * (kind === 'mars' ? 3.2 : 2.2) * flat
  h += (fbm(x * 0.6, z * 0.6, 3) - 0.5) * 0.12
  if (kind === 'mars') {
    const s2 = Math.min(Math.max((d - 25) / 20, 0), 1)
    h += s2 * s2 * (3 - 2 * s2) * 6 * fbm(x * 0.03 + 3, z * 0.03, 3)
  }
  for (const [cx, cz, r, depth] of CRATERS[kind]) {
    const cd = Math.hypot(x - cx, z - cz) / r
    if (cd < 1.4) h += cd < 1 ? -depth * (1 - cd * cd) : depth * 0.35 * Math.sin(((cd - 1) / 0.4) * Math.PI)
  }
  return h
}
