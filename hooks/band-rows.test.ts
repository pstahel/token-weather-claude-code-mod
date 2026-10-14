import { test, expect } from 'claude-code/testing'
import { cacheRow, cacheSegment, forecastRow } from './band'
import { cacheReadingOf, cacheView } from './cache'

const MIN = 60_000
const rs = [36100, 70000, 100000, 134400].map(tokens => ({ tokens, window: 200000 }))
const c = cacheReadingOf({ input_tokens: 2000, cache_read_input_tokens: 120000, cache_creation_input_tokens: 8100 }, 0)

test('fuel counts what is left, in every word of the cockpit', async () => {
  const f = forecastRow(rs, 'fuel', 'en')
  expect(f.head).toBe('▰▰▰▱▱ Half tank')
  expect(f.pct).toBe('33% left')
  expect(f.tokens).toBe('65.6k / 200k')
  expect(f.bars.map(b => b.glyph).join('')).toBe('▇▆▅▃')
  expect(f.delta).toBe('▼ −34.4k last trip')
  expect(f.range).toBe('~2 trips')
  expect(forecastRow(rs, 'fuel', 'de')).toMatchObject({ head: '▰▰▰▱▱ Halber Tank', pct: '33% übrig', delta: '▼ −34.4k letzte Fahrt', range: '~2 Fahrten' })
})

test('weather counts what is used', async () => {
  expect(forecastRow(rs, 'weather', 'en')).toMatchObject({ head: '☂ Showers', pct: '67%', tokens: '134.4k / 200k', delta: '▲ +34.4k last turn' })
  expect(forecastRow(rs, 'weather', 'fr').head).toBe('☂ Averses')
})

test('the cache row is the analogy gauge', async () => {
  expect(cacheRow(cacheView(c, 18 * MIN, '1h'), 134400, 'fuel', 'en')).toEqual({
    head: '♨ engine warm', color: 'green', meter: 'C ▰▰▰▰▰▰▰▱▱▱ H', size: '128.1k (92% hit)', time: '42 of 60 min left',
  })
  expect(cacheRow(cacheView(c, 40 * MIN, '1h'), 134400, 'fuel', 'de')).toMatchObject({ head: '♨ Motor kühlt ab', color: 'yellow', time: 'noch 20 von 60 min' })
  expect(cacheRow(cacheView(c, 61 * MIN, '1h'), 134400, 'fuel', 'en')).toEqual({
    head: '♨ cold start', color: 'red', meter: 'C ▱▱▱▱▱▱▱▱▱▱ H', size: 'next turn rewrites 134.4k', time: undefined,
  })
  expect(cacheRow(cacheView(c, 0, '1h'), 134400, 'hearts', 'es').head).toBe('✦ buff activo')
  expect(cacheRow(cacheView(c, 0, '1h'), 134400, 'weather', 'en').meter).toBe('▰▰▰▰▰▰▰▰▰▰')
})

test('compact puts the gauge in one segment', async () => {
  expect(cacheSegment(cacheView(c, 18 * MIN, '1h'), 'fuel', 'en')).toBe('♨ engine warm 42′')
  expect(cacheSegment(cacheView(c, 61 * MIN, '1h'), 'daytime', 'it')).toBe('♨ caffè freddo')
})
