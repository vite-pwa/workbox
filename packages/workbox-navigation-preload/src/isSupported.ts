/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope

/**
 * @return {boolean} Whether or not the current browser supports enabling
 * navigation preload.
 */
function isSupported(): boolean {
  return Boolean(self.registration && self.registration.navigationPreload)
}

export { isSupported }
