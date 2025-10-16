/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { RouteHandler, RouteHandlerObject } from '@vite-pwa/workbox-core'
import { assert } from '@vite-pwa/workbox-core/internals'

/**
 * @param {function() | object} handler Either a function, or an object with a
 * 'handle' method.
 * @return {object} An object with a handle method.
 *
 * @private
 */
export function normalizeHandler(handler: RouteHandler): RouteHandlerObject {
  if (handler && typeof handler === 'object') {
    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      assert!.hasMethod(handler, 'handle', {
        moduleName: 'workbox-routing',
        className: 'Route',
        funcName: 'constructor',
        paramName: 'handler',
      })
    }
    return handler
  }
  else {
    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      assert!.isType(handler, 'function', {
        moduleName: 'workbox-routing',
        className: 'Route',
        funcName: 'constructor',
        paramName: 'handler',
      })
    }
    return { handle: handler }
  }
}
