/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { WorkboxPlugin } from '@vite-pwa/workbox-core'
import { getOrCreatePrecacheController } from './utils/getOrCreatePrecacheController'

/**
 * Adds plugins to the precaching strategy.
 *
 * @param {Array<object>} plugins
 */
function addPlugins(plugins: WorkboxPlugin[]): void {
  const precacheController = getOrCreatePrecacheController()
  precacheController.strategy.plugins.push(...plugins)
}

export { addPlugins }
