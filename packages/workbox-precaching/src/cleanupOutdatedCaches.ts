/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { privateCacheNames as cacheNames, logger } from '@vite-pwa/workbox-core/internals'
import { deleteOutdatedCaches } from './utils/deleteOutdatedCaches'

/**
 * Adds an `activate` event listener which will clean up incompatible
 * precaches that were created by older versions of Workbox.
 *
 * @memberof workbox-precaching
 */
function cleanupOutdatedCaches(): void {
  // See https://github.com/Microsoft/TypeScript/issues/28357#issuecomment-436484705
  // eslint-disable-next-line no-restricted-globals
  self.addEventListener('activate', ((event: ExtendableEvent) => {
    const cacheName = cacheNames.getPrecacheName()

    event.waitUntil(
      deleteOutdatedCaches(cacheName).then((cachesDeleted) => {
        // eslint-disable-next-line node/prefer-global/process
        if (process.env.NODE_ENV !== 'production') {
          if (cachesDeleted.length > 0) {
            logger.log(
              `The following out-of-date precaches were cleaned up `
              + `automatically:`,
              cachesDeleted,
            )
          }
        }
      }),
    )
  }) as EventListener)
}

export { cleanupOutdatedCaches }
