/*
  Copyright 2020 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { Strategy } from '../strategies/Strategy'

export interface WarmStrategyCacheOptions {
  urls: Array<string>
  strategy: Strategy
}

// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope

/**
 * @param {object} options
 * @param {string[]} options.urls Paths to warm the strategy's cache with
 * @param {Strategy} options.strategy Strategy to use
 */
function warmStrategyCache(options: WarmStrategyCacheOptions): void {
  self.addEventListener('install', (event) => {
    const done = options.urls.map(
      path =>
        options.strategy.handleAll({
          event,
          request: new Request(path),
        })[1],
    )

    event.waitUntil(Promise.all(done))
  })
}

export { warmStrategyCache }
