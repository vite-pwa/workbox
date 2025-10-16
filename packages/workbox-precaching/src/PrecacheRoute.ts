/*
  Copyright 2020 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type {
  RouteMatchCallback,
  RouteMatchCallbackOptions,
} from '@vite-pwa/workbox-core'
import type { PrecacheRouteOptions } from './_types'
import type { PrecacheController } from './PrecacheController'
import { getFriendlyURL, logger } from '@vite-pwa/workbox-core/internals'

import { Route } from '@vite-pwa/workbox-routing'
import { generateURLVariations } from './utils/generateURLVariations'

/**
 * A subclass of {@link workbox-routing.Route} that takes a
 * {@link workbox-precaching.PrecacheController}
 * instance and uses it to match incoming requests and handle fetching
 * responses from the precache.
 */
class PrecacheRoute extends Route {
  /**
   * @param {PrecacheController} precacheController A `PrecacheController`
   * instance used to both match requests and respond to fetch events.
   * @param {object} [options] Options to control how requests are matched
   * against the list of precached URLs.
   * @param {string} [options.directoryIndex] The `directoryIndex` will
   * check cache entries for a URLs ending with '/' to see if there is a hit when
   * appending the `directoryIndex` value.
   * @param {Array<RegExp>} [options.ignoreURLParametersMatching] An
   * array of regex's to remove search params when looking for a cache match.
   * @param {boolean} [options.cleanURLs] The `cleanURLs` option will
   * check the cache for the URL with a `.html` added to the end of the end.
   * @param {workbox-precaching~urlManipulation} [options.urlManipulation]
   * This is a function that should take a URL and return an array of
   * alternative URLs that should be checked for precache matches.
   */
  constructor(
    precacheController: PrecacheController,
    options?: PrecacheRouteOptions,
  ) {
    const match: RouteMatchCallback = ({
      request,
    }: RouteMatchCallbackOptions) => {
      const urlsToCacheKeys = precacheController.getURLsToCacheKeys()
      for (const possibleURL of generateURLVariations(request.url, options)) {
        const cacheKey = urlsToCacheKeys.get(possibleURL)
        if (cacheKey) {
          const integrity
            = precacheController.getIntegrityForCacheKey(cacheKey)
          return { cacheKey, integrity }
        }
      }
      // eslint-disable-next-line node/prefer-global/process
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(
          `Precaching did not find a match for ${getFriendlyURL(request.url)}`,
        )
      }
    }

    super(match, precacheController.strategy)
  }
}

export { PrecacheRoute }
