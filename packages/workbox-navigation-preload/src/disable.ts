/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { logger } from '@vite-pwa/workbox-core/internals'
import { isSupported } from './isSupported'

// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope

/**
 * If the browser supports Navigation Preload, then this will disable it.
 */
function disable(): void {
  if (isSupported()) {
    self.addEventListener('activate', (event: ExtendableEvent) => {
      event.waitUntil(
        self.registration.navigationPreload.disable().then(() => {
          // eslint-disable-next-line node/prefer-global/process
          if (process.env.NODE_ENV !== 'production') {
            logger.log(`Navigation preload is disabled.`)
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

export { disable }
