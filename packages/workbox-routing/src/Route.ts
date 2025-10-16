/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type {
  RouteHandler,
  RouteHandlerObject,
  RouteMatchCallback,
} from 'vite-pwa-workbox-core'
import type { HTTPMethod } from './utils/constants'
import { assert } from 'vite-pwa-workbox-core/internals'
import { defaultMethod, validMethods } from './utils/constants'
import { normalizeHandler } from './utils/normalizeHandler'

/**
 * A `Route` consists of a pair of callback functions, "match" and "handler".
 * The "match" callback determine if a route should be used to "handle" a
 * request by returning a non-falsy value if it can. The "handler" callback
 * is called when there is a match and should return a Promise that resolves
 * to a `Response`.
 *
 * @memberof workbox-routing
 */
class Route {
  handler: RouteHandlerObject
  match: RouteMatchCallback
  method: HTTPMethod
  catchHandler?: RouteHandlerObject

  /**
   * Constructor for Route class.
   *
   * @param {workbox-routing~matchCallback} match
   * A callback function that determines whether the route matches a given
   * `fetch` event by returning a non-falsy value.
   * @param {workbox-routing~handlerCallback} handler A callback
   * function that returns a Promise resolving to a Response.
   * @param {string} [method] The HTTP method to match the Route
   * against.
   */
  constructor(
    match: RouteMatchCallback,
    handler: RouteHandler,
    method: HTTPMethod = defaultMethod,
  ) {
    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      assert!.isType(match, 'function', {
        moduleName: 'workbox-routing',
        className: 'Route',
        funcName: 'constructor',
        paramName: 'match',
      })

      if (method) {
        assert!.isOneOf(method, validMethods, { paramName: 'method' })
      }
    }

    // These values are referenced directly by Router so cannot be
    // altered by minificaton.
    this.handler = normalizeHandler(handler)
    this.match = match
    this.method = method
  }

  /**
   *
   * @param {workbox-routing-handlerCallback} handler A callback
   * function that returns a Promise resolving to a Response
   */
  setCatchHandler(handler: RouteHandler): void {
    this.catchHandler = normalizeHandler(handler)
  }
}

export { Route }
