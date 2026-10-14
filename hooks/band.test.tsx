import { test, expect } from 'claude-code/testing'

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
    expect(line?.text).toBe('☂ Showers67%134.4k / 200k▂▆▲ +98.3k last turn')
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
    expect(line?.text).toBe('◑ Half moon67%134.4k / 200k◑▲ +134.4k last turn')
    await ui.unmount()
  }
})

test('/token-weather lists the analogies and refuses unknown ones', async ($, on) => {
  on('command.run', () => ({ text: '' }))
  // the test kit fills the engine-stamped fields (origin, presentation)
  const run = (args: string) =>
    $.command.run({ command: 'token-weather', args } as Parameters<typeof $.command.run>[0])

  const { text } = await run('')
  expect(text).toContain('› weather')
  expect(text).toContain('moon')
  const bad = await run('sauna')
  expect(bad.text).toContain('Unknown analogy "sauna"')
})
