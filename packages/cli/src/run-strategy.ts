import type { BuildServiceWorkerOptions } from '@vite-pwa/workbox-build/build/rolldown/types'
import type { BuildGenerateSWOptions } from '@vite-pwa/workbox-build/build/types'
import type { GetManifestOptions, InjectManifestOptions, SelfDestroyingOptions, SWType } from '@vite-pwa/workbox-build/types'
import type { CliStrategy, WorkboxCliConfig } from './options'
import { getManifest, injectManifest } from '@vite-pwa/workbox-build'
import { buildSW } from '@vite-pwa/workbox-build/build/rolldown/build-sw'
import { generateSW } from '@vite-pwa/workbox-build/build/rolldown/generate-sw'
import { selfDestroyingSW } from '@vite-pwa/workbox-build/self-destroying-sw'
import { reportBuildResult, reportManifest } from './report'

export async function runStrategy<S extends CliStrategy, T extends SWType>(
  strategy: S,
  config: WorkboxCliConfig<S, T>,
): Promise<void> {
  switch (strategy) {
    case 'generate-sw': {
      await generateSW((config.generateSW ?? {}) as BuildGenerateSWOptions<T>)
      break
    }
    case 'build-sw': {
      await buildSW((config.buildSW ?? {}) as BuildServiceWorkerOptions<T>)
      break
    }
    case 'inject-manifest': {
      reportBuildResult('inject-manifest', await injectManifest((config.injectManifest ?? {}) as InjectManifestOptions))
      break
    }
    case 'get-manifest': {
      reportManifest(await getManifest((config.getManifest ?? {}) as GetManifestOptions))
      break
    }
    case 'self-destroy-sw': {
      await selfDestroyingSW((config.selfDestroying ?? {}) as SelfDestroyingOptions)
      break
    }
    default: {
      throw new Error(`Unsupported Workbox strategy: "${strategy as string}"`)
    }
  }
}
