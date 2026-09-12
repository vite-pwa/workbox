import type { Strategy, WorkboxBuildConfiguration } from '../../../config/types'
import type { SWType } from '../../../types'

export type VitePWAOptions<
  S extends Strategy,
  T extends SWType = 'classic',
> = Partial<WorkboxBuildConfiguration<S, T>>
