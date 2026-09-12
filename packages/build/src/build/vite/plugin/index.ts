import type { PluginOption } from 'vite'
import type { Strategy } from '../../../config/types'
import type { SWType } from '../../../types'
import type { VitePWAOptions } from './types'
import { checkStrategy, preparePluginContext } from './plugin-context'

export type { VitePWAOptions }

export function ViteWorkboxPWAPlugin<
  S extends Strategy,
  T extends SWType = 'classic',
>(
  options: VitePWAOptions<S, T> = {},
): PluginOption {
  const pluginContext = preparePluginContext(options)
  return {
    name: 'vite-workbox:pwa-build:plugin',
    apply: 'build',
    enforce: 'post',
    applyToEnvironment(environment) {
      return environment.config.consumer === 'client'
    },
    async configResolved(config) {
      const message = await checkStrategy(pluginContext, config)
      const { vite } = await pluginContext.detectionResult
      if (!vite && pluginContext.resolvedViteConfig.build.ssr) {
        return
      }
      if (message) {
        throw new Error(message)
      }
    },
    closeBundle: {
      sequential: true,
      order: 'post',
      async handler() {
        const [
          resolvedPluginOptions,
          { vite },
          handleBuild,
        ] = await Promise.all([
          pluginContext.resolvedOptions,
          pluginContext.detectionResult,
          import('./plugin-builder').then(({ handleBuild }) => handleBuild),
        ])
        if (!vite && pluginContext.resolvedViteConfig.build.ssr) {
          return
        }
        await handleBuild(
          pluginContext,
          resolvedPluginOptions,
          vite,
        )
      },
    },
  } satisfies PluginOption
}
