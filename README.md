# token-weather — a Claude Code mod

A live dashboard of your context window and prompt cache, shown in the band above the prompt and updated after every turn. Pick the analogy it speaks in; the default is weather, here is the motorbike:

```
▰▰▱▱▱ Reserve  20% left  40k / 200k  ▇▆▅▃▂  ▼ −22.1k last trip  ~2 trips
♨ engine warm  C ▰▰▰▰▰▰▰▱▱▱ H  128.1k (92% hit)  42 of 60 min left
```

**Row 1, the context window**

| Piece | Motorbike | Shows |
| --- | --- | --- |
| `▰▰▱▱▱ Reserve` | fuel gauge | the step the fill is in (five steps, below) |
| `20% left` · `40k / 200k` | | how much of the window is left (or used, by analogy) |
| `▇▆▅▃▂` | trip log | the last 12 turns |
| `▼ −22.1k last trip` | consumption | what the last turn added (`▲` back up after a `/compact`) |
| `~2 trips` | range | how many more turns fit at the pace of the last five (a `/compact` left out); `~?` until two turns grew |

**Row 2, the prompt cache**

| Piece | Motorbike | Shows |
| --- | --- | --- |
| `♨ engine warm` | engine temperature | warm (more than half the lifetime left, green), cooling (yellow), cold (red) |
| `C ▰▰▰▰▰▰▰▱▱▱ H` | temperature gauge | lifetime left |
| `128.1k (92% hit)` | | tokens in the cache after the last request, and the share of the prompt it served |
| `42 of 60 min left` | | until the entry lapses; every request refreshes it, and the row redraws every 15 seconds |

A cold cache reads `♨ cold start  C ▱▱▱▱▱▱▱▱▱▱ H  next turn rewrites 134.4k`: the next prompt writes the whole context to the cache again, which costs more, so a `/compact` first can be worth it. Subagents keep caches of their own and are not counted. The cache row appears after the first response.

Claude Code does not tell a mod how long its cache lives, so the lifetime is a setting (`ttl`, `1h` by default, or `5m`).

The band is drawn on Claude Code's terminal and desktop surfaces.

## Analogies

Every analogy has five steps over the same thresholds (under 25%, 25–49, 50–74, 75–89, 90% and up of the window used), a gauge for the cache, and its own word for a turn. `fuel` and `hearts` count what is left, like a fuel gauge; the others count what is used.

| Analogy | Steps | Cache: warm → cooling → cold | A turn is |
| --- | --- | --- | --- |
| `weather` | ☀ Clear · ☁ Cloudy · ☂ Showers · ☇ Storm · ↯ Compact soon | ° mild → chilly → frost | turn |
| `moon` | ○ New moon · ◔ Waxing · ◑ Half moon · ◕ Gibbous · ● Full moon | ✧ lantern lit → dim → out | night |
| `hearts` | ♥♥♥♥♥ Full health · ♥♥♥♥♡ Scratched · ♥♥♥♡♡ Wounded · ♥♥♡♡♡ Critical · ♥♡♡♡♡ Low HP | ✦ buff active → fading → gone | hit |
| `fuel` | ▰▰▰▰▰ Full tank · ▰▰▰▰▱ Three quarters · ▰▰▰▱▱ Half tank · ▰▰▱▱▱ Reserve · ▰▱▱▱▱ Refuel | ♨ engine warm → cooling → cold start | trip |
| `pot` | · Cold · ~ Warm · ≈ Simmering · ≋ Boiling · ‼ Boiling over | ♨ stove hot → cooling → cold | ladle |
| `tide` | _ Low tide · ~ Calm · ≈ Swell · ≋ Surf · ↟ Storm surge | ☼ water warm → cooling → cold | wave |
| `daytime` | ☼ Morning · ☀ Noon · ◐ Afternoon · ☾ Evening · ✦ Midnight | ♨ coffee hot → cooling → cold | hour |
| `volcano` | ▲ Dormant · ▲ Rumbling · ▲ Smoking · ▲ Glowing · ✸ Eruption | ◉ lava glowing → cooling → rock cold | quake |

`moon` charts past turns as moon phases (`○◔◑◕●`) instead of bars.

## Languages

The band speaks English (`en`), German (`de`), Spanish (`es`), Italian (`it`) and French (`fr`). The fuel dashboard in German:

```
▰▰▱▱▱ Reserve  20% übrig  40k / 200k  ▇▆▅▃▂  ▼ −22.1k letzte Fahrt  ~2 Fahrten
♨ Motor warm  C ▰▰▰▰▰▰▰▱▱▱ H  128.1k (92% Treffer)  noch 42 von 60 min
```

`/token-weather` itself answers in English.

## Settings

Change them at the prompt, in the terminal or the desktop app:

```
/token-weather                 # show every setting, current values marked ›
/token-weather fuel            # analogy (or: /token-weather analogy fuel)
/token-weather de              # language: en, de, es, it, fr (or: /token-weather lang de)
/token-weather cache compact   # cache row: full, compact or off (or: /token-weather compact)
/token-weather ttl 5m          # cache lifetime: 1h or 5m (or: /token-weather 5m)
```

The band reloads with the new value right away, and it is kept for later sessions.

| Setting | Option | Values | Default |
| --- | --- | --- | --- |
| analogy | `analogy` | `weather` `moon` `hearts` `fuel` `pot` `tide` `daytime` `volcano` | `weather` |
| lang | `language` | `en` `de` `es` `it` `fr` | `en` |
| cache | `cache` | `full` (its own row), `compact` (one segment on the forecast row: `♨ engine warm 42′`), `off` | `full` |
| ttl | `cacheTtl` | `1h` `5m` | `1h` |

They are also pickers in `/config` in a terminal session, and they live in `~/.claude/settings.json`. The key is the plugin's id: `token-weather@token-weather` when installed from this marketplace, `token-weather@inline` when loaded from a folder with `--plugin-dir`:

```json
"pluginConfigs": {
  "token-weather@token-weather": {
    "options": { "analogy": "fuel", "language": "de", "cache": "full", "cacheTtl": "1h" }
  }
}
```

## Install

At the prompt of a terminal session:

```
/plugin install token-weather --marketplace pstahel/token-weather-claude-code-mod
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```
claude plugin install token-weather --marketplace pstahel/token-weather-claude-code-mod
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `pstahel/token-weather-claude-code-mod`, then **Add plugin**.

This repository is private: installing needs a git credential for github.com on your machine (an SSH key, or `gh auth login` then `gh auth setup-git`).

## Develop

```
claude plugin validate .
claude plugin test .
```

To try changes live, load the folder as a dev plugin: `claude --plugin-dir .` in a terminal; the session reloads the mod whenever a file changes. Where things live:

| File | What |
| --- | --- |
| `hooks/forecast.ts` | each analogy's look (`ANALOGIES`: icons, colors, counting direction, cache gauge), thresholds, delta and range |
| `hooks/i18n.ts` | every word, per language and analogy (`WORDS`, `PHRASES`) |
| `hooks/cache.ts` | the cache state over its lifetime |
| `hooks/band.ts` | both rows put together from the above |
| `hooks/command.ts` | the `/token-weather` arguments |
| `hooks/register.tsx` | the hooks and the drawing |

A new analogy goes into `ANALOGIES`, into `WORDS` for every language, and into `userConfig.analogy.options` in `.claude-plugin/plugin.json`; a new language into `LANGS`, `PHRASES`, `WORDS` and `userConfig.language.options`.
