import { ANALOGIES, ANALOGY_NAMES } from './forecast'
import { CACHE_MODES, TTLS } from './cache'

/** The settings `/token-weather` changes: its word for each, and the `userConfig` field behind it. */
export const SETTINGS = {
  analogy: { field: 'analogy', values: ANALOGY_NAMES as readonly string[] },
  cache: { field: 'cache', values: CACHE_MODES as readonly string[] },
  ttl: { field: 'cacheTtl', values: Object.keys(TTLS) as readonly string[] },
} as const
export type Setting = keyof typeof SETTINGS

export type Parsed =
  | { kind: 'list' }
  | { kind: 'set'; setting: Setting; value: string }
  | { kind: 'error'; text: string }

const ALIASES: Record<string, Setting> = { analogy: 'analogy', cache: 'cache', ttl: 'ttl', cachettl: 'ttl' }
const SETTING_NAMES = Object.keys(SETTINGS) as Setting[]

/** The one setting a bare value belongs to; the value lists do not overlap. */
const settingOf = (value: string) => SETTING_NAMES.find(s => SETTINGS[s].values.includes(value))

/**
 * Reads `/token-weather` arguments: nothing lists the settings, `<setting> <value>` sets one,
 * and a bare value (`moon`, `compact`, `5m`) sets the setting it belongs to.
 */
export function parseCommand(args: string): Parsed {
  const words = args.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return { kind: 'list' }

  const named = ALIASES[words[0]!]
  if (named) {
    const value = words[1]
    const { values } = SETTINGS[named]
    if (!value) return { kind: 'error', text: `/token-weather ${named} takes one of: ${values.join(', ')}` }
    if (!values.includes(value)) {
      return { kind: 'error', text: `Unknown ${named} "${value}". Pick one of: ${values.join(', ')}` }
    }
    return { kind: 'set', setting: named, value }
  }

  const setting = settingOf(words[0]!)
  if (words.length === 1 && setting) return { kind: 'set', setting, value: words[0]! }
  return {
    kind: 'error',
    text: `Unknown "${words.join(' ')}". Try /token-weather to list the settings, e.g. /token-weather cache compact`,
  }
}

/** What `/token-weather` alone shows: every setting with its current value marked. */
export function settingsListing(current: Record<Setting, string>): string {
  const rows = SETTING_NAMES.map(s => {
    const values = SETTINGS[s].values.map(v => (v === current[s] ? `›${v}` : v)).join('  ')
    return `  ${s.padEnd(8)} ${values}`
  })
  const analogies = ANALOGY_NAMES.map(name => {
    const steps = ANALOGIES[name].steps.map(st => st.icon).join('  ')
    return `  ${name === current.analogy ? '›' : ' '} ${name.padEnd(8)} ${steps}`
  })
  return [
    'token-weather settings (change with /token-weather <setting> <value>):',
    ...rows,
    '',
    'Analogies:',
    ...analogies,
  ].join('\n')
}
