import { test, expect } from 'claude-code/testing'
import { ANALOGY_NAMES } from './forecast'
import { LANGS, PHRASES, WORDS, langOf, rangeText } from './i18n'

test('every language has words for every analogy', async () => {
  for (const lang of LANGS) {
    for (const name of ANALOGY_NAMES) {
      const w = WORDS[lang][name]
      expect(w.steps.length).toBe(5)
      expect(w.cache.length).toBe(3)
      expect(w.unit.length).toBe(2)
      for (const s of [...w.steps, ...w.cache, ...w.unit, w.last]) expect(s.length).toBeGreaterThan(0)
    }
    expect(PHRASES[lang].timeLeft(42, 60)).toContain('42')
    expect(PHRASES[lang].rewrites('134.4k')).toContain('134.4k')
  }
})

test('the range counts the analogy units', async () => {
  expect(rangeText(5, ['trip', 'trips'])).toBe('~5 trips')
  expect(rangeText(1, ['trip', 'trips'])).toBe('~1 trip')
  expect(rangeText(undefined, ['Fahrt', 'Fahrten'])).toBe('~? Fahrten')
  expect(rangeText(99, ['turn', 'turns'])).toBe('~99+ turns')
  expect(langOf('de')).toBe('de')
  expect(langOf('xx')).toBe('en')
})
