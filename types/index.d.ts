export type Reading = { tokens: number; window: number }

/** The prompt cache as the last main-thread API response reported it, and when (ms since the epoch). */
export type CacheReading = { read: number; written: number; uncached: number; at: number }

declare module 'claude-code' {
  interface PluginState {
    'token-weather': { readings: Reading[]; cache: CacheReading | null; tick: number }
  }
}
