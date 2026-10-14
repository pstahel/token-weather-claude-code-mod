import { test, expect } from 'claude-code/testing'
import { ANALOGIES, ANALOGY_NAMES, analogyFor, barFor, delta, deltaText, fmt, percentOf, push, skyFor } from './forecast'

test('weather bands follow the thresholds', async () => {
  expect(skyFor(10).word).toBe('Clear')
  expect(skyFor(25).word).toBe('Cloudy')
  expect(skyFor(67.2).word).toBe('Showers')
  expect(skyFor(89.9).word).toBe('Storm')
  expect(skyFor(90).word).toBe('Compact soon')
})

test('numbers read like the forecast', async () => {
  expect(`${fmt(134400)} / ${fmt(200000)}`).toBe('134.4k / 200k')
  expect(fmt(1000000)).toBe('1M')
  expect(barFor(0)).toBe('▁')
  expect(barFor(100)).toBe('█')
  expect(Math.floor(percentOf({ tokens: 134400, window: 200000 }))).toBe(67)
})

test('history keeps 13 readings and the last turn delta', async () => {
  let rs: { tokens: number; window: number }[] = []
  for (let i = 1; i <= 20; i++) rs = push(rs, { tokens: i * 1000, window: 200000 })
  expect(rs.length).toBe(13)
  rs = push(rs, { tokens: 118300, window: 200000 })
  expect(deltaText(delta(rs))).toBe('▲ +98.3k last turn')
  rs = push(rs, { tokens: 30000, window: 200000 })
  expect(deltaText(delta(rs))).toBe('▼ −88.3k last turn')
})

test('every analogy has five steps on the same thresholds', async () => {
  for (const name of ANALOGY_NAMES) {
    const a = ANALOGIES[name]
    expect(a.steps.length).toBe(5)
    expect(skyFor(0, a)).toBe(a.steps[0])
    expect(skyFor(24.9, a)).toBe(a.steps[0])
    expect(skyFor(25, a)).toBe(a.steps[1])
    expect(skyFor(74.9, a)).toBe(a.steps[2])
    expect(skyFor(89.9, a)).toBe(a.steps[3])
    expect(skyFor(100, a)).toBe(a.steps[4])
  }
})

test('an unknown analogy falls back to weather; the moon charts its phases', async () => {
  expect(analogyFor('nope')).toBe(ANALOGIES.weather)
  expect(analogyFor(undefined)).toBe(ANALOGIES.weather)
  expect(skyFor(67, analogyFor('hearts')).word).toBe('Wounded')
  expect(barFor(10, ANALOGIES.moon)).toBe('○')
  expect(barFor(95, ANALOGIES.moon)).toBe('●')
  expect(barFor(95, ANALOGIES.fuel)).toBe('█')
})
