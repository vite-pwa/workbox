import type { SWType } from '../../types'
import type { BuildSWOptions } from '../types'

export type AllResolveOptions = NonNullable<import('vite').UserConfig['resolve']>

export interface ServiceWorkerOptions {
  define?: import('vite').UserConfig['define']
  alias?: AllResolveOptions['alias']
  /**
   * @see https://vite.dev/config/shared-options#envdir
   * @see https://vite.dev/guide/env-and-mode#env-files
   */
  envDir?: import('vite').UserConfig['envDir']
  /**
   * @default VITE_
   * @see https://vite.dev/config/shared-options#envdir
   * @see https://vite.dev/guide/env-and-mode#env-files
   */
  envPrefix?: import('vite').UserConfig['envPrefix']
  plugins?: (swType: WorkerType) => import('vite').PluginOption[]
  sourcemap?: import('vite').BuildOptions['sourcemap']
}

export type BuildServiceWorkerOptions<T extends SWType> = Omit<BuildSWOptions<T>, 'define' | 'envDir' | 'envPrefix'> & ServiceWorkerOptions
