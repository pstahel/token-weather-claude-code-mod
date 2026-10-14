import type { Reading } from '../types'
import { ANALOGIES, HISTORY, barFor, delta, deltaText, fmt, percentOf, rangeOf, stepOf } from './forecast'
import type { AnalogyName } from './forecast'
import { CACHE_COLORS, meterFor } from './cache'
import type { CacheView } from './cache'
import { PHRASES, WORDS, rangeText } from './i18n'
import type { Lang } from './i18n'

const STATE = { warm: 0, cooling: 1, cold: 2 } as const

/** The pieces of the forecast row, in the analogy's look and the language's words. */
export function forecastRow(rs: Reading[], name: AnalogyName, lang: Lang) {
  const a = ANALOGIES[name]
  const w = WORDS[lang][name]
  const now = rs[rs.length - 1]!
  const pct = percentOf(now)
  const i = stepOf(pct)
  const isLeft = a.counts === 'left'
  return {
    head: `${a.icons[i]} ${w.steps[i]}`,
    color: a.colors[i] as string,
    pct: isLeft ? `${100 - Math.floor(pct)}% ${PHRASES[lang].left}` : `${Math.floor(pct)}%`,
    tokens: `${fmt(isLeft ? Math.max(0, now.window - now.tokens) : now.tokens)} / ${fmt(now.window)}`,
    bars: rs.slice(-HISTORY).map(r => {
      const p = percentOf(r)
      return { glyph: barFor(p, a), color: a.colors[stepOf(p)] as string }
    }),
    delta: deltaText(delta(rs), a, w.last),
    range: rangeText(rangeOf(rs), w.unit),
  }
}

/** The pieces of the cache row (variant full): the analogy's gauge, its meter, size and time. */
export function cacheRow(v: CacheView, context: number, name: AnalogyName, lang: Lang) {
  const a: { cacheIcon: string; scale?: readonly [string, string] } = ANALOGIES[name]
  const p = PHRASES[lang]
  const isCold = v.state === 'cold'
  const meter = meterFor(isCold ? 0 : v.left)
  return {
    head: `${a.cacheIcon} ${WORDS[lang][name].cache[STATE[v.state]]}`,
    color: CACHE_COLORS[v.state] as string,
    meter: a.scale ? `${a.scale[0]} ${meter} ${a.scale[1]}` : meter,
    size: isCold ? p.rewrites(fmt(context)) : `${fmt(v.cached)} (${v.hitPct}% ${p.hit})`,
    time: isCold ? undefined : p.timeLeft(v.minsLeft, v.ttlMins),
  }
}

/** The cache as one segment on the forecast row (variant compact): `♨ engine warm 42′`. */
export function cacheSegment(v: CacheView, name: AnalogyName, lang: Lang): string {
  const head = `${ANALOGIES[name].cacheIcon} ${WORDS[lang][name].cache[STATE[v.state]]}`
  return v.state === 'cold' ? head : `${head} ${v.minsLeft}′`
}
