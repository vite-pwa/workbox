import type { Bundler, BundlerPluginType } from './bundler-types'
import { WORKBOX_SWKIT_RE } from './utils'

export function EnableSWKitLogsPlugin<B extends Bundler>(
  bundler: B,
): BundlerPluginType<B> {
  return (bundler === 'vite'
    ? <import('vite').Plugin>{
      name: 'vite-pwa:workbox-build:enable-swkit-logs-plugin',
      enforce: 'pre',
      transform(code, id) {
        return doTransform(code, id)
      },
    }
    : <import('rolldown').Plugin>{
      name: 'vite-pwa:workbox-build:enable-swkit-logs-plugin',
      transform(code, id) {
        return doTransform(code, id)
      },
    }) as BundlerPluginType<B>
}

function doTransform(code: string, id: string): {
  code: string
  map: null
} | undefined {
  return !WORKBOX_SWKIT_RE.test(id.split('?')[0]) || !code.includes('process.env.NODE_ENV')
    ? undefined
    : {
        code: code.replaceAll('process.env.NODE_ENV', JSON.stringify('development')),
        map: null,
      }
}
