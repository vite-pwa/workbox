/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { logger } from './_private/logger'

// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope

/**
 * This method is deprecated, and will be removed in Workbox v7.
 *
 * Calling self.skipWaiting() is equivalent, and should be used instead.
 *
 * @memberof workbox-core
 */
function skipWaiting(): void {
  // Just call self.skipWaiting() directly.
  // See https://github.com/GoogleChrome/workbox/issues/2525
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production') {
    logger.warn(
      `skipWaiting() from workbox-core is no longer recommended `
      + `and will be removed in Workbox v7. Using self.skipWaiting() instead `
      + `is equivalent.`,
    )
  }

  void self.skipWaiting()
}

export { skipWaiting }
