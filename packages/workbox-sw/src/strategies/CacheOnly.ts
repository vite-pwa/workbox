/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { StrategyHandler } from './StrategyHandler'

import { assert, logger, WorkboxError } from '../core/internals'
import { Strategy } from './Strategy'
import { messages } from './utils/messages'

/**
 * An implementation of a [cache-only](https://developer.chrome.com/docs/workbox/caching-strategies-overview/#cache-only)
 * request strategy.
 *
 * This class is useful if you want to take advantage of any
 * [Workbox plugins](https://developer.chrome.com/docs/workbox/using-plugins/).
 *
 * If there is no cache match, this will throw a `WorkboxError` exception.
 */
class CacheOnly extends Strategy {
  /**
   * @private
   * @param {Request|string} request A request to run this strategy for.
   * @param {workbox-strategies.StrategyHandler} handler The event that
   *     triggered the request.
   * @return {Promise<Response>}
   */
  async _handle(request: Request, handler: StrategyHandler): Promise<Response> {
    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      assert!.isInstance(request, Request, {
        moduleName: 'workbox-strategies',
        className: this.constructor.name,
        funcName: 'makeRequest',
        paramName: 'request',
      })
    }

    const response = await handler.cacheMatch(request)

    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      logger.groupCollapsed(
        messages.strategyStart(this.constructor.name, request),
      )
      if (response) {
        logger.log(
          `Found a cached response in the '${this.cacheName}' ` + `cache.`,
        )
        messages.printFinalResponse(response)
      }
      else {
        logger.log(`No response found in the '${this.cacheName}' cache.`)
      }
      logger.groupEnd()
    }

    if (!response) {
      throw new WorkboxError('no-response', { url: request.url })
    }
    return response
  }
}

export { CacheOnly }
