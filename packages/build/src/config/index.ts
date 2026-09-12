import type { SWType } from '../types'
import type { Strategy, WorkboxBuildConfiguration } from './types'

export * from './load-configuration'

export function defineOptions<
  S extends Strategy,
  T extends SWType = 'classic',
>(
  strategy: S,
  options: Partial<WorkboxBuildConfiguration<S, T>> = {},
): Partial<WorkboxBuildConfiguration<S, T>> {
  return Object.assign(options, { strategy })
}
