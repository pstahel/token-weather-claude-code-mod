import type { Reading } from '../types'

export const HISTORY = 12
const BARS = '▁▂▃▄▅▆▇█'

export type Sky = { icon: string; word: string; color: string }

const SKIES: { below: number; sky: Sky }[] = [
  { below: 25, sky: { icon: '☀', word: 'Clear', color: 'yellow' } },
  { below: 50, sky: { icon: '☁', word: 'Cloudy', color: 'cyan' } },
  { below: 75, sky: { icon: '☂', word: 'Showers', color: 'blue' } },
  { below: 90, sky: { icon: '☇', word: 'Storm', color: 'magenta' } },
  { below: Infinity, sky: { icon: '↯', word: 'Compact soon', color: 'red' } },
]

export const percentOf = (r: Reading) => Math.min(100, (r.tokens / r.window) * 100)

export const skyFor = (pct: number): Sky => SKIES.find(s => pct < s.below)!.sky

export function fmt(n: number): string {
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}k`
  return String(n)
}

export const barFor = (pct: number) => BARS[Math.min(7, Math.floor(pct / 12.5))]!

/** Keeps the last HISTORY turns plus one more, so the oldest bar still has a delta. */
export const push = (readings: Reading[], r: Reading) => [...readings, r].slice(-(HISTORY + 1))

export function delta(readings: Reading[]): number {
  const last = readings[readings.length - 1]
  if (!last) return 0
  const prev = readings[readings.length - 2]
  return last.tokens - (prev ? prev.tokens : 0)
}

export function deltaText(d: number): string {
  return d >= 0 ? `▲ +${fmt(d)} last turn` : `▼ −${fmt(-d)} last turn`
}
