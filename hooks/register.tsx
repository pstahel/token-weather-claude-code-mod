import { atom, read, update } from 'claude-code'
import type { Register, SessionUsage, StateDollar } from 'claude-code'

import { HISTORY, barFor, delta, deltaText, fmt, percentOf, push, skyFor } from './forecast'

const readings = atom({ plugin: 'token-weather', key: 'readings' } as const, [])

async function takeReading($: StateDollar & { session: { usage: () => Promise<SessionUsage> } }) {
  const { context } = await $.session.usage()
  if (context.tokens === undefined || context.window <= 0) return
  const reading = { tokens: context.tokens, window: context.window }
  await update($, readings, rs => push(rs, reading))
}

export const register: Register = on => {
  // On load (and every reload), show the current fill right away.
  on('session.start', async ($, e, next) => {
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

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const rs = await read($, readings)
    const now = rs[rs.length - 1]
    if (!now) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const pct = percentOf(now)
    const sky = skyFor(pct)
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
              <Text key={`bar-${i}`} color={skyFor(p).color}>
                {barFor(p)}
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
