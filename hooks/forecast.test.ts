import { test, expect } from 'claude-code/testing'
import { ANALOGIES, analogyOf, barFor, delta, deltaText, fmt, percentOf, push, rangeOf, stepOf } from './forecast'

test('steps follow the thresholds', async () => {
  expect([10, 25, 67.2, 89.9, 90, 100].map(stepOf)).toEqual([0, 1, 2, 3, 4, 4])
})

test('numbers read like the forecast', async () => {
  expect(`${fmt(134400)} / ${fmt(200000)}`).toBe('134.4k / 200k')
  expect(fmt(1000000)).toBe('1M')
  expect(Math.floor(percentOf({ tokens: 134400, window: 200000 }))).toBe(67)
})

test('bars chart what the analogy counts; the moon charts its phases', async () => {
  expect(barFor(0, ANALOGIES.weather)).toBe('▁')
  expect(barFor(100, ANALOGIES.weather)).toBe('█')
  expect(barFor(0, ANALOGIES.fuel)).toBe('█') // a full tank
  expect(barFor(95, ANALOGIES.fuel)).toBe('▁')
  expect(barFor(10, ANALOGIES.moon)).toBe('○')
  expect(barFor(95, ANALOGIES.moon)).toBe('●')
})

test('history keeps 13 readings; the delta is signed the way the analogy counts', async () => {
  let rs: { tokens: number; window: number }[] = []
  for (let i = 1; i <= 20; i++) rs = push(rs, { tokens: i * 1000, window: 200000 })
  expect(rs.length).toBe(13)
  rs = push(rs, { tokens: 118300, window: 200000 })
  expect(deltaText(delta(rs), ANALOGIES.weather, 'last turn')).toBe('▲ +98.3k last turn')
  expect(deltaText(delta(rs), ANALOGIES.fuel, 'last trip')).toBe('▼ −98.3k last trip')
  rs = push(rs, { tokens: 30000, window: 200000 })
  expect(deltaText(delta(rs), ANALOGIES.weather, 'last turn')).toBe('▼ −88.3k last turn')
  expect(deltaText(delta(rs), ANALOGIES.fuel, 'last trip')).toBe('▲ +88.3k last trip')
})

test('the range is the room left over the recent pace, /compacts left out', async () => {
  const at = (...tokens: number[]) => tokens.map(t => ({ tokens: t, window: 200000 }))
  expect(rangeOf(at(10000))).toBeUndefined()
  expect(rangeOf(at(10000, 20000))).toBeUndefined() // one turn is no pace yet
  expect(rangeOf(at(10000, 20000, 30000))).toBe(17) // 170k left at 10k a turn
  expect(rangeOf(at(100000, 150000, 40000, 50000, 60000))).toBe(6) // the compact drops out: 140k left at (10k+10k+50k)/3
  expect(rangeOf(at(0, 10, 20))).toBe(99)
})

test('an unknown analogy falls back to weather', async () => {
  expect(analogyOf('nope')).toBe('weather')
  expect(analogyOf('fuel')).toBe('fuel')
})
