/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { WorkboxSw } from './workbox-sw'

// Don't export anything, just expose a global.
// eslint-disable-next-line no-restricted-globals
self.workbox = new WorkboxSw()
