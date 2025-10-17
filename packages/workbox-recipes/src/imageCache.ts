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
import { ExpirationPlugin } from '@vite-pwa/workbox-expiration'
import { registerRoute } from '@vite-pwa/workbox-routing'
import { CacheFirst } from '@vite-pwa/workbox-strategies'
import { warmStrategyCache } from './warmStrategyCache'

export interface ImageCacheOptions {
  cacheName?: string
  matchCallback?: RouteMatchCallback
  maxAgeSeconds?: number
  maxEntries?: number
  plugins?: Array<WorkboxPlugin>
  warmCache?: Array<string>
}

/**
 * An implementation of the [image caching recipe]{@link https://developers.google.com/web/tools/workbox/guides/common-recipes#caching_images}
 *
 * @memberof workbox-recipes
 *
 * @param {object} [options]
 * @param {string} [options.cacheName] Name for cache. Defaults to images
 * @param {RouteMatchCallback} [options.matchCallback] Workbox callback function to call to match to. Defaults to request.destination === 'image';
 * @param {number} [options.maxAgeSeconds] Maximum age, in seconds, that font entries will be cached for. Defaults to 30 days
 * @param {number} [options.maxEntries] Maximum number of images that will be cached. Defaults to 60
 * @param {WorkboxPlugin[]} [options.plugins] Additional plugins to use for this recipe
 * @param {string[]} [options.warmCache] Paths to call to use to warm this cache
 */
function imageCache(options: ImageCacheOptions = {}): void {
  const defaultMatchCallback = ({ request }: RouteMatchCallbackOptions) =>
    request.destination === 'image'

  const cacheName = options.cacheName || 'images'
  const matchCallback = options.matchCallback || defaultMatchCallback
  const maxAgeSeconds = options.maxAgeSeconds || 30 * 24 * 60 * 60
  const maxEntries = options.maxEntries || 60
  const plugins = options.plugins || []
  plugins.push(
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
  )
  plugins.push(
    new ExpirationPlugin({
      maxEntries,
      maxAgeSeconds,
    }),
  )

  const strategy = new CacheFirst({
    cacheName,
    plugins,
  })

  registerRoute(matchCallback, strategy)

  // Warms the cache
  if (options.warmCache) {
    warmStrategyCache({ urls: options.warmCache, strategy })
  }
}

export { imageCache }
