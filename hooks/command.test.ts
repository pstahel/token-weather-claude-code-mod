import { test, expect } from 'claude-code/testing'
import { parseCommand } from './command'

test('arguments name a setting and a value, or a bare value', async () => {
  expect(parseCommand('')).toEqual({ kind: 'list' })
  expect(parseCommand('  ')).toEqual({ kind: 'list' })
  expect(parseCommand('Moon')).toEqual({ kind: 'set', setting: 'analogy', value: 'moon' })
  expect(parseCommand('analogy hearts')).toEqual({ kind: 'set', setting: 'analogy', value: 'hearts' })
  expect(parseCommand('cache compact')).toEqual({ kind: 'set', setting: 'cache', value: 'compact' })
  expect(parseCommand('compact')).toEqual({ kind: 'set', setting: 'cache', value: 'compact' })
  expect(parseCommand('ttl 5m')).toEqual({ kind: 'set', setting: 'ttl', value: '5m' })
  expect(parseCommand('cacheTtl 1h')).toEqual({ kind: 'set', setting: 'ttl', value: '1h' })
  expect(parseCommand('5m')).toEqual({ kind: 'set', setting: 'ttl', value: '5m' })
})

test('unknown settings and values say what fits', async () => {
  expect(parseCommand('cache')).toEqual({ kind: 'error', text: '/token-weather cache takes one of: full, compact, off' })
  expect(parseCommand('cache huge').kind).toBe('error')
  expect(parseCommand('moon compact').kind).toBe('error')
  expect(parseCommand('sauna').kind).toBe('error')
})
