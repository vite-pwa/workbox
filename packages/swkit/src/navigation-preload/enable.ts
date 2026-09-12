/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { logger } from '../core/internals'
import { isSupported } from './isSupported'

// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope

/**
 * If the browser supports Navigation Preload, then this will enable it.
 *
 * @param {string} [headerValue] Optionally, allows developers to
 * [override](https://developers.google.com/web/updates/2017/02/navigation-preload#changing_the_header)
 * the value of the `Service-Worker-Navigation-Preload` header which will be
 * sent to the server when making the navigation request.
 */
function enable(headerValue?: string): void {
  if (isSupported()) {
    self.addEventListener('activate', (event: ExtendableEvent) => {
      event.waitUntil(
        self.registration.navigationPreload.enable().then(() => {
          // Defaults to Service-Worker-Navigation-Preload: true if not set.
          if (headerValue) {
            void self.registration.navigationPreload.setHeaderValue(
              headerValue,
            )
          }

          // eslint-disable-next-line node/prefer-global/process
          if (process.env.NODE_ENV !== 'production') {
            logger.log(`Navigation preload is enabled.`)
          }
        }),
      )
    })
  }
  else {
    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      logger.log(`Navigation preload is not supported in this browser.`)
    }
  }
}

export { enable }
