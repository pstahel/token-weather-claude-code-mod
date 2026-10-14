import type { Reading } from '../types'

export const HISTORY = 12
const BARS = '▁▂▃▄▅▆▇█'
/** How many recent turns the range averages over. */
const RANGE_TURNS = 5
const RANGE_MAX = 99

type Five<T> = readonly [T, T, T, T, T]

/**
 * An analogy's look, the same in every language (the words are in i18n.ts):
 * five steps over the shared thresholds, whether it counts what is used or what
 * is left, how a past turn is charted, and the gauge it gives the prompt cache.
 */
export type Analogy = {
  icons: Five<string>
  colors: Five<string>
  /** `left` shows what remains (a fuel gauge, hit points); `used` what is taken. */
  counts: 'used' | 'left'
  chart: 'bars' | 'steps'
  cacheIcon: string
  /** Labels at the ends of the cache meter, cold first. */
  scale?: readonly [string, string]
}

/** Upper bounds (in % of the window used) of the first four steps; the fifth takes the rest. */
const THRESHOLDS = [25, 50, 75, 90]

export const ANALOGIES = {
  weather: {
    icons: ['☀', '☁', '☂', '☇', '↯'],
    colors: ['yellow', 'cyan', 'blue', 'magenta', 'red'],
    counts: 'used',
    chart: 'bars',
    cacheIcon: '°',
  },
  moon: {
    icons: ['○', '◔', '◑', '◕', '●'],
    colors: ['gray', 'cyan', 'blue', 'magenta', 'red'],
    counts: 'used',
    chart: 'steps',
    cacheIcon: '✧',
  },
  hearts: {
    icons: ['♥♥♥♥♥', '♥♥♥♥♡', '♥♥♥♡♡', '♥♥♡♡♡', '♥♡♡♡♡'],
    colors: ['green', 'green', 'yellow', 'magenta', 'red'],
    counts: 'left',
    chart: 'bars',
    cacheIcon: '✦',
  },
  fuel: {
    icons: ['▰▰▰▰▰', '▰▰▰▰▱', '▰▰▰▱▱', '▰▰▱▱▱', '▰▱▱▱▱'],
    colors: ['green', 'green', 'yellow', 'magenta', 'red'],
    counts: 'left',
    chart: 'bars',
    cacheIcon: '♨',
    scale: ['C', 'H'],
  },
  pot: {
    icons: ['·', '~', '≈', '≋', '‼'],
    colors: ['blue', 'cyan', 'yellow', 'magenta', 'red'],
    counts: 'used',
    chart: 'bars',
    cacheIcon: '♨',
  },
  tide: {
    icons: ['_', '~', '≈', '≋', '↟'],
    colors: ['cyan', 'cyan', 'blue', 'magenta', 'red'],
    counts: 'used',
    chart: 'bars',
    cacheIcon: '☼',
  },
  daytime: {
    icons: ['☼', '☀', '◐', '☾', '✦'],
    colors: ['yellow', 'yellow', 'cyan', 'blue', 'red'],
    counts: 'used',
    chart: 'bars',
    cacheIcon: '♨',
  },
  volcano: {
    icons: ['▲', '▲', '▲', '▲', '✸'],
    colors: ['green', 'yellow', 'yellow', 'magenta', 'red'],
    counts: 'used',
    chart: 'bars',
    cacheIcon: '◉',
  },
} as const satisfies Record<string, Analogy>

export type AnalogyName = keyof typeof ANALOGIES
export const DEFAULT_ANALOGY: AnalogyName = 'weather'
export const ANALOGY_NAMES = Object.keys(ANALOGIES) as AnalogyName[]

export const isAnalogy = (name: unknown): name is AnalogyName =>
  typeof name === 'string' && Object.hasOwn(ANALOGIES, name)

export const analogyOf = (name: unknown): AnalogyName => (isAnalogy(name) ? name : DEFAULT_ANALOGY)

/** Share of the window used, 0–100. */
export const percentOf = (r: Reading) => Math.min(100, (r.tokens / r.window) * 100)

/** Which of the five steps a fill (in % used) is in, 0–4. */
export const stepOf = (pct: number) => {
  const i = THRESHOLDS.findIndex(t => pct < t)
  return i === -1 ? THRESHOLDS.length : i
}

export function fmt(n: number): string {
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}k`
  return String(n)
}

/** One past turn in the chart: a bar of what the analogy counts, or its step glyph (moon phases). */
export function barFor(pct: number, a: Analogy): string {
  if (a.chart === 'steps') return a.icons[stepOf(pct)]!
  const shown = a.counts === 'left' ? 100 - pct : pct
  return BARS[Math.min(7, Math.floor(shown / 12.5))]!
}

/** Keeps the last HISTORY turns plus one more, so the oldest bar still has a delta. */
export const push = (readings: Reading[], r: Reading) => [...readings, r].slice(-(HISTORY + 1))

/** Tokens the last turn added (negative after a /compact). */
export function delta(readings: Reading[]): number {
  const last = readings[readings.length - 1]
  if (!last) return 0
  const prev = readings[readings.length - 2]
  return last.tokens - (prev ? prev.tokens : 0)
}

/** The last turn's delta, signed the way the analogy counts: a fuel gauge drops as tokens are used. */
export function deltaText(d: number, a: Analogy, last: string): string {
  const isRise = a.counts === 'left' ? d < 0 : d >= 0
  return `${isRise ? '▲ +' : '▼ −'}${fmt(Math.abs(d))} ${last}`
}

/**
 * How many more turns fit in the window at the recent pace: the room left over the
 * average growth of the last few turns, /compacts left out. Undefined until two turns grew.
 */
export function rangeOf(readings: Reading[]): number | undefined {
  const growth: number[] = []
  for (let i = readings.length - 1; i > 0 && growth.length < RANGE_TURNS; i--) {
    const d = readings[i]!.tokens - readings[i - 1]!.tokens
    if (d > 0) growth.push(d)
  }
  const now = readings[readings.length - 1]
  if (!now || growth.length < 2) return undefined
  const pace = growth.reduce((s, d) => s + d, 0) / growth.length
  return Math.min(RANGE_MAX, Math.floor(Math.max(0, now.window - now.tokens) / pace))
}
