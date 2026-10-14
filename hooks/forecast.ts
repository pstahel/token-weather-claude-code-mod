import type { Reading } from '../types'

export const HISTORY = 12
const BARS = '▁▂▃▄▅▆▇█'

/** One step of an analogy: what the band shows while the fill is in its range. */
export type Sky = { icon: string; word: string; color: string }

/** An analogy: five steps over the shared thresholds, and how a past turn is charted. */
export type Analogy = { steps: [Sky, Sky, Sky, Sky, Sky]; chart: 'bars' | 'steps' }

/** Upper bounds (in % of the window) of the first four steps; the fifth takes the rest. */
const THRESHOLDS = [25, 50, 75, 90]

export const ANALOGIES = {
  weather: {
    chart: 'bars',
    steps: [
      { icon: '☀', word: 'Clear', color: 'yellow' },
      { icon: '☁', word: 'Cloudy', color: 'cyan' },
      { icon: '☂', word: 'Showers', color: 'blue' },
      { icon: '☇', word: 'Storm', color: 'magenta' },
      { icon: '↯', word: 'Compact soon', color: 'red' },
    ],
  },
  moon: {
    chart: 'steps',
    steps: [
      { icon: '○', word: 'New moon', color: 'gray' },
      { icon: '◔', word: 'Waxing', color: 'cyan' },
      { icon: '◑', word: 'Half moon', color: 'blue' },
      { icon: '◕', word: 'Gibbous', color: 'magenta' },
      { icon: '●', word: 'Full moon, compact soon', color: 'red' },
    ],
  },
  hearts: {
    chart: 'bars',
    steps: [
      { icon: '♥♥♥♥♥', word: 'Full health', color: 'green' },
      { icon: '♥♥♥♥♡', word: 'Scratched', color: 'green' },
      { icon: '♥♥♥♡♡', word: 'Wounded', color: 'yellow' },
      { icon: '♥♥♡♡♡', word: 'Critical', color: 'magenta' },
      { icon: '♥♡♡♡♡', word: 'Low HP, /compact to heal', color: 'red' },
    ],
  },
  fuel: {
    chart: 'bars',
    steps: [
      { icon: '▰▰▰▰▰', word: 'Full tank', color: 'green' },
      { icon: '▰▰▰▰▱', word: 'Three quarters', color: 'green' },
      { icon: '▰▰▰▱▱', word: 'Half tank', color: 'yellow' },
      { icon: '▰▰▱▱▱', word: 'Reserve', color: 'magenta' },
      { icon: '▰▱▱▱▱', word: 'Refuel, /compact', color: 'red' },
    ],
  },
  pot: {
    chart: 'bars',
    steps: [
      { icon: '·', word: 'Cold', color: 'blue' },
      { icon: '~', word: 'Warm', color: 'cyan' },
      { icon: '≈', word: 'Simmering', color: 'yellow' },
      { icon: '≋', word: 'Boiling', color: 'magenta' },
      { icon: '‼', word: 'Boiling over', color: 'red' },
    ],
  },
  tide: {
    chart: 'bars',
    steps: [
      { icon: '_', word: 'Low tide', color: 'cyan' },
      { icon: '~', word: 'Calm', color: 'cyan' },
      { icon: '≈', word: 'Swell', color: 'blue' },
      { icon: '≋', word: 'Surf', color: 'magenta' },
      { icon: '↟', word: 'Storm surge', color: 'red' },
    ],
  },
  daytime: {
    chart: 'bars',
    steps: [
      { icon: '☼', word: 'Morning', color: 'yellow' },
      { icon: '☀', word: 'Noon', color: 'yellow' },
      { icon: '◐', word: 'Afternoon', color: 'cyan' },
      { icon: '☾', word: 'Evening', color: 'blue' },
      { icon: '✦', word: 'Midnight, time to compact', color: 'red' },
    ],
  },
  volcano: {
    chart: 'bars',
    steps: [
      { icon: '▲', word: 'Dormant', color: 'green' },
      { icon: '▲', word: 'Rumbling', color: 'yellow' },
      { icon: '▲', word: 'Smoking', color: 'yellow' },
      { icon: '▲', word: 'Glowing', color: 'magenta' },
      { icon: '✸', word: 'Eruption, compact now', color: 'red' },
    ],
  },
} as const satisfies Record<string, Analogy>

export type AnalogyName = keyof typeof ANALOGIES
export const DEFAULT_ANALOGY: AnalogyName = 'weather'
export const ANALOGY_NAMES = Object.keys(ANALOGIES) as AnalogyName[]

export const isAnalogy = (name: unknown): name is AnalogyName =>
  typeof name === 'string' && Object.hasOwn(ANALOGIES, name)

export const analogyFor = (name: unknown): Analogy =>
  ANALOGIES[isAnalogy(name) ? name : DEFAULT_ANALOGY]

export const percentOf = (r: Reading) => Math.min(100, (r.tokens / r.window) * 100)

const stepOf = (pct: number) => {
  const i = THRESHOLDS.findIndex(t => pct < t)
  return i === -1 ? THRESHOLDS.length : i
}

export const skyFor = (pct: number, analogy: Analogy = ANALOGIES[DEFAULT_ANALOGY]): Sky =>
  analogy.steps[stepOf(pct)]!

export function fmt(n: number): string {
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}k`
  return String(n)
}

/** One past turn in the chart: a bar, or the analogy's own step glyph (moon phases). */
export function barFor(pct: number, analogy: Analogy = ANALOGIES[DEFAULT_ANALOGY]): string {
  if (analogy.chart === 'steps') return skyFor(pct, analogy).icon
  return BARS[Math.min(7, Math.floor(pct / 12.5))]!
}

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
