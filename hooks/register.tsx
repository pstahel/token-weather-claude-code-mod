import { atom, read, update } from 'claude-code'
import type { Register, SessionUsage, StateDollar } from 'claude-code'

import {
  DEFAULT_ANALOGY,
  HISTORY,
  analogyFor,
  barFor,
  delta,
  deltaText,
  fmt,
  isAnalogy,
  percentOf,
  push,
  skyFor,
} from './forecast'
import { SETTINGS, parseCommand, settingsListing } from './command'
import { CACHE_COLORS, cacheCompact, cacheFull, cacheModeOf, cacheReadingOf, cacheView, ttlOf } from './cache'

const readings = atom({ plugin: 'token-weather', key: 'readings' } as const, [])
const cache = atom({ plugin: 'token-weather', key: 'cache' } as const, null)
/** Bumped on a timer so the cache countdown redraws between turns. */
const tick = atom({ plugin: 'token-weather', key: 'tick' } as const, 0)
const TICK_MS = 15_000

async function takeReading($: StateDollar & { session: { usage: () => Promise<SessionUsage> } }) {
  const { context } = await $.session.usage()
  if (context.tokens === undefined || context.window <= 0) return
  const reading = { tokens: context.tokens, window: context.window }
  await update($, readings, rs => push(rs, reading))
}

export const register: Register = (on, options) => {
  const currentAnalogy = isAnalogy(options.analogy) ? options.analogy : DEFAULT_ANALOGY
  const analogy = analogyFor(currentAnalogy)
  const cacheMode = cacheModeOf(options.cache)
  const ttl = ttlOf(options.cacheTtl)

  // On load (and every reload), register /token-weather and show the current fill right away.
  on('session.start', async ($, e, next) => {
    await $.command
      .register({
        name: 'token-weather',
        description: 'token-weather settings: analogy, cache row and cache lifetime',
        argumentHint: '[analogy | cache full|compact|off | ttl 1h|5m]',
      })
      .catch(() => {}) // the band works without the command
    if (cacheMode !== 'off') $.clock.every(TICK_MS, () => update($, tick, n => n + 1))
    const result = await next(e)
    if ((await read($, readings)).length === 0) await takeReading($)
    return result
  })

  // After every turn, take a reading of the context window.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (!e.agentId) await takeReading($) // skip subagents' turns
    return result
  })

  // After every main-thread API request, note what the prompt cache held and when.
  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    if (cacheMode !== 'off' && !e.agentId && result.usage) {
      const reading = cacheReadingOf(result.usage, await $.clock.now())
      await update($, cache, () => reading)
    }
    return result
  })

  // `/token-weather` lists the settings; `/token-weather moon`, `cache compact`, `ttl 5m` change one.
  on('command.run', { command: 'token-weather' }, async ($, e) => {
    const current = { analogy: currentAnalogy, cache: cacheMode, ttl }
    const parsed = parseCommand(e.args ?? '')
    if (parsed.kind === 'list') return { text: settingsListing(current) }
    if (parsed.kind === 'error') return { text: parsed.text }

    const { setting, value } = parsed
    if (current[setting] === value) return { text: `token-weather ${setting} is already ${value}.` }
    const { field } = SETTINGS[setting]
    const row = (await $.config.list()).find(
      r => r.key.startsWith('token-weather') && r.key.endsWith(`.${field}`),
    )
    if (!row) return { text: `token-weather: the ${setting} setting was not found in /config.` }
    const { deny } = await $.config.set({ key: row.key, value })
    if (deny) return { text: `token-weather: could not set ${setting} to ${value}: ${deny}` }
    return { text: `token-weather ${setting} is now ${value}.` }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const rs = await read($, readings)
    const now = rs[rs.length - 1]
    if (!now) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const pct = percentOf(now)
    const sky = skyFor(pct, analogy)
    const recent = rs.slice(-HISTORY)

    const c = cacheMode === 'off' ? null : await read($, cache)
    await read($, tick) // redraw on the timer, so the countdown moves
    const view = c ? cacheView(c, await $.clock.now(), ttl) : null
    const isFull = view && cacheMode === 'full' && e.props.maxRows >= 2

    const forecast = (
      <Box key="token-weather" flexDirection="row" gap={2}>
        <Text color={sky.color} bold>
          {sky.icon} {sky.word}
        </Text>
        <Text bold>
          {Math.floor(pct)}%
        </Text>
        <Text dimColor>
          {fmt(now.tokens)} / {fmt(now.window)}
        </Text>
        <Text>
          {recent.map((r, i) => {
            const p = percentOf(r)
            return (
              <Text key={`bar-${i}`} color={skyFor(p, analogy).color}>
                {barFor(p, analogy)}
              </Text>
            )
          })}
        </Text>
        <Text dimColor>
          {deltaText(delta(rs))}
        </Text>
        {view && !isFull ? (
          <Text key="token-weather-cache" color={CACHE_COLORS[view.state]}>
            {cacheCompact(view, now.tokens)}
          </Text>
        ) : null}
      </Box>
    )
    if (!view || !isFull) return forecast

    const row = cacheFull(view, now.tokens)
    const color = CACHE_COLORS[view.state]
    return (
      <Box key="token-weather-band" flexDirection="column">
        {forecast}
        <Box key="token-weather-cache" flexDirection="row" gap={2}>
          <Text color={color} bold>
            {row.head}
          </Text>
          <Text dimColor>{row.size}</Text>
          <Text color={color}>{row.meter}</Text>
          <Text dimColor>{row.time}</Text>
        </Box>
      </Box>
    )
  })
}
