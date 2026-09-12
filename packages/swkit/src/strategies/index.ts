/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { NetworkFirstOptions } from './NetworkFirst'
import type { NetworkOnlyOptions } from './NetworkOnly'
import type { StrategyOptions } from './Strategy'
import { CacheFirst } from './CacheFirst'
import { CacheOnly } from './CacheOnly'
import { NetworkFirst } from './NetworkFirst'
import { NetworkOnly } from './NetworkOnly'
import { StaleWhileRevalidate } from './StaleWhileRevalidate'
import { Strategy } from './Strategy'
import { StrategyHandler } from './StrategyHandler'

// See https://github.com/GoogleChrome/workbox/issues/2946
declare global {
  interface FetchEvent {
    // See https://github.com/GoogleChrome/workbox/issues/2974
    readonly preloadResponse: Promise<any>
  }
}

/**
 * There are common caching strategies that most service workers will need
 * and use. This module provides simple implementations of these strategies.
 *
 * @module workbox-strategies
 */

export {
  CacheFirst,
  CacheOnly,
  NetworkFirst,
  NetworkFirstOptions,
  NetworkOnly,
  NetworkOnlyOptions,
  StaleWhileRevalidate,
  Strategy,
  StrategyHandler,
  StrategyOptions,
}
