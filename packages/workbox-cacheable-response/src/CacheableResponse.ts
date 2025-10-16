/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { assert, getFriendlyURL, logger, WorkboxError } from '@vite-pwa/workbox-core/internals'

export interface CacheableResponseOptions {
  statuses?: number[]
  /**
   * A mapping of header names
   * and expected values that a `Response` can have and be considered cacheable.
   * If multiple headers are provided, only one needs to be present.
   */
  headers?: { [headerName: string]: string }
}

/**
 * This class allows you to set up rules determining what
 * status codes and/or headers need to be present in order for a
 * [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * to be considered cacheable.
 */
class CacheableResponse {
  private readonly _statuses?: CacheableResponseOptions['statuses']
  private readonly _headers?: CacheableResponseOptions['headers']

  /**
   * To construct a new CacheableResponse instance you must provide at least
   * one of the `config` properties.
   *
   * If both `statuses` and `headers` are specified, then both conditions must
   * be met for the `Response` to be considered cacheable.
   *
   * @param {object} config
   * @param {Array<number>} [config.statuses] One or more status codes that a
   * `Response` can have and be considered cacheable.
   */
  constructor(config: CacheableResponseOptions = {}) {
    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      if (!(config.statuses || config.headers)) {
        throw new WorkboxError('statuses-or-headers-required', {
          moduleName: 'workbox-cacheable-response',
          className: 'CacheableResponse',
          funcName: 'constructor',
        })
      }

      if (config.statuses) {
        assert!.isArray(config.statuses, {
          moduleName: 'workbox-cacheable-response',
          className: 'CacheableResponse',
          funcName: 'constructor',
          paramName: 'config.statuses',
        })
      }

      if (config.headers) {
        assert!.isType(config.headers, 'object', {
          moduleName: 'workbox-cacheable-response',
          className: 'CacheableResponse',
          funcName: 'constructor',
          paramName: 'config.headers',
        })
      }
    }

    this._statuses = config.statuses
    this._headers = config.headers
  }

  /**
   * Checks a response to see whether it's cacheable or not, based on this
   * object's configuration.
   *
   * @param {Response} response The response whose cacheability is being
   * checked.
   * @return {boolean} `true` if the `Response` is cacheable, and `false`
   * otherwise.
   */
  isResponseCacheable(response: Response): boolean {
    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      assert!.isInstance(response, Response, {
        moduleName: 'workbox-cacheable-response',
        className: 'CacheableResponse',
        funcName: 'isResponseCacheable',
        paramName: 'response',
      })
    }

    let cacheable = true

    if (this._statuses) {
      cacheable = this._statuses.includes(response.status)
    }

    if (this._headers && cacheable) {
      cacheable = Object.keys(this._headers).some((headerName) => {
        return response.headers.get(headerName) === this._headers![headerName]
      })
    }

    // eslint-disable-next-line node/prefer-global/process
    if (process.env.NODE_ENV !== 'production') {
      if (!cacheable) {
        logger.groupCollapsed(
          `The request for `
          + `'${getFriendlyURL(response.url)}' returned a response that does `
          + `not meet the criteria for being cached.`,
        )

        logger.groupCollapsed(`View cacheability criteria here.`)
        logger.log(`Cacheable statuses: ${JSON.stringify(this._statuses)}`)
        logger.log(
          `Cacheable headers: ${JSON.stringify(this._headers, null, 2)}`,
        )
        logger.groupEnd()

        const logFriendlyHeaders: { [key: string]: string } = {}
        response.headers.forEach((value, key) => {
          logFriendlyHeaders[key] = value
        })

        logger.groupCollapsed(`View response status and headers here.`)
        logger.log(`Response status: ${response.status}`)
        logger.log(
          `Response headers: ${JSON.stringify(logFriendlyHeaders, null, 2)}`,
        )
        logger.groupEnd()

        logger.groupCollapsed(`View full response details here.`)
        logger.log(response.headers)
        logger.log(response)
        logger.groupEnd()

        logger.groupEnd()
      }
    }

    return cacheable
  }
}

export { CacheableResponse }
