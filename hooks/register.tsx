import { atom, read, update } from 'claude-code'
import type { Register, SessionUsage, StateDollar } from 'claude-code'

import { analogyOf, push } from './forecast'
import { SETTINGS, parseCommand, settingsListing } from './command'
import { cacheModeOf, cacheReadingOf, cacheView, ttlOf } from './cache'
import { cacheRow, cacheSegment, forecastRow } from './band'
import { langOf } from './i18n'

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
  const analogy = analogyOf(options.analogy)
  const lang = langOf(options.language)
  const cacheMode = cacheModeOf(options.cache)
  const ttl = ttlOf(options.cacheTtl)

  // On load (and every reload), register /token-weather and show the current fill right away.
  on('session.start', async ($, e, next) => {
    await $.command
      .register({
        name: 'token-weather',
        description: 'token-weather settings: analogy, cache row, cache lifetime and language',
        argumentHint: '[analogy | cache full|compact|off | ttl 1h|5m | lang en|de|es|it|fr]',
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

  // `/token-weather` lists the settings; `/token-weather moon`, `cache compact`, `ttl 5m`, `de` change one.
  on('command.run', { command: 'token-weather' }, async ($, e) => {
    const current = { analogy, cache: cacheMode, ttl, lang }
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
    const f = forecastRow(rs, analogy, lang)

    const c = cacheMode === 'off' ? null : await read($, cache)
    await read($, tick) // redraw on the timer, so the countdown moves
    const view = c ? cacheView(c, await $.clock.now(), ttl) : null
    const isFull = view && cacheMode === 'full' && e.props.maxRows >= 2

    const forecast = (
      <Box key="token-weather" flexDirection="row" gap={2}>
        <Text color={f.color} bold>
          {f.head}
        </Text>
        <Text bold>{f.pct}</Text>
        <Text dimColor>{f.tokens}</Text>
        <Text>
          {f.bars.map((b, i) => (
            <Text key={`bar-${i}`} color={b.color}>
              {b.glyph}
            </Text>
          ))}
        </Text>
        <Text dimColor>{f.delta}</Text>
        <Text dimColor>{f.range}</Text>
        {view && !isFull ? (
          <Text key="token-weather-cache" color={cacheRow(view, now.tokens, analogy, lang).color}>
            {cacheSegment(view, analogy, lang)}
          </Text>
        ) : null}
      </Box>
    )
    if (!view || !isFull) return forecast

    const row = cacheRow(view, now.tokens, analogy, lang)
    return (
      <Box key="token-weather-band" flexDirection="column">
        {forecast}
        <Box key="token-weather-cache" flexDirection="row" gap={2}>
          <Text color={row.color} bold>
            {row.head}
          </Text>
          <Text color={row.color}>{row.meter}</Text>
          <Text dimColor>{row.size}</Text>
          {row.time ? <Text dimColor>{row.time}</Text> : null}
        </Box>
      </Box>
    )
  })
}
