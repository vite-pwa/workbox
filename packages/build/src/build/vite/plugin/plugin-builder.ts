import type { SelfDestroyingStrategyOptions, Strategy } from '../../../config/types'
import type { InjectManifestOptions, SWType } from '../../../types'
import type { BuildGenerateSWOptions } from '../../types'
import type { LegacyBuildServiceWorkerOptions } from '../legacy-types'
import type { BuildServiceWorkerOptions } from '../types'
import type { VitePWAContext } from './plugin-context'
import type { VitePWAOptions } from './types'
import path from 'node:path'
import process from 'node:process'
import { normalizePath } from '../../../utils/resolve-sw-names'

type StrategyOptions<T extends SWType>
  = | BuildServiceWorkerOptions<T>
    | LegacyBuildServiceWorkerOptions<T>
    | BuildGenerateSWOptions<T>
    | InjectManifestOptions

type StrategyOptionsReturn<S extends Strategy, T extends SWType>
  = S extends 'build-sw'
    ? BuildServiceWorkerOptions<T>
    : S extends 'generate-sw'
      ? BuildGenerateSWOptions<T> | LegacyBuildServiceWorkerOptions<T>
      : InjectManifestOptions

async function prepareStrategyOptions<
  S extends Strategy,
  T extends SWType,
>(
  pluginContext: VitePWAContext<S, T>,
  strategyOptions: StrategyOptions<T>,
): Promise<StrategyOptionsReturn<S, T>> {
  const { build, define: _ } = pluginContext.resolvedViteConfig

  const { outDir = 'dist', assetsDir = 'assets' } = build

  const {
    resolveSWSrc,
    resolveFrom,
  } = await import('../../../utils/resolve-paths')

  const cwd = process.cwd()
  const outputPath = path.resolve(cwd, outDir)

  const data = Object.assign({}, strategyOptions) as StrategyOptionsReturn<S, T>
  data.globDirectory = data.globDirectory
    ? normalizePath(path.relative(cwd, resolveFrom(cwd, data.globDirectory)))
    : normalizePath(path.relative(cwd, resolveFrom(cwd, outputPath)))

  if (!('dontCacheBustURLsMatching' in strategyOptions)) {
    let assetsOutputDir = path.relative(outputPath, resolveFrom(outputPath, assetsDir))
    if (assetsOutputDir.at(-1) !== '/')
      assetsOutputDir += '/'

    // remove './' prefix from assetsDir
    data.dontCacheBustURLsMatching = new RegExp(`^${assetsOutputDir.replace(/^\.*\//, '')}`)
  }

  if ('swSrc' in data) {
    data.swSrc = resolveSWSrc(cwd, data.swSrc)
  }

  if ('swDest' in data) {
    const resolvedSwDest = path.dirname(path.resolve(cwd, data.swDest))
    if (resolvedSwDest !== outputPath) {
      data.swDest = resolveFrom(outputPath, data.swDest)
    }
  }

  if (pluginContext.options.strategy !== 'inject-manifest') {
    // TODO: check if we need to include here vite define options
  }

  return data
}

export async function handleBuild<
  S extends Strategy,
  T extends SWType,
>(
  pluginContext: VitePWAContext<S, T>,
  resolvedPluginOptions: VitePWAOptions<S, T>,
  vite: boolean,
) {
  switch (resolvedPluginOptions.strategy) {
    case 'self-destroy-sw':{
      const { selfDestroyingSW: runSelfDestroyingSW } = await import('../../../self-destroying-sw')

      await runSelfDestroyingSW(
        resolvedPluginOptions.selfDestroying as SelfDestroyingStrategyOptions,
      )
      break
    }
    case 'build-sw': {
      if (vite) {
        const [
          buildSW,
          buildSWOptions,
        ] = await Promise.all([
          import('../build-sw').then(({ buildSW }) => buildSW),
          prepareStrategyOptions(
            pluginContext,
            (resolvedPluginOptions.buildSW ?? {}) as StrategyOptions<T>,
          ),
        ])
        await buildSW(
          buildSWOptions as import('../types').BuildServiceWorkerOptions<T>,
        )
      }
      else {
        const [
          buildSWLegacy,
          buildSWLegacyOptions,
        ] = await Promise.all([
          import('../legacy-build-sw').then(({ buildSWLegacy }) => buildSWLegacy),
          prepareStrategyOptions(
            pluginContext,
            (resolvedPluginOptions.buildSW ?? {}) as StrategyOptions<T>,
          ),
        ])
        await buildSWLegacy(
          buildSWLegacyOptions as import('../legacy-types').LegacyBuildServiceWorkerOptions<T>,
        )
      }
      break
    }
    case 'generate-sw': {
      if (vite) {
        const [
          generateSW,
          generateSWOptions,
        ] = await Promise.all([
          import('../generate-sw').then(({ generateSW }) => generateSW),
          prepareStrategyOptions(
            pluginContext,
            (resolvedPluginOptions.generateSW ?? {}) as StrategyOptions<T>,
          ),
        ])
        await generateSW(
          generateSWOptions,
        )
      }
      else {
        const [
          generateSWLegacy,
          generateSWLegacyOptions,
        ] = await Promise.all([
          import('../legacy-generate-sw').then(({ generateSWLegacy }) => generateSWLegacy),
          prepareStrategyOptions(
            pluginContext,
            (resolvedPluginOptions.generateSW ?? {}) as StrategyOptions<T>,
          ),
        ])
        await generateSWLegacy(
          generateSWLegacyOptions,
        )
      }
      break
    }
    case 'inject-manifest': {
      const [
        injectManifest,
        injectManifestOptions,
      ] = await Promise.all([
        import('../../../inject-manifest').then(({ injectManifest }) => injectManifest),
        prepareStrategyOptions(
          pluginContext,
          (resolvedPluginOptions.injectManifest ?? {}) as StrategyOptions<T>,
        ),
      ])
      await injectManifest(
        injectManifestOptions as InjectManifestOptions,
      )
    }
  }
}
