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
 * An implementation of a [cache-first](https://developer.chrome.com/docs/workbox/caching-strategies-overview/#cache-first-falling-back-to-network)
 * request strategy.
 *
 * A cache first strategy is useful for assets that have been revisioned,
 * such as URLs like `/styles/example.a8f5f1.css`, since they
 * can be cached for long periods of time.
 *
 * If the network request fails, and there is no cache match, this will throw
 * a `WorkboxError` exception.
 */
class CacheFirst extends Strategy {
  /**
   * @private
   * @param request {Request|string} A request to run this strategy for.
   * @param handler {import('./index').StrategyHandler}  The event that
   *     triggered the request.
   * @return {Promise<Response>}
   */
  async _handle(request: Request, handler: StrategyHandler): Promise<Response> {
    const logs = []

    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      assert!.isInstance(request, Request, {
        moduleName: 'workbox-strategies',
        className: this.constructor.name,
        funcName: 'makeRequest',
        paramName: 'request',
      })
    }

    let response = await handler.cacheMatch(request)

    let error: Error | undefined
    if (!response) {
      // eslint-disable-next-line node/prefer-global/process
      if (process.env.NODE_ENV !== 'production') {
        logs.push(
          `No response found in the '${this.cacheName}' cache. `
          + `Will respond with a network request.`,
        )
      }
      try {
        response = await handler.fetchAndCachePut(request)
      }
      catch (err) {
        if (err instanceof Error) {
          error = err
        }
      }

      // eslint-disable-next-line node/prefer-global/process
      if (process.env.NODE_ENV !== 'production') {
        if (response) {
          logs.push(`Got response from network.`)
        }
        else {
          logs.push(`Unable to get a response from the network.`)
        }
      }
    }
    else {
      // eslint-disable-next-line node/prefer-global/process
      if (process.env.NODE_ENV !== 'production') {
        logs.push(`Found a cached response in the '${this.cacheName}' cache.`)
      }
    }

    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      logger.groupCollapsed(
        messages.strategyStart(this.constructor.name, request),
      )
      for (const log of logs) {
        logger.log(log)
      }
      messages.printFinalResponse(response)
      logger.groupEnd()
    }

    if (!response) {
      throw new WorkboxError('no-response', { url: request.url, error })
    }
    return response
  }
}

export { CacheFirst }
