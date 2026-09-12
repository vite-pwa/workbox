/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { assert } from './_private/assert'
import { logger } from './_private/logger'
import { quotaErrorCallbacks } from './models/quotaErrorCallbacks'

/**
 * Adds a function to the set of quotaErrorCallbacks that will be executed if
 * there's a quota error.
 *
 * @param {Function} callback
 * @memberof workbox-core
 */
// Can't change Function type
// eslint-disable-next-line ts/no-unsafe-function-type
function registerQuotaErrorCallback(callback: Function): void {
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production') {
    assert!.isType(callback, 'function', {
      moduleName: 'workbox-core',
      funcName: 'register',
      paramName: 'callback',
    })
  }

  quotaErrorCallbacks.add(callback)

  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production') {
    logger.log('Registered a callback to respond to quota errors.', callback)
  }
}

export { registerQuotaErrorCallback }
