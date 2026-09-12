import type { BundlerOptions } from './bundler-types'

export function prepareManifestName(
  {
    originalSWType,
    swType,
    manifest = false,
    workboxRuntimeCompatible,
  }: BundlerOptions,
): string | false {
  if (!manifest) {
    return false
  }

  const suffix = originalSWType === 'classic-and-module' || !workboxRuntimeCompatible
    ? `-${swType}`
    : ''

  return `.vite-pwa/sw-manifest${suffix}.json`
}
