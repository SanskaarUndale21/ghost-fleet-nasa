import { MISSIONS } from '../src/data/missions.ts'
const out: { id: string; i: number; text: string }[] = []
for (const [id, m] of Object.entries(MISSIONS)) m.beats.forEach((b, i) => out.push({ id, i, text: b.text }))
console.log(JSON.stringify(out))
