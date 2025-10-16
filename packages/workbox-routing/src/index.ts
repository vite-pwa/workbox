/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { NavigationRouteMatchOptions } from './NavigationRoute'
import { NavigationRoute } from './NavigationRoute'
import { RegExpRoute } from './RegExpRoute'
import { registerRoute } from './registerRoute'
import { Route } from './Route'
import { Router } from './Router'
import { setCatchHandler } from './setCatchHandler'
import { setDefaultHandler } from './setDefaultHandler'

/**
 * @module workbox-routing
 */

export {
  NavigationRoute,
  NavigationRouteMatchOptions,
  RegExpRoute,
  registerRoute,
  Route,
  Router,
  setCatchHandler,
  setDefaultHandler,
}
