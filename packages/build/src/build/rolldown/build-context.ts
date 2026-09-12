import type { SWType } from '../../types'
import type { BuildGenerateSWOptions } from '../types'
import type { RolldownBuildContext, RolldownGenerateContext } from './internal-types'
import type { BuildServiceWorkerOptions } from './types'
import { createBuildSWContext, createGenerateSWContext } from '../builder/build-context'

export function createBuildContext<T extends SWType>(
  buildStart: ReturnType<typeof performance.now>,
  options: BuildServiceWorkerOptions<T>,
): RolldownBuildContext<T> {
  return createBuildSWContext(buildStart, 'rolldown', options)
}

export function createGenerateContext<T extends SWType>(
  buildStart: ReturnType<typeof performance.now>,
  options: BuildGenerateSWOptions<T>,
): RolldownGenerateContext<T> {
  return createGenerateSWContext(buildStart, 'rolldown', options)
}
