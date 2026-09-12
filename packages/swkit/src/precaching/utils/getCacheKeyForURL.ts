/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { PrecacheRouteOptions } from '../types'
import { generateURLVariations } from './generateURLVariations'
import { getOrCreatePrecacheController } from './getOrCreatePrecacheController'

/**
 * This function will take the request URL and manipulate it based on the
 * configuration options.
 *
 * @param {string} url
 * @param {object} options
 * @return {string} Returns the URL in the cache that matches the request,
 * if possible.
 *
 * @private
 */
export function getCacheKeyForURL(url: string, options: PrecacheRouteOptions): string | void {
  const precacheController = getOrCreatePrecacheController()

  const urlsToCacheKeys = precacheController.getURLsToCacheKeys()
  for (const possibleURL of generateURLVariations(url, options)) {
    const possibleCacheKey = urlsToCacheKeys.get(possibleURL)
    if (possibleCacheKey) {
      return possibleCacheKey
    }
  }
}
