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
