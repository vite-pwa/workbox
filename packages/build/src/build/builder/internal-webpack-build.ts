import type { BuildServiceWorkerOptions, SWType } from '../../build/rolldown/index'
import type { BuildGenerateSWOptions } from '../../build/types'
import type { SelfDestroyingStrategyOptions, Strategy, WorkboxBuildConfiguration } from '../../config/types'
import type { InjectManifestOptions } from '../../types'
import path from 'node:path'
import process from 'node:process'
import { loadConfiguration } from '../../config/load-configuration'
import {
  resolveFrom,
  resolveOutputPath,
  resolveSWSrc,
} from '../../utils/resolve-paths'

interface WebpackBuildContext<S extends Strategy> {
  strategy: S
  cwd?: string
  outputPath?: string
  bundler: 'webpack' | 'rspack'
}

type StrategyOptions<T extends SWType>
  = | BuildServiceWorkerOptions<T>
    | BuildGenerateSWOptions<T>
    | InjectManifestOptions

function prepareStrategyOptions<T extends SWType>(
  strategyOptions: StrategyOptions<T>,
  {
    cwd,
    outputPath,
    bundler,
  }: Required<WebpackBuildContext<Strategy>>,
) {
  const data = Object.assign({}, strategyOptions) as StrategyOptions<T>
  data.globDirectory = data.globDirectory
    ? resolveFrom(cwd, data.globDirectory)
    : outputPath

  if (!('dontCacheBustURLsMatching' in strategyOptions)) {
    if (bundler === 'rspack') {
      data.dontCacheBustURLsMatching = /assets[\\/]/
    }
    else {
      data.dontCacheBustURLsMatching = /\.[0-9a-z]{8,}\./i
    }
  }

  if ('swSrc' in data) {
    data.swSrc = resolveSWSrc(cwd, data.swSrc)
  }

  if ('swDest' in data) {
    data.swDest = resolveFrom(outputPath, data.swDest)
  }

  return data
}

export async function internalWebpackBuild<
  S extends Strategy,
  T extends SWType = 'classic',
>(
  pluginName: string,
  buildContext: WebpackBuildContext<S>,
  options: Partial<WorkboxBuildConfiguration<S, T>> = {},
) {
  const resolvedOptions = await loadConfiguration(
    options as Partial<WorkboxBuildConfiguration<Strategy, T>>,
  )
  const { strategy, buildSW, generateSW, injectManifest, selfDestroying } = resolvedOptions
  const cwd = process.cwd()
  // everything is relative: workbox-build will use process.cwd() for swSrc/swDest
  const outputPath = path.relative(cwd, resolveOutputPath(buildContext.outputPath, cwd))
  const context = {
    cwd,
    outputPath,
    strategy: strategy ?? buildContext.strategy,
    bundler: buildContext.bundler,
  } satisfies WebpackBuildContext<Strategy>

  // We extract the host compiler output directory to use as the default globDirectory.

  switch (context.strategy) {
    case 'self-destroy-sw': {
      const { selfDestroyingSW: runSelfDestroyingSW } = await import('../../self-destroying-sw')

      await runSelfDestroyingSW(
        selfDestroying as SelfDestroyingStrategyOptions,
      )
      break
    }

    case 'build-sw': {
      const { buildSW: runBuildSW } = await import('../rolldown/build-sw')

      await runBuildSW(
        prepareStrategyOptions(
          (buildSW ?? {}) as BuildServiceWorkerOptions<T>,
          context,
        ) as BuildServiceWorkerOptions<T>,
      )
      break
    }

    case 'generate-sw': {
      const { generateSW: runGenerateSW } = await import('../rolldown/generate-sw')

      await runGenerateSW(
        prepareStrategyOptions(
          (generateSW ?? {}) as BuildGenerateSWOptions<T>,
          context,
        ) as BuildGenerateSWOptions<T>,
      )
      break
    }

    case 'inject-manifest': {
      const { injectManifest: runInjectManifest } = await import('../../inject-manifest')

      await runInjectManifest(
        prepareStrategyOptions(
          (injectManifest ?? {}) as InjectManifestOptions,
          context,
        ) as InjectManifestOptions,
      )
      break
    }

    default: {
      throw new Error(`[${pluginName}] Unsupported Workbox strategy: "${strategy}"`)
    }
  }
}
