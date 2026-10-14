import { test, expect, mock } from 'claude-code/testing'

const BAND = {
  component: 'AbovePrompt',
  props: {
    hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 10 }, view: {},
  },
} as const

const TURN = { answer: '', durationMs: 1000, isAborted: false, turnId: 't', reason: 'answer' } as const

test('the band forecasts after each turn, on every surface', async ($, on) => {
  const fill = [36100, 134400]
  let i = 0
  on('session.usage', () => ({
    value: { startedAt: 0, rateLimits: [], context: { tokens: fill[i] ?? 0, window: 200000 } },
  }))
  on('turn.complete', () => ({ text: '' }))
  on('ui.render', () => ({ type: 'Box', props: {}, children: [] }))

  await $.turn.complete(TURN)
  i = 1
  await $.turn.complete(TURN)
  await $.turn.complete({ ...TURN, agentId: 'sub' }) // ignored

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'token-weather', surface, ...BAND })
    const line = await ui.find({ key: 'token-weather' })
    expect(line?.text).toBe('☂ Showers67%134.4k / 200k▂▆▲ +98.3k last turn~? turns')
    expect(await ui.find({ type: 'Text', text: '☂ Showers' })).toBeDefined()
    await ui.unmount()
  }
})

test('the band stays out of the way before the first turn', async ($, on) => {
  on('ui.render', () => ({ type: 'Box', props: {}, children: [] }))
  const ui = await $.ui.mount({ plugin: 'token-weather', surface: 'terminal', ...BAND })
  expect(await ui.find({ key: 'token-weather' })).toBeUndefined()
  await ui.unmount()
})

test('the band speaks the chosen analogy', { options: { analogy: 'moon' } }, async ($, on) => {
  on('session.usage', () => ({
    value: { startedAt: 0, rateLimits: [], context: { tokens: 134400, window: 200000 } },
  }))
  on('turn.complete', () => ({ text: '' }))
  on('ui.render', () => ({ type: 'Box', props: {}, children: [] }))

  await $.turn.complete(TURN)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'token-weather', surface, ...BAND })
    const line = await ui.find({ key: 'token-weather' })
    expect(line?.text).toBe('◑ Half moon67%134.4k / 200k◑▲ +134.4k last night~? nights')
    await ui.unmount()
  }
})

test('/token-weather lists the settings and changes one', async ($, on) => {
  const rows = ['analogy', 'cache', 'cacheTtl', 'language'].map(f => ({
    key: `token-weather@inline.${f}`, label: f, kind: 'choice', value: '', provider: { plugin: 'token-weather', tier: 'user' }, isLocked: false,
  }))
  const sets: unknown[] = []
  on('command.run', () => ({ text: '' }))
  on('config.list', () => ({ value: rows }) as never)
  on('config.set', (_$, e) => {
    sets.push({ key: e.key, value: e.value })
    return { value: e.value }
  })
  // the test kit fills the engine-stamped fields (origin, presentation)
  const run = (args: string) =>
    $.command.run({ command: 'token-weather', args } as Parameters<typeof $.command.run>[0])

  const { text } = await run('')
  expect(text).toContain('analogy  ›weather')
  expect(text).toContain('cache    ›full  compact  off')
  expect(text).toContain('ttl      ›1h  5m')
  expect(text).toContain('lang     ›en  de  es  it  fr')

  expect((await run('cache compact')).text).toBe('token-weather cache is now compact.')
  expect((await run('ttl 5m')).text).toBe('token-weather ttl is now 5m.')
  expect((await run('moon')).text).toBe('token-weather analogy is now moon.')
  expect((await run('off')).text).toBe('token-weather cache is now off.')
  expect((await run('lang de')).text).toBe('token-weather lang is now de.')
  expect((await run('fr')).text).toBe('token-weather lang is now fr.')
  expect((await run('cache full')).text).toBe('token-weather cache is already full.')
  expect(sets).toEqual([
    { key: 'token-weather@inline.cache', value: 'compact' },
    { key: 'token-weather@inline.cacheTtl', value: '5m' },
    { key: 'token-weather@inline.analogy', value: 'moon' },
    { key: 'token-weather@inline.cache', value: 'off' },
    { key: 'token-weather@inline.language', value: 'de' },
    { key: 'token-weather@inline.language', value: 'fr' },
  ])
  expect((await run('sauna')).text).toContain('Unknown "sauna"')
  expect((await run('ttl 2h')).text).toBe('Unknown ttl "2h". Pick one of: 1h, 5m')
})

const STEP = { turnId: 't', index: 0, model: 'm', messageCount: 1 } as const
const USAGE = {
  input_tokens: 2000, output_tokens: 300, cache_read_input_tokens: 120000,
  cache_creation_input_tokens: 8100, model: 'm',
}

test('the cache row counts down and goes cold', async ($, on) => {
  const clock = mock.clock(on, { now: 0 })
  on('session.usage', () => ({
    value: { startedAt: 0, rateLimits: [], context: { tokens: 134400, window: 200000 } },
  }))
  on('turn.complete', () => ({ text: '' }))
  on('turn.step', async function* () {
    return { turnId: 't', index: 0, answer: '', toolUses: [], stopReason: 'end_turn', usage: USAGE }
  })
  on('ui.render', () => ({ type: 'Box', props: {}, children: [] }))

  for await (const _ of $.turn.step(STEP)) void _
  await $.turn.complete(TURN)
  await clock.advance(18 * 60_000)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'token-weather', surface, ...BAND })
    const row = await ui.find({ key: 'token-weather-cache' })
    expect(row?.text).toBe('° mild▰▰▰▰▰▰▰▱▱▱128.1k (92% hit)42 of 60 min left')
    await ui.unmount()
  }

  await clock.advance(43 * 60_000)
  const ui = await $.ui.mount({ plugin: 'token-weather', surface: 'terminal', ...BAND })
  expect((await ui.find({ key: 'token-weather-cache' }))?.text).toBe(
    '° frost▱▱▱▱▱▱▱▱▱▱next turn rewrites 134.4k',
  )
  await ui.unmount()
})

test('compact puts the cache on the forecast row', { options: { cache: 'compact' } }, async ($, on) => {
  mock.clock(on, { now: 0 })
  on('session.usage', () => ({
    value: { startedAt: 0, rateLimits: [], context: { tokens: 134400, window: 200000 } },
  }))
  on('turn.complete', () => ({ text: '' }))
  on('turn.step', async function* () {
    return { turnId: 't', index: 0, answer: '', toolUses: [], stopReason: 'end_turn', usage: USAGE }
  })
  on('ui.render', () => ({ type: 'Box', props: {}, children: [] }))

  for await (const _ of $.turn.step(STEP)) void _
  await $.turn.complete(TURN)

  const ui = await $.ui.mount({ plugin: 'token-weather', surface: 'terminal', ...BAND })
  const line = await ui.find({ key: 'token-weather' })
  expect(line?.text).toBe('☂ Showers67%134.4k / 200k▆▲ +134.4k last turn~? turns° mild 60′')
  await ui.unmount()
})

test('the fuel cockpit in German', { options: { analogy: 'fuel', language: 'de' } }, async ($, on) => {
  mock.clock(on, { now: 0 })
  const fill = [36100, 70000, 100000, 134400]
  let i = 0
  on('session.usage', () => ({
    value: { startedAt: 0, rateLimits: [], context: { tokens: fill[i] ?? 0, window: 200000 } },
  }))
  on('turn.complete', () => ({ text: '' }))
  on('turn.step', async function* () {
    return { turnId: 't', index: 0, answer: '', toolUses: [], stopReason: 'end_turn', usage: USAGE }
  })
  on('ui.render', () => ({ type: 'Box', props: {}, children: [] }))

  for (i = 0; i < fill.length; i++) await $.turn.complete(TURN)
  i = fill.length - 1
  for await (const _ of $.turn.step(STEP)) void _

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'token-weather', surface, ...BAND })
    expect((await ui.find({ key: 'token-weather' }))?.text).toBe(
      '▰▰▰▱▱ Halber Tank33% übrig65.6k / 200k▇▆▅▃▼ −34.4k letzte Fahrt~2 Fahrten',
    )
    expect((await ui.find({ key: 'token-weather-cache' }))?.text).toBe(
      '♨ Motor warmC ▰▰▰▰▰▰▰▰▰▰ H128.1k (92% Treffer)noch 60 von 60 min',
    )
    await ui.unmount()
  }
})
