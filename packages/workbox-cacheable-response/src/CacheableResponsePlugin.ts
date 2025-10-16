/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { WorkboxPlugin } from '@vite-pwa/workbox-core'
import type { CacheableResponseOptions } from './CacheableResponse'
import { CacheableResponse } from './CacheableResponse'

/**
 * A class implementing the `cacheWillUpdate` lifecycle callback. This makes it
 * easier to add in cacheability checks to requests made via Workbox's built-in
 * strategies.
 */
class CacheableResponsePlugin implements WorkboxPlugin {
  private readonly _cacheableResponse: CacheableResponse

  /**
   * To construct a new CacheableResponsePlugin instance you must provide at
   * least one of the `config` properties.
   *
   * If both `statuses` and `headers` are specified, then both conditions must
   * be met for the `Response` to be considered cacheable.
   *
   * @param {object} config
   * @param {Array<number>} [config.statuses] One or more status codes that a
   * `Response` can have and be considered cacheable.
   */
  constructor(config: CacheableResponseOptions) {
    this._cacheableResponse = new CacheableResponse(config)
  }

  /**
   * @param {object} options
   * @param {Response} options.response
   * @return {Response|null}
   * @private
   */
  cacheWillUpdate: WorkboxPlugin['cacheWillUpdate'] = async ({ response }) => {
    if (this._cacheableResponse.isResponseCacheable(response)) {
      return response
    }
    return null
  }
}

export { CacheableResponsePlugin }
