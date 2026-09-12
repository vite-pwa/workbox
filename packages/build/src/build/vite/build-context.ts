import type { SWType } from '../../types'
import type { BuildGenerateSWOptions } from '../types'
import type { ViteBuildSWContext, ViteGenerateSWContext } from './internal-types'
import type { BuildServiceWorkerOptions } from './types'
import { createBuildSWContext, createGenerateSWContext } from '../builder/build-context'

export function createBuildContext<T extends SWType>(
  buildStart: ReturnType<typeof performance.now>,
  options: BuildServiceWorkerOptions<T>,
): ViteBuildSWContext<T> {
  return createBuildSWContext(buildStart, 'vite', options)
}

export function createGenerateContext<T extends SWType>(
  buildStart: ReturnType<typeof performance.now>,
  options: BuildGenerateSWOptions<T>,
): ViteGenerateSWContext<T> {
  return createGenerateSWContext(buildStart, 'vite', options)
}
