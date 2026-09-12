import type { BuildResult, SWType } from '../../types'
import type { BuildGenerateSWOptions } from '../types'
import type { ViteGenerateSWContext } from './internal-types'
import {
  createGenerateContext,
} from './build-context'

function prepareViteBuilds<T extends SWType>(
  context: ViteGenerateSWContext<T>,
  options: BuildGenerateSWOptions<T>,
  prepareViteBuild: typeof import('./build-utils')['prepareViteBuild'],
): Promise<any>[] {
  const { logLevel: ll, bundlerLogLevel } = options
  const logLevel = ll === 'silent'
    ? 'silent'
    : bundlerLogLevel!.vite!
  return context.builds.map((b) => {
    return prepareViteBuild(Object.assign(b, {
      logLevel,
      sourcemap: options.sourcemap,
      generateSW: true,
    }))
  })
}

export async function generateSW<T extends SWType>(
  options: BuildGenerateSWOptions<T>,
): Promise<BuildResult> {
  const buildStart = performance.now()

  const message = await import('./index').then(({
    checkGenerateSW,
  }) => checkGenerateSW(true))

  if (message) {
    throw new Error(message)
  }

  const [
    internalGenerateSW,
    prepareViteBuild,
  ] = await Promise.all([
    import('../builder/internal-generate-sw').then(({ internalGenerateSW }) => internalGenerateSW),
    import('./build-utils').then(({ prepareViteBuild }) => prepareViteBuild),
  ])

  return await internalGenerateSW(
    createGenerateContext<T>(
      buildStart,
      options,
    ),
    context => prepareViteBuilds(
      context,
      options,
      prepareViteBuild,
    ),
  )
}
