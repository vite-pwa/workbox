import type { Strategy, WorkboxBuildConfiguration } from '@vite-pwa/workbox-build/config/types'
import type { GetManifestOptions, SelfDestroyingOptions, SWType } from '@vite-pwa/workbox-build/types'

/**
 * A build strategy the CLI can run for a config entry: any of the workbox-build
 * `Strategy` values, plus `'get-manifest'`.
 */
export type CliStrategy = Strategy | 'get-manifest'

export type StrategyName = CliStrategy | 'self-destroy-sw'

/**
 * Shape of a `workbox.config.*` file consumed by the workbox CLI: the
 * workbox-build configuration for the chosen strategy, plus the CLI-only
 * `getManifest` and `selfDestroying` entries.
 */
export type WorkboxCliConfig<S extends CliStrategy, T extends SWType>
  = Omit<Partial<WorkboxBuildConfiguration<S extends Strategy ? S : Strategy, T>>, 'strategy' | 'selfDestroying'>
    & {
      strategy?: S
      getManifest?: Partial<GetManifestOptions>
      selfDestroying?: Partial<SelfDestroyingOptions> & { selfDestroying?: boolean }
    }

interface StrategyMeta {
  optionKey: keyof WorkboxCliConfig<CliStrategy, SWType>
  isSwBuilder: boolean
}

export const STRATEGY_META: Record<StrategyName, StrategyMeta> = {
  'generate-sw': { optionKey: 'generateSW', isSwBuilder: true },
  'inject-manifest': { optionKey: 'injectManifest', isSwBuilder: true },
  'build-sw': { optionKey: 'buildSW', isSwBuilder: true },
  'get-manifest': { optionKey: 'getManifest', isSwBuilder: false },
  'self-destroy-sw': { optionKey: 'selfDestroying', isSwBuilder: false },
}

export const STRATEGY_NAMES = Object.keys(STRATEGY_META) as StrategyName[]

/**
 * Identity helper for authoring a typed workbox CLI config. Binds the config to
 * a {@link CliStrategy} so `options` is type-checked and gets IntelliSense.
 *
 * @example
 * ```ts
 * // workbox.config.ts
 * import { defineCliOptions } from '@vite-pwa/workbox-cli'
 *
 * export default defineCliOptions('generate-sw', {
 *   generateSW: { swDest: 'dist/sw.js', globDirectory: 'dist' },
 * })
 * ```
 */
export function defineCliOptions<S extends CliStrategy, T extends SWType>(
  strategy: S,
  options: Omit<WorkboxCliConfig<S, T>, 'strategy'> = {},
): WorkboxCliConfig<S, T> {
  return Object.assign(options, { strategy })
}
