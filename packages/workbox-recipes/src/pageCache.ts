/*
  Copyright 2020 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type {
  RouteMatchCallback,
  RouteMatchCallbackOptions,
  WorkboxPlugin,
} from '@vite-pwa/workbox-core'
import { CacheableResponsePlugin } from '@vite-pwa/workbox-cacheable-response'
import { registerRoute } from '@vite-pwa/workbox-routing'
import { NetworkFirst } from '@vite-pwa/workbox-strategies'
import { warmStrategyCache } from './warmStrategyCache'

export interface PageCacheOptions {
  cacheName?: string
  matchCallback?: RouteMatchCallback
  networkTimeoutSeconds?: number
  plugins?: Array<WorkboxPlugin>
  warmCache?: Array<string>
}

/**
 * An implementation of a page caching recipe with a network timeout
 *
 * @param {object} [options]
 * @param {string} [options.cacheName] Name for cache. Defaults to pages
 * @param {RouteMatchCallback} [options.matchCallback] Workbox callback function to call to match to. Defaults to request.mode === 'navigate';
 * @param {number} [options.networkTimoutSeconds] Maximum amount of time, in seconds, to wait on the network before falling back to cache. Defaults to 3
 * @param {WorkboxPlugin[]} [options.plugins] Additional plugins to use for this recipe
 * @param {string[]} [options.warmCache] Paths to call to use to warm this cache
 */
function pageCache(options: PageCacheOptions = {}): void {
  const defaultMatchCallback = ({ request }: RouteMatchCallbackOptions) =>
    request.mode === 'navigate'

  const cacheName = options.cacheName || 'pages'
  const matchCallback = options.matchCallback || defaultMatchCallback
  const networkTimeoutSeconds = options.networkTimeoutSeconds || 3
  const plugins = options.plugins || []
  plugins.push(
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
  )

  const strategy = new NetworkFirst({
    networkTimeoutSeconds,
    cacheName,
    plugins,
  })

  // Registers the route
  registerRoute(matchCallback, strategy)

  // Warms the cache
  if (options.warmCache) {
    warmStrategyCache({ urls: options.warmCache, strategy })
  }
}

export { pageCache }
