/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { PrecacheEntry, PrecacheRouteOptions } from './_types'
import { addRoute } from './addRoute'
import { precache } from './precache'

/**
 * This method will add entries to the precache list and add a route to
 * respond to fetch events.
 *
 * This is a convenience method that will call
 * {@link workbox-precaching.precache} and
 * {@link workbox-precaching.addRoute} in a single call.
 *
 * @param {Array<object | string>} entries Array of entries to precache.
 * @param {object} [options] See the
 * {@link workbox-precaching.PrecacheRoute} options.
 */
function precacheAndRoute(
  entries: Array<PrecacheEntry | string>,
  options?: PrecacheRouteOptions,
): void {
  precache(entries)
  addRoute(options)
}

export { precacheAndRoute }
