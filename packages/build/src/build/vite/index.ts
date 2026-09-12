import type { SWType } from '../../types'
import type { DetectorOptions, DetectorResult } from '../builder/detector-types'
import type { LegacyBuildServiceWorkerOptions } from './legacy-types'
import type { BuildServiceWorkerOptions } from './types'
import { detect, detectViteEnvironmentApi } from '../builder/detector'
import { checkViteDependencies, checkViteLegacyDependencies } from '../builder/log'

export type {
  BuildServiceWorkerOptions,
  DetectorOptions,
  DetectorResult,
  LegacyBuildServiceWorkerOptions,
  SWType,
}

export { detect, detectViteEnvironmentApi }

export async function checkBuildSW(
  forError = false,
): Promise<string | undefined> {
  const detectOptions: DetectorOptions = {
    vite: true,
  }

  const detectResult = await import('../builder/detector').then(({
    detect,
  }) => detect(detectOptions))

  return checkViteDependencies(
    'build',
    forError,
    detectOptions,
    detectResult,
  )
}

export async function checkLegacyBuildSW(
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
    vite: true,
    magicast: true,
  }

  const detectResult = await import('../builder/detector').then(({
    detect,
  }) => detect(detectOptions))

  return checkViteDependencies(
    'generate',
    forError,
    detectOptions,
    detectResult,
  )
}

export async function checkLegacyGenerateSW(
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
