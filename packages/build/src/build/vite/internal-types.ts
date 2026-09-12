import type { SWType } from '../../types'
import type { ViteLogLevel } from '../../utils/constants'
import type { BuildContext, GenerateContext } from '../builder/build-context'
import type { BundlerOptions } from '../builder/bundler-types'
import type { CustomChunkCallback } from '../types'
import type { AllResolveOptions } from './types'

export interface ViteBuildOptions extends BundlerOptions {
  logLevel: ViteLogLevel
  plugins?: import('vite').PluginOption[]
  define?: import('vite').UserConfig['define']
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
  envDir?: import('vite').UserConfig['envDir']
  /**
   * Env variables starting with `envPrefix` will be exposed to your client code via import.meta.env.
   *
   * @default 'VITE_'
   *
   * @see https://vite.dev/config/shared-options#envprefix
   * @see https://vite.dev/guide/env-and-mode#env-files
   */
  envPrefix?: import('vite').UserConfig['envPrefix']
  sourcemap?: import('vite').BuildOptions['sourcemap']
  generateSW: boolean
  customChunks?: CustomChunkCallback<'vite'>
}

export type ViteBuildSWContext<T extends SWType> = BuildContext<T, 'vite', ViteBuildOptions>
export type ViteGenerateSWContext<T extends SWType> = GenerateContext<T, 'vite'>
