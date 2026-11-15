// Mutable, frame-rate state shared between 3D scenes and DOM HUD (read via rAF, no React re-render)
export const motion = {
  label: '', // big HUD status, e.g. LIFTOFF
  sub: '', // smaller status line
  alt: -1, // meters, -1 hides
  odo: -1, // meters driven, -1 hides
  day: -1, // cruise day, -1 hides
  days: 0,
  quake: 0, // 0..1 shake
  flux: -1, // transit brightness 0..1, -1 hides
  signal: 1, // 1 ok, 0 lost
  dim: 0, // 0..1 scene darkening
  storm: 0, // dust storm 0..1
  snow: 0, // snow 0..1
  sun: 0, // sunlight particles 0..1
  t: 0, // seconds in current beat
}

// user paused playback: cinematic scenes hand the camera back to the user
export const playback = { paused: false }

export function resetMotion() {
  motion.label = ''
  motion.sub = ''
  motion.alt = -1
  motion.odo = -1
  motion.day = -1
  motion.days = 0
  motion.quake = 0
  motion.flux = -1
  motion.signal = 1
  motion.dim = 0
  motion.storm = 0
  motion.snow = 0
  motion.sun = 0
  motion.t = 0
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3)
export const easeInOut = (x: number) => {
  const v = clamp01(x)
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2
}
export const smooth = (a: number, b: number, x: number) => {
  const v = clamp01((x - a) / (b - a))
  return v * v * (3 - 2 * v)
}

/* Simulation clock: every scene animation reads time through these, so pausing freezes the 3D world
   while the camera stays free to orbit. */
import { useFrame, type RootState } from '@react-three/fiber'
export function useSimFrame(cb: (state: RootState, delta: number) => void, priority?: number) {
  useFrame((s, d) => {
    if (playback.paused) return
    cb(s, d)
  }, priority)
}
/** Mount once inside <Canvas>: holds clock.elapsedTime still while paused */
export function SimClock() {
  useFrame((s, d) => {
    if (playback.paused) s.clock.elapsedTime -= d
  }, -1)
  return null
}
