export const DEFAULT_MAXIMUM_FILE_SIZE_TO_CACHE_IN_BYTES = 2097152

export const logLevel = ['info', 'silent'] as const
export type LogLevel = typeof logLevel[number]
export const rolldownLogLevel = ['info', 'debug', 'warn', 'silent'] as const
export type RolldownLogLevel = typeof rolldownLogLevel[number]
export const viteLogLevel = ['info', 'warn', 'error', 'silent'] as const
export type ViteLogLevel = typeof viteLogLevel[number]
