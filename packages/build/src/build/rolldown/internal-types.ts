import type { SWType } from '../../types'
import type { RolldownLogLevel } from '../../utils/constants'
import type { BuildContext, GenerateContext } from '../builder/build-context'
import type { BundlerOptions } from '../builder/bundler-types'
import type { CustomChunkCallback } from '../types'
import type { AllResolveOptions } from './types'

export interface RolldownBuildOptions extends BundlerOptions {
  logLevel: RolldownLogLevel
  define?: import('rolldown').TransformOptions['define']
  alias?: AllResolveOptions['alias']
  /**
   * The directory from which .env files are loaded.
   *
   * Can be an absolute path, or a path relative to the project root.
   *
   * Set to `false` to disable loading .env files.
   *
   * @default 'root'
   *
   * @see https://vite.dev/config/shared-options#envdir
   * @see https://vite.dev/guide/env-and-mode#env-files
   */
  envDir?: string | false
  /**
   * Env variables starting with `envPrefix` will be exposed to your client code via import.meta.env.
   *
   * @default 'VITE_'
   *
   * @see https://vite.dev/config/shared-options#envprefix
   * @see https://vite.dev/guide/env-and-mode#env-files
   */
  envPrefix?: string | string[]
  plugins?: import('rolldown').Plugin[]
  sourcemap?: import('rolldown').OutputOptions['sourcemap']
  generateSW: boolean
  customChunks?: CustomChunkCallback<'rolldown'>
}

export type RolldownBuildContext<T extends SWType> = BuildContext<T, 'rolldown', RolldownBuildOptions>
export type RolldownGenerateContext<T extends SWType> = GenerateContext<T, 'rolldown'>
