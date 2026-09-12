import type { SWType } from '../../types'
import type { BuildSWOptions } from '../types'

export type AllResolveOptions = NonNullable<import('rolldown').InputOptions['resolve']>

export interface ServiceWorkerOptions {
  define?: import('rolldown').TransformOptions['define']
  alias?: AllResolveOptions['alias']
  plugins?: (swType: WorkerType) => import('rolldown').Plugin[]
  sourcemap?: import('rolldown').OutputOptions['sourcemap']
}

export type BuildServiceWorkerOptions<T extends SWType> = Omit<BuildSWOptions<T, 'rolldown'>, 'define'> & ServiceWorkerOptions
