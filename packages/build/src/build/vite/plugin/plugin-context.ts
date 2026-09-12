import type { ResolvedConfig } from 'vite'
import type { Strategy } from '../../../config/types'
import type { SWType } from '../../../types'
import type { DetectorResult } from '../../builder/detector-types'
import type { VitePWAOptions } from './types'

export interface VitePWAContext<
  S extends Strategy,
  T extends SWType,
> {
  options: VitePWAOptions<S, T>
  resolvedOptions: Promise<VitePWAOptions<S, T>>
  detectionResult: Promise<DetectorResult>
  resolvedViteConfig: import('vite').ResolvedConfig
}

export function preparePluginContext<
  S extends Strategy,
  T extends SWType,
>(
  options: VitePWAOptions<S, T>,
): VitePWAContext<S, T> {
  return {
    options,
    resolvedOptions: import('../../../config/load-configuration').then(({
      loadConfiguration,
    }) => loadConfiguration(options)),
    detectionResult: import('../../builder/detector').then(({
      detect,
    }) => detect({
      vite: true,
      rolldown: true,
      magicast: true,
    })),
    resolvedViteConfig: undefined!,
  }
}

export async function checkStrategy<
  S extends Strategy,
  T extends SWType,
>(
  pluginContext: VitePWAContext<S, T>,
  resolvedConfig: ResolvedConfig,
) {
  pluginContext.resolvedViteConfig = resolvedConfig
  const [options] = await Promise.all([
    pluginContext.resolvedOptions,
    pluginContext.detectionResult,
  ])

  if (!options.strategy) {
    const message = await import('../../builder/log').then(({
      missingStrategy,
    }) => missingStrategy(
      true,
      'Missing strategy at VitePWAOptions',
    ))
    if (message) {
      throw new Error(message)
    }
  }

  const { vite } = await pluginContext.detectionResult

  let message: string | undefined
  switch (options.strategy) {
    case 'build-sw': {
      if (vite) {
        message = await import('../index').then(({
          checkBuildSW,
        }) => checkBuildSW(
          true,
        ))
      }
      else {
        message = await import('../index').then(({
          checkLegacyBuildSW,
        }) => checkLegacyBuildSW(
          true,
        ))
      }
      break
    }
    case 'generate-sw': {
      if (vite) {
        message = await import('../index').then(({
          checkGenerateSW,
        }) => checkGenerateSW(
          true,
        ))
      }
      else {
        message = await import('../index').then(({
          checkLegacyGenerateSW,
        }) => checkLegacyGenerateSW(
          true,
        ))
      }
      break
    }
  }

  return message
}
