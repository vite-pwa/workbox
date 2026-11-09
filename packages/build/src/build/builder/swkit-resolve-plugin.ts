import type { Bundler, BundlerPluginType } from './bundler-types'
import { fileURLToPath } from 'node:url'

const SWKIT_IMPORT_RE = /^@vite-pwa\/workbox-swkit(?:\/|$)/

export function SWKitResolvePlugin<B extends Bundler>(
  bundler: B,
  generateSW: boolean,
): BundlerPluginType<B> {
  const importer = fileURLToPath(import.meta.url)
  const plugin: import('rolldown').Plugin = {
    name: 'vite-pwa:workbox-build:swkit-resolve-plugin',
    async resolveId(id, from, options) {
      if (!SWKIT_IMPORT_RE.test(id)) {
        return undefined
      }

      const resolveOptions = { ...options, skipSelf: true }
      if (!generateSW) {
        const resolved = await this.resolve(id, from, resolveOptions)
        if (resolved) {
          return resolved
        }
      }

      return await this.resolve(id, importer, resolveOptions)
    },
  }

  return (bundler === 'vite'
    ? { ...plugin, enforce: 'pre' }
    : plugin) as BundlerPluginType<B>
}
