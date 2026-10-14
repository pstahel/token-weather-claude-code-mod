import type { CacheReading } from '../types'

export type CacheMode = 'off' | 'compact' | 'full'
export const CACHE_MODES: readonly CacheMode[] = ['full', 'compact', 'off']
export const TTLS = { '1h': 60, '5m': 5 } as const
export type Ttl = keyof typeof TTLS

const MINUTE = 60_000
const METER = 10

export const cacheModeOf = (v: unknown): CacheMode =>
  CACHE_MODES.includes(v as CacheMode) ? (v as CacheMode) : 'full'

export const ttlOf = (v: unknown): Ttl => (v === '5m' || v === '1h' ? v : '1h')

/** The cache line of one API response's usage, taken at `at` (ms since the epoch). */
export function cacheReadingOf(
  usage: { input_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number },
  at: number,
): CacheReading {
  return {
    read: usage.cache_read_input_tokens,
    written: usage.cache_creation_input_tokens,
    uncached: usage.input_tokens,
    at,
  }
}

export type CacheView = {
  state: 'warm' | 'cooling' | 'cold'
  /** Tokens held in the cache: what the last request read plus what it wrote. */
  cached: number
  /** Share of the last request's prompt the cache served, 0–100. */
  hitPct: number
  /** Whole minutes until the entry lapses (rounded up), 0 once cold. */
  minsLeft: number
  ttlMins: number
  /** Share of the TTL still left, 0–1. */
  left: number
}

/** Where the cache stands `now`: each request refreshes the entry for a full TTL. */
export function cacheView(c: CacheReading, now: number, ttl: Ttl): CacheView {
  const ttlMins = TTLS[ttl]
  const msLeft = Math.max(0, c.at + ttlMins * MINUTE - now)
  const prompt = c.read + c.written + c.uncached
  const left = msLeft / (ttlMins * MINUTE)
  return {
    state: msLeft === 0 ? 'cold' : left > 0.5 ? 'warm' : 'cooling',
    cached: c.read + c.written,
    hitPct: prompt > 0 ? Math.round((c.read / prompt) * 100) : 0,
    minsLeft: Math.ceil(msLeft / MINUTE),
    ttlMins,
    left,
  }
}

export const CACHE_COLORS = { warm: 'green', cooling: 'yellow', cold: 'red' } as const

export const meterFor = (left: number) => {
  const full = Math.round(left * METER)
  return '▰'.repeat(full) + '▱'.repeat(METER - full)
}
