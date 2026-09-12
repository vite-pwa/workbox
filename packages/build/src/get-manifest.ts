import type { GetManifestOptions, GetManifestResult } from './types'

export async function getManifest(options: GetManifestOptions): Promise<GetManifestResult> {
  return await import('./utils/build-get-manifest').then(({ buildGetManifest }) => buildGetManifest(options))
}
