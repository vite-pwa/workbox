import type { InferOutput } from 'valibot'
import type { BuildGenerateSWOptions } from '../build/types'
import type { SWType } from '../types'
import { AsyncBuildSWOptionsSchema } from './async-build-sw'
import { validateAsync } from './validation-helper'

export async function validateBuildSW<
  T extends SWType,
  BundlerOptions extends BuildGenerateSWOptions<T>,
>(
  options: BundlerOptions,
): Promise<InferOutput<typeof AsyncBuildSWOptionsSchema>> {
  return await validateAsync(AsyncBuildSWOptionsSchema, options, 'buildSW')
}
