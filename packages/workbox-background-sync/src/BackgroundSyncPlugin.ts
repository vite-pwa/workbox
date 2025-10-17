/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { WorkboxPlugin } from '@vite-pwa/workbox-core'
import type { QueueOptions } from './Queue'
import { Queue } from './Queue'

/**
 * A class implementing the `fetchDidFail` lifecycle callback. This makes it
 * easier to add failed requests to a background sync Queue.
 *
 * @memberof workbox-background-sync
 */
class BackgroundSyncPlugin implements WorkboxPlugin {
  private readonly _queue: Queue

  /**
   * @param {string} name See the {@link workbox-background-sync.Queue}
   *     documentation for parameter details.
   * @param {object} [options] See the
   *     {@link workbox-background-sync.Queue} documentation for
   *     parameter details.
   */
  constructor(name: string, options?: QueueOptions) {
    this._queue = new Queue(name, options)
  }

  /**
   * @param {object} options
   * @param {Request} options.request
   * @private
   */
  fetchDidFail: WorkboxPlugin['fetchDidFail'] = async ({ request }) => {
    await this._queue.pushRequest({ request })
  }
}

export { BackgroundSyncPlugin }
