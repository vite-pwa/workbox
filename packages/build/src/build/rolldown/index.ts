import type { SWType } from '../../types'
import type { DetectorOptions, DetectorResult } from '../builder/detector-types'
import type { BuildServiceWorkerOptions } from './types'
import { detect } from '../builder/detector'
import { checkViteLegacyDependencies } from '../builder/log'

export type {
  BuildServiceWorkerOptions,
  DetectorOptions,
  DetectorResult,
  SWType,
}

export { detect }

export async function checkBuildSW(
  forError = false,
): Promise<string | undefined> {
  const detectOptions: DetectorOptions = {
    rolldown: true,
  }

  const detectResult = await import('../builder/detector').then(({
    detect,
  }) => detect(detectOptions))

  return checkViteLegacyDependencies(
    'build',
    forError,
    detectOptions,
    detectResult,
  )
}

export async function checkGenerateSW(
  forError: boolean,
): Promise<string | undefined> {
  const detectOptions: DetectorOptions = {
    rolldown: true,
    magicast: true,
  }

  const detectResult = await import('../builder/detector').then(({
    detect,
  }) => detect(detectOptions))

  return checkViteLegacyDependencies(
    'generate',
    forError,
    detectOptions,
    detectResult,
  )
}
