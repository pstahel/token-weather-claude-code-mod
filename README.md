# token-weather — a Claude Code mod

A live forecast of your context window and prompt cache, shown in the band above the prompt and updated after every turn:

```
☂ Showers  67%  134.4k / 200k  ▂▃▃▄▅▆  ▲ +98.3k last turn
⧗ Cache  128.1k (92% hit)  ███████░░░  42 of 60 min left
```

The band shows the current step of the analogy, the percentage, tokens used out of the window, a chart of the last 12 turns (`▁▂▃▄▅▆▇█`), and how much the last turn added (`▼` after a `/compact`). Subagent turns are ignored.

The band is drawn on Claude Code's terminal and desktop surfaces.

## Prompt cache

The second row shows the prompt cache as the last main-thread API request left it:

- **size**: tokens the cache holds (read plus written by that request), and the share of the prompt it served (`% hit`)
- **countdown**: minutes until the entry lapses; every request refreshes it for a full lifetime, and the row redraws every 15 seconds between turns

| State | Shown as | Color |
| --- | --- | --- |
| more than half the lifetime left | `⧗ Cache  128.1k (92% hit)  ███████░░░  42 of 60 min left` | green |
| half or less left | `⧗ Cache  128.1k (92% hit)  ██░░░░░░░░  11 of 60 min left` | yellow |
| lapsed | `❄ Cache cold  next turn rewrites 134.4k  ░░░░░░░░░░  0 of 60 min left` | red |

A cold cache means the next prompt writes the whole context to the cache again, which costs more; a `/compact` first can be worth it. Subagents keep caches of their own and are not counted. The row appears after the first response.

Claude Code does not tell a mod how long its cache lives, so the lifetime is a setting (`cacheTtl`, `1h` by default, or `5m`; `/token-weather ttl 5m` switches it).

## Analogies

Weather is the default. Seven more analogies picture the same five steps:

| Context used | `weather` | `moon` | `hearts` | `fuel` |
| --- | --- | --- | --- | --- |
| under 25% | ☀ Clear | ○ New moon | ♥♥♥♥♥ Full health | ▰▰▰▰▰ Full tank |
| 25–49% | ☁ Cloudy | ◔ Waxing | ♥♥♥♥♡ Scratched | ▰▰▰▰▱ Three quarters |
| 50–74% | ☂ Showers | ◑ Half moon | ♥♥♥♡♡ Wounded | ▰▰▰▱▱ Half tank |
| 75–89% | ☇ Storm | ◕ Gibbous | ♥♥♡♡♡ Critical | ▰▰▱▱▱ Reserve |
| 90% and up | ↯ Compact soon | ● Full moon, compact soon | ♥♡♡♡♡ Low HP, /compact to heal | ▰▱▱▱▱ Refuel, /compact |

| Context used | `pot` | `tide` | `daytime` | `volcano` |
| --- | --- | --- | --- | --- |
| under 25% | · Cold | _ Low tide | ☼ Morning | ▲ Dormant |
| 25–49% | ~ Warm | ~ Calm | ☀ Noon | ▲ Rumbling |
| 50–74% | ≈ Simmering | ≈ Swell | ◐ Afternoon | ▲ Smoking |
| 75–89% | ≋ Boiling | ≋ Surf | ☾ Evening | ▲ Glowing |
| 90% and up | ‼ Boiling over | ↟ Storm surge | ✦ Midnight, time to compact | ✸ Eruption, compact now |

`moon` charts past turns as moon phases (`○◔◑◕●`) instead of bars.

### Switching

At the prompt, in the terminal or the desktop app:

```
/token-weather          # list every setting and the analogies, current values marked ›
/token-weather moon     # switch to moon
```

The band redraws with the new analogy right away, and the choice is kept for later sessions.

In a terminal session the setting is also a picker in `/config` (**Analogy**, under token-weather). Both write `options.analogy` under `pluginConfigs` in `~/.claude/settings.json` (see Options).

## Options

| Option | Values | Default | What it does |
| --- | --- | --- | --- |
| `analogy` | `weather` `moon` `hearts` `fuel` `pot` `tide` `daytime` `volcano` | `weather` | How the band pictures the context fill (`/token-weather <name>` switches it) |
| `cache` | `full` `compact` `off` | `full` | The cache as its own row, as a short segment on the forecast row (`⧗ 128.1k cached · 42 min`), or not at all |
| `cacheTtl` | `1h` `5m` | `1h` | How long the cache lives after each request |

Change any of them at the prompt, in the terminal or the desktop app:

```
/token-weather                 # show every setting, current values marked ›
/token-weather moon            # analogy (or: /token-weather analogy moon)
/token-weather cache compact   # cache row: full, compact or off (or just: /token-weather compact)
/token-weather ttl 5m          # cache lifetime: 1h or 5m (or just: /token-weather 5m)
```

The band reloads with the new value right away, and it is kept for later sessions.

Or set them in `/config` in a terminal session, or in `~/.claude/settings.json`. The key is the plugin's id: `token-weather@token-weather` when installed from this marketplace, `token-weather@inline` when loaded from a folder with `--plugin-dir`:

```json
"pluginConfigs": {
  "token-weather@token-weather": { "options": { "analogy": "fuel", "cache": "full", "cacheTtl": "1h" } }
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

To try changes live, load the folder as a dev plugin: `claude --plugin-dir .` in a terminal; the session reloads the mod whenever a file changes. The cache row lives in `hooks/cache.ts`, the `/token-weather` arguments in `hooks/command.ts`. Analogies live in `hooks/forecast.ts` (`ANALOGIES`); a new one also goes into `userConfig.analogy.options` in `.claude-plugin/plugin.json`.
