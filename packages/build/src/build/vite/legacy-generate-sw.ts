import type { BuildResult, SWType } from '../../types'
import type { RolldownGenerateContext } from '../rolldown/internal-types'
import type { BuildGenerateSWOptions } from '../types'
import { createGenerateContext } from '../rolldown/build-context'

function prepareRolldownBuilds<T extends SWType>(
  context: RolldownGenerateContext<T>,
  options: BuildGenerateSWOptions<T>,
  transformESMTargetToRolldown: typeof import('../builder/utils')['transformESMTargetToRolldown'],
  prepareRolldownBuild: typeof import('../rolldown/build-utils')['prepareRolldownBuild'],
): Promise<any>[] {
  const { logLevel: ll, bundlerLogLevel } = options
  const logLevel = ll === 'silent'
    ? 'silent'
    : bundlerLogLevel!.rolldown!
  return context.builds.map((b) => {
    return prepareRolldownBuild(Object.assign(b, {
      logLevel,
      target: transformESMTargetToRolldown(b.swType, b.target),
      sourcemap: options.sourcemap,
      generateSW: true,
    }))
  })
}

export async function generateSWLegacy<T extends SWType>(
  options: BuildGenerateSWOptions<T>,
): Promise<BuildResult> {
  const buildStart = performance.now()

  const message = await import('./index').then(({
    checkLegacyGenerateSW,
  }) => checkLegacyGenerateSW(true))

  if (message) {
    throw new Error(message)
  }

  const [
    internalGenerateSW,
    transformESMTargetToRolldown,
    prepareRolldownBuild,
  ] = await Promise.all([
    import('../builder/internal-generate-sw').then(({ internalGenerateSW }) => internalGenerateSW),
    import('../builder/utils').then(({ transformESMTargetToRolldown }) => transformESMTargetToRolldown),
    import('../rolldown/build-utils').then(({ prepareRolldownBuild }) => prepareRolldownBuild),
  ])

  return await internalGenerateSW(
    createGenerateContext<T>(
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
