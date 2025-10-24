/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { PrecacheEntry } from './types'
import { getOrCreatePrecacheController } from './utils/getOrCreatePrecacheController'

/**
 * Adds items to the precache list, removing any duplicates and
 * stores the files in the
 * {@link workbox-core.cacheNames|"precache cache"} when the service
 * worker installs.
 *
 * This method can be called multiple times.
 *
 * Please note: This method **will not** serve any of the cached files for you.
 * It only precaches files. To respond to a network request you call
 * {@link workbox-precaching.addRoute}.
 *
 * If you have a single array of files to precache, you can just call
 * {@link workbox-precaching.precacheAndRoute}.
 *
 * @param {Array<object | string>} [entries] Array of entries to precache.
 */
function precache(entries: Array<PrecacheEntry | string>): void {
  const precacheController = getOrCreatePrecacheController()
  precacheController.precache(entries)
}

export { precache }
