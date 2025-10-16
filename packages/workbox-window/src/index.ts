/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { messageSW } from './messageSW'
import { Workbox } from './Workbox'

export { messageSW, Workbox }

// See https://github.com/GoogleChrome/workbox/issues/2770
export * from './utils/WorkboxEvent'
