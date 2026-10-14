import { test, expect } from 'claude-code/testing'
import { cacheCompact, cacheFull, cacheModeOf, cacheReadingOf, cacheView, meterFor, ttlOf } from './cache'

const MIN = 60_000
const usage = { input_tokens: 2000, cache_read_input_tokens: 120000, cache_creation_input_tokens: 8100 }
const c = cacheReadingOf(usage, 0)

test('the cache warms, cools and goes cold over its TTL', async () => {
  expect(cacheView(c, 0, '1h')).toEqual({ state: 'warm', cached: 128100, hitPct: 92, minsLeft: 60, ttlMins: 60, left: 1 })
  expect(cacheView(c, 29 * MIN, '1h').state).toBe('warm')
  expect(cacheView(c, 31 * MIN, '1h').state).toBe('cooling')
  expect(cacheView(c, 59.5 * MIN, '1h').minsLeft).toBe(1)
  expect(cacheView(c, 60 * MIN, '1h').state).toBe('cold')
  expect(cacheView(c, 4 * MIN, '5m').minsLeft).toBe(1)
  expect(cacheView(c, 5 * MIN, '5m').state).toBe('cold')
})

test('both variants read like the mockup', async () => {
  const warm = cacheView(c, 18 * MIN, '1h')
  expect(cacheCompact(warm, 134400)).toBe('⧗ 128.1k cached · 42 min')
  expect(cacheFull(warm, 134400)).toEqual({
    head: '⧗ Cache', size: '128.1k (92% hit)', meter: '███████░░░', time: '42 of 60 min left',
  })
  const cold = cacheView(c, 61 * MIN, '1h')
  expect(cacheCompact(cold, 134400)).toBe('❄ cache cold · next turn rewrites 134.4k')
  expect(cacheFull(cold, 134400).size).toBe('next turn rewrites 134.4k')
})

test('options fall back to full and 1h', async () => {
  expect(cacheModeOf('compact')).toBe('compact')
  expect(cacheModeOf('nope')).toBe('full')
  expect(ttlOf('5m')).toBe('5m')
  expect(ttlOf(undefined)).toBe('1h')
  expect(meterFor(0)).toBe('░░░░░░░░░░')
  expect(meterFor(1)).toBe('██████████')
})
