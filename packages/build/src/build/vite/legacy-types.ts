import type { SWType } from '../../types'
import type { BuildSWOptions } from '../types'

export interface ServiceWorkerOptions {
  define?: import('rolldown').TransformOptions['define']
  envDir?: string | false
  envPrefix?: string | string[]
  plugins?: (swType: WorkerType) => import('rolldown').Plugin[]
  sourcemap?: import('rolldown').OutputOptions['sourcemap']
}

export type LegacyBuildServiceWorkerOptions<T extends SWType> = BuildSWOptions<T, 'rolldown'> & ServiceWorkerOptions
