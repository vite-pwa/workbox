import type { SWType } from '../../types'
import type { BuildWithSourcesResult } from '../types'
import type { RolldownBuildContext } from './internal-types'
import type { BuildServiceWorkerOptions } from './types'
import { createBuildContext } from './build-context'

function prepareRolldownBuilds<T extends SWType>(
  context: RolldownBuildContext<T>,
  options: BuildServiceWorkerOptions<T>,
  transformESMTargetToRolldown: typeof import('../builder/utils')['transformESMTargetToRolldown'],
  prepareRolldownBuild: typeof import('./build-utils')['prepareRolldownBuild'],
): Promise<any>[] {
  const { logLevel: ll, bundlerLogLevel } = options
  const logLevel = ll === 'silent'
    ? 'silent'
    : bundlerLogLevel!.rolldown!
  const withCustomChunks = !!options.customChunks

  return context.builds.map(async (b) => {
    b.detectCircularDeps = withCustomChunks ? true : undefined
    const plugins = options.plugins?.(b.swType) || []
    return await prepareRolldownBuild(Object.assign(b, {
      customChunks: options.customChunks,
      logLevel,
      target: transformESMTargetToRolldown(b.swType, b.target),
      plugins: plugins.filter(Boolean),
      sourcemap: options.sourcemap,
      generateSW: false,
    }))
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
    transformESMTargetToRolldown,
    prepareRolldownBuild,
  ] = await Promise.all([
    import('../builder/internal-build-sw').then(({
      internalBuildSW,
    }) => internalBuildSW),
    import('../builder/utils').then(({
      transformESMTargetToRolldown,
    }) => transformESMTargetToRolldown),
    import('./build-utils').then(({
      prepareRolldownBuild,
    }) => prepareRolldownBuild),
  ])

  return await internalBuildSW(
    createBuildContext<T>(
      buildStart,
      options,
    ),
    context => prepareRolldownBuilds(
      context,
      options,
      transformESMTargetToRolldown,
      prepareRolldownBuild,
    ),
  )
}
