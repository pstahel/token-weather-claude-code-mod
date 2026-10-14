# token-weather — a Claude Code mod

A live weather forecast of your context window, shown in the band above the prompt and updated after every turn:

```
☂ Showers  67%  134.4k / 200k  ▂▃▃▄▅▆  ▲ +98.3k last turn
```

| Context used | Forecast |
| --- | --- |
| under 25% | ☀ Clear (yellow) |
| 25–49% | ☁ Cloudy (cyan) |
| 50–74% | ☂ Showers (blue) |
| 75–89% | ☇ Storm (magenta) |
| 90% and up | ↯ Compact soon (red) |

Then the percentage, tokens used out of the window, a chart of the last 12 turns (`▁▂▃▄▅▆▇█`), and how much the last turn added (`▼` after a `/compact`). Subagent turns are ignored.

The band is drawn on Claude Code's terminal and desktop surfaces.

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
