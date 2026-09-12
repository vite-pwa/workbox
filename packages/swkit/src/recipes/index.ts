/*
  Copyright 2020 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { GoogleFontCacheOptions } from './googleFontsCache'
import type { ImageCacheOptions } from './imageCache'
import type { OfflineFallbackOptions } from './offlineFallback'
import type { PageCacheOptions } from './pageCache'
import type { StaticResourceOptions } from './staticResourceCache'
import type { WarmStrategyCacheOptions } from './warmStrategyCache'
import { googleFontsCache } from './googleFontsCache'
import { imageCache } from './imageCache'
import { offlineFallback } from './offlineFallback'
import { pageCache } from './pageCache'
import { staticResourceCache } from './staticResourceCache'
import { warmStrategyCache } from './warmStrategyCache'

export {
  GoogleFontCacheOptions,
  googleFontsCache,
  imageCache,
  ImageCacheOptions,
  offlineFallback,
  OfflineFallbackOptions,
  pageCache,
  PageCacheOptions,
  staticResourceCache,
  StaticResourceOptions,
  warmStrategyCache,
  WarmStrategyCacheOptions,
}
