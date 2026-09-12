import type { BuildResult, InjectManifestOptions } from './types'

export async function injectManifest(options: InjectManifestOptions): Promise<BuildResult> {
  const buildStart = performance.now()
  return await import('./utils/build-inject-manifest').then(({ buildInjectManifest }) => buildInjectManifest(
    buildStart,
    options,
  ))
}
