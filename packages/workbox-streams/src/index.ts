/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { StreamsHandlerCallback } from './strategy'
import { concatenate } from './concatenate'
import { concatenateToResponse } from './concatenateToResponse'
import { isSupported } from './isSupported'
import { strategy } from './strategy'

export {
  concatenate,
  concatenateToResponse,
  isSupported,
  strategy,
  StreamsHandlerCallback,
}

export * from './_types'
