/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { WorkboxPlugin } from '../core/types'
import type {
  BroadcastCacheUpdateOptions,
} from './BroadcastCacheUpdate'

import { dontWaitFor } from '../core/internals'
import {
  BroadcastCacheUpdate,
} from './BroadcastCacheUpdate'

/**
 * This plugin will automatically broadcast a message whenever a cached response
 * is updated.
 */
class BroadcastUpdatePlugin implements WorkboxPlugin {
  private readonly _broadcastUpdate: BroadcastCacheUpdate

  /**
   * Construct a {@link workbox-broadcast-update.BroadcastUpdate} instance with
   * the passed options and calls its `notifyIfUpdated` method whenever the
   * plugin's `cacheDidUpdate` callback is invoked.
   *
   * @param {object} [options]
   * @param {Array<string>} [options.headersToCheck]
   *     A list of headers that will be used to determine whether the responses
   *     differ.
   * @param {string} [options.generatePayload] A function whose return value
   *     will be used as the `payload` field in any cache update messages sent
   *     to the window clients.
   */
  constructor(options?: BroadcastCacheUpdateOptions) {
    this._broadcastUpdate = new BroadcastCacheUpdate(options)
  }

  /**
   * A "lifecycle" callback that will be triggered automatically by the
   * `workbox-sw` and `workbox-runtime-caching` handlers when an entry is
   * added to a cache.
   *
   * @private
   * @param {object} options The input object to this function.
   * @param {string} options.cacheName Name of the cache being updated.
   * @param {Response} [options.oldResponse] The previous cached value, if any.
   * @param {Response} options.newResponse The new value in the cache.
   * @param {Request} options.request The request that triggered the update.
   * @param {Request} options.event The event that triggered the update.
   */
  cacheDidUpdate: WorkboxPlugin['cacheDidUpdate'] = async (options) => {
    dontWaitFor(this._broadcastUpdate.notifyIfUpdated(options))
  }
}

export { BroadcastUpdatePlugin }
