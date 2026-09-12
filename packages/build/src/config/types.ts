import type { BuildServiceWorkerOptions } from '../build/rolldown/types'
import type { BuildGenerateSWOptions } from '../build/types'
import type { InjectManifestOptions, SelfDestroyingOptions, SWType } from '../types'

export type BuildStrategy = 'build-sw' | 'generate-sw'
export type Strategy = BuildStrategy | 'inject-manifest' | 'self-destroy-sw'

export interface WorkboxOptions<S extends Strategy> {
  strategy: S
}

export type BuildStrategyOptions<T extends SWType, S extends BuildStrategy> = S extends 'build-sw'
  ? Partial<BuildServiceWorkerOptions<T>>
  : S extends 'generate-sw'
    ? Partial<BuildGenerateSWOptions<T>>
    : never

export type WorkboxBuildOptions<
  T extends SWType,
  S extends BuildStrategy,
> = BuildStrategyOptions<T, S>

export type BuildSWOptions<T extends SWType> = WorkboxBuildOptions<T, 'build-sw'>
export type GenerateSWOptions<T extends SWType> = WorkboxBuildOptions<T, 'generate-sw'>
export type InjectManifestStrategyOptions = InjectManifestOptions
export type SelfDestroyingStrategyOptions = SelfDestroyingOptions

export interface WorkboxBuildConfiguration<
  S extends Strategy,
  T extends SWType = 'classic',
> extends WorkboxOptions<S> {
  /**
   * Current working directory to load external configuration options.
   *
   * @default process.cwd()
   */
  cwd?: string
  /**
   * `path` to load external configuration options:
   * - can be an absolute path
   * - can be a relative path, which will be resolved relative to `cwd` (or process.cwd() if `cwd` is not specified)
   */
  path?: string
  /**
   * When `path` is specified, should merge inlined options and the configuration?
   *
   * **NOTE**: inlined options will override external configuration options.
   *
   * @default false
   */
  mergeOptions?: boolean
  buildSW: Partial<BuildSWOptions<T>>
  generateSW: Partial<GenerateSWOptions<T>>
  injectManifest: Partial<InjectManifestStrategyOptions>
  selfDestroying?: SelfDestroyingStrategyOptions
}
