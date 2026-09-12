import type { Strategy } from '@vite-pwa/workbox-build/config/types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { CliStrategy, WorkboxCliConfig } from './options'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { loadConfiguration } from '@vite-pwa/workbox-build/config'
import { logger } from './logger'

export const DEFAULT_CONFIG_FILES = [
  'workbox.config.js',
  'workbox.config.mjs',
  'workbox.config.cjs',
  'workbox.config.ts',
  'workbox.config.mts',
  'workbox.config.cts',
] as const

export function resolveDefaultConfig(cwd: string = process.cwd()): string | undefined {
  for (const name of DEFAULT_CONFIG_FILES) {
    const candidate = path.resolve(cwd, name)
    if (existsSync(candidate))
      return candidate
  }
  return undefined
}

export async function loadCliConfiguration(
  configPath?: string,
  cliSelfDestroying?: boolean,
): Promise<WorkboxCliConfig<CliStrategy, SWType>> {
  const resolvedPath = configPath ?? resolveDefaultConfig()
  if (!configPath && resolvedPath)
    logger.info(`Using config ${path.relative(process.cwd(), resolvedPath)}`)
  // loadConfiguration() resolves via dynamic import(), which Node caches per
  // path — repeated calls with the same path return the *same* object. Clone
  // before mutating selfDestroying below, or the mutation leaks across calls.
  const loaded = await loadConfiguration<Strategy>({ path: resolvedPath })
  const config: WorkboxCliConfig<CliStrategy, SWType> = { ...loaded }

  const enabled = cliSelfDestroying || (config.selfDestroying?.selfDestroying ?? false)
  if (enabled || config.selfDestroying) {
    config.selfDestroying = { ...config.selfDestroying, selfDestroying: enabled }
  }

  return config
}
