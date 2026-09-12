import type { SWType } from '../../types'
import type { RolldownBuildContext } from '../rolldown/internal-types'
import type { BuildWithSourcesResult } from '../types'
import type { LegacyBuildServiceWorkerOptions } from './legacy-types'
import { createBuildContext } from '../rolldown/build-context'

function prepareRolldownBuilds<T extends SWType>(
  context: RolldownBuildContext<T>,
  options: LegacyBuildServiceWorkerOptions<T>,
  transformESMTargetToRolldown: typeof import('../builder/utils')['transformESMTargetToRolldown'],
  prepareRolldownBuild: typeof import('../rolldown/build-utils')['prepareRolldownBuild'],
): Promise<any>[] {
  const { logLevel: ll, bundlerLogLevel } = options
  const logLevel = ll === 'silent'
    ? 'silent'
    : bundlerLogLevel!.rolldown!
  const withCustomChunks = !!options.customChunks

  return context.builds.map((b) => {
    const plugins = options.plugins?.(b.swType) || []
    b.detectCircularDeps = withCustomChunks ? true : undefined
    return prepareRolldownBuild(Object.assign(b, {
      customChunks: options.customChunks,
      logLevel,
      target: transformESMTargetToRolldown(b.swType, b.target),
      plugins: plugins.filter(Boolean),
      sourcemap: options.sourcemap,
      generateSW: false,
    }))
  })
}

export async function buildSWLegacy<T extends SWType>(
  options: LegacyBuildServiceWorkerOptions<T>,
): Promise<BuildWithSourcesResult> {
  const buildStart = performance.now()

  const message = await import('./index').then(({
    checkLegacyBuildSW,
  }) => checkLegacyBuildSW(true))

  if (message) {
    throw new Error(message)
  }

  const [
    internalBuildSW,
    transformESMTargetToRolldown,
    prepareRolldownBuild,
  ] = await Promise.all([
    import('../builder/internal-build-sw').then(({ internalBuildSW }) => internalBuildSW),
    import('../builder/utils').then(({ transformESMTargetToRolldown }) => transformESMTargetToRolldown),
    import('../rolldown/build-utils').then(({ prepareRolldownBuild }) => prepareRolldownBuild),
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
