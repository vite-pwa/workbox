/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { cacheNames } from './cacheNames'
import { clientsClaim } from './clientsClaim'
import { copyResponse } from './copyResponse'
import { registerQuotaErrorCallback } from './registerQuotaErrorCallback'
import { setCacheNameDetails } from './setCacheNameDetails'
import { skipWaiting } from './skipWaiting'

/**
 * All of the Workbox service worker libraries use workbox-core for shared
 * code as well as setting default values that need to be shared (like cache
 * names).
 *
 * @module workbox-core
 */
export {
  cacheNames,
  clientsClaim,
  copyResponse,
  registerQuotaErrorCallback,
  setCacheNameDetails,
  skipWaiting,
}

export * from './types'
