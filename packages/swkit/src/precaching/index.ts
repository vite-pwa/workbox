/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { addPlugins } from './addPlugins'
import { addRoute } from './addRoute'
import { cleanupOutdatedCaches } from './cleanupOutdatedCaches'
import { createHandlerBoundToURL } from './createHandlerBoundToURL'
import { getCacheKeyForURL } from './getCacheKeyForURL'
import { matchPrecache } from './matchPrecache'
import { precache } from './precache'
import { precacheAndRoute } from './precacheAndRoute'
import { PrecacheController } from './PrecacheController'
import { PrecacheFallbackPlugin } from './PrecacheFallbackPlugin'
import { PrecacheRoute } from './PrecacheRoute'
import { PrecacheStrategy } from './PrecacheStrategy'

/**
 * Most consumers of this module will want to use the
 * {@link workbox-precaching.precacheAndRoute}
 * method to add assets to the cache and respond to network requests with these
 * cached assets.
 *
 * If you require more control over caching and routing, you can use the
 * {@link workbox-precaching.PrecacheController}
 * interface.
 *
 * @module workbox-precaching
 */

export {
  addPlugins,
  addRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  getCacheKeyForURL,
  matchPrecache,
  precache,
  precacheAndRoute,
  PrecacheController,
  PrecacheFallbackPlugin,
  PrecacheRoute,
  PrecacheStrategy,
}

export * from './types'
