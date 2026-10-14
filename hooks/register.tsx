import { atom, read, update } from 'claude-code'
import type { Register, SessionUsage, StateDollar } from 'claude-code'

import {
  ANALOGIES,
  ANALOGY_NAMES,
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

const readings = atom({ plugin: 'token-weather', key: 'readings' } as const, [])

async function takeReading($: StateDollar & { session: { usage: () => Promise<SessionUsage> } }) {
  const { context } = await $.session.usage()
  if (context.tokens === undefined || context.window <= 0) return
  const reading = { tokens: context.tokens, window: context.window }
  await update($, readings, rs => push(rs, reading))
}

const COMMAND = 'token-weather'

/** Each analogy with its five steps, the current one marked. */
const listing = (current: string) =>
  ANALOGY_NAMES.map(name => {
    const steps = ANALOGIES[name].steps.map(s => s.icon).join('  ')
    return `${name === current ? '›' : ' '} ${name.padEnd(8)} ${steps}`
  }).join('\n')

export const register: Register = (on, options) => {
  const current = isAnalogy(options.analogy) ? options.analogy : DEFAULT_ANALOGY
  const analogy = analogyFor(current)

  // On load (and every reload), register /token-weather and show the current fill right away.
  on('session.start', async ($, e, next) => {
    await $.command
      .register({
        name: 'token-weather',
        description: `Switch the token-weather analogy: ${ANALOGY_NAMES.join(', ')}`,
        argumentHint: '[analogy]',
      })
      .catch(() => {}) // the band works without the command
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

  // `/token-weather` lists the analogies, `/token-weather moon` switches to one.
  on('command.run', { command: 'token-weather' }, async ($, e) => {
    const name = (e.args ?? '').trim().toLowerCase()
    if (!name) return { text: `Analogies (switch with /${COMMAND} <name>):\n${listing(current)}` }
    if (!isAnalogy(name)) {
      return { text: `Unknown analogy "${name}". Pick one of: ${ANALOGY_NAMES.join(', ')}` }
    }
    if (name === current) return { text: `token-weather already shows ${name}.` }

    const row = (await $.config.list()).find(
      r => r.key.startsWith('token-weather') && r.key.endsWith('.analogy'),
    )
    if (!row) return { text: 'token-weather: the analogy setting was not found in /config.' }
    const { deny } = await $.config.set({ key: row.key, value: name })
    if (deny) return { text: `token-weather: could not switch to ${name}: ${deny}` }
    return { text: `token-weather now shows ${name}.` }
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

    return (
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
      </Box>
    )
  })
}
