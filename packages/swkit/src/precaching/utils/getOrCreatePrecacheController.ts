/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { PrecacheOptions } from '../types'
import { PrecacheController } from '../PrecacheController'

let precacheController: PrecacheController | undefined

/**
 * @return {PrecacheController}
 * @private
 */
export function getOrCreatePrecacheController(options?: PrecacheOptions): PrecacheController {
  if (!precacheController) {
    precacheController = new PrecacheController(options)
  }
  return precacheController
}
