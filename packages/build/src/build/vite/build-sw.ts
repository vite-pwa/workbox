import type { SWType } from '../../types'
import type { BuildWithSourcesResult } from '../types'
import type { ViteBuildSWContext } from './internal-types'
import type {
  BuildServiceWorkerOptions,
  ServiceWorkerOptions,
} from './types'
import { createBuildContext } from './build-context'

async function prepareBuildSWPlugins(
  plugins: ServiceWorkerOptions['plugins'],
  swType: WorkerType,
  asyncFlatten: typeof import('../builder/utils')['asyncFlatten'],
): Promise<import('vite').PluginOption[]> {
  const pluginsFactoryResult = plugins ? plugins(swType) : []
  const pluginsArray = Array.isArray(pluginsFactoryResult)
    ? pluginsFactoryResult
    : [pluginsFactoryResult]
  return plugins ? await asyncFlatten(pluginsArray) : []
}

function prepareViteBuilds<T extends SWType>(
  context: ViteBuildSWContext<T>,
  options: BuildServiceWorkerOptions<T>,
  prepareViteBuild: typeof import('./build-utils')['prepareViteBuild'],
  asyncFlatten: typeof import('../builder/utils')['asyncFlatten'],
): Promise<any>[] {
  const { logLevel: ll, bundlerLogLevel } = options
  const logLevel = ll === 'silent'
    ? 'silent'
    : bundlerLogLevel!.vite!
  const withCustomChunks = !!options.customChunks

  return context.builds.map(async (b) => {
    b.detectCircularDeps = withCustomChunks ? true : undefined
    return await prepareBuildSWPlugins(
      options.plugins,
      b.swType,
      asyncFlatten,
    ).then((plugins) => {
      return prepareViteBuild(Object.assign(b, {
        customChunks: options.customChunks,
        logLevel,
        plugins,
        envDir: options.envDir,
        envPrefix: options.envPrefix,
        sourcemap: options.sourcemap,
        generateSW: false,
      }))
    })
  })
}

export async function buildSW<T extends SWType>(
  options: BuildServiceWorkerOptions<T>,
): Promise<BuildWithSourcesResult> {
  const buildStart = performance.now()

  const message = await import('./index').then(({
    checkBuildSW,
  }) => checkBuildSW(true))

  if (message) {
    throw new Error(message)
  }

  const [
    internalBuildSW,
    asyncFlatten,
    prepareViteBuild,
  ] = await Promise.all([
    import('../builder/internal-build-sw').then(({ internalBuildSW }) => internalBuildSW),
    import('./build-utils').then(({ prepareViteBuild }) => prepareViteBuild),
    import('../builder/utils').then(({ asyncFlatten }) => asyncFlatten),
  ])

  return await internalBuildSW(
    createBuildContext<T>(
      buildStart,
      options,
    ),
    context => prepareViteBuilds(
      context,
      options,
      asyncFlatten,
      prepareViteBuild,
    ),
  )
}
