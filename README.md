# token-weather — a Claude Code mod

A live forecast of your context window, shown in the band above the prompt and updated after every turn:

```
☂ Showers  67%  134.4k / 200k  ▂▃▃▄▅▆  ▲ +98.3k last turn
```

The band shows the current step of the analogy, the percentage, tokens used out of the window, a chart of the last 12 turns (`▁▂▃▄▅▆▇█`), and how much the last turn added (`▼` after a `/compact`). Subagent turns are ignored.

The band is drawn on Claude Code's terminal and desktop surfaces.

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
/token-weather          # list the analogies, the current one marked ›
/token-weather moon     # switch to moon
```

The band redraws with the new analogy right away, and the choice is kept for later sessions.

In a terminal session the setting is also a picker in `/config` (**Analogy**, under token-weather). Both write `pluginConfigs` → `token-weather` → `options.analogy` in `~/.claude/settings.json`.

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

To try changes live, load the folder as a dev plugin: `claude --plugin-dir .` in a terminal; the session reloads the mod whenever a file changes. Analogies live in `hooks/forecast.ts` (`ANALOGIES`); a new one also goes into `userConfig.analogy.options` in `.claude-plugin/plugin.json`.
