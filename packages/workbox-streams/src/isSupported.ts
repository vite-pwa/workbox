/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { canConstructReadableStream } from '@vite-pwa/workbox-core/internals'

/**
 * This is a utility method that determines whether the current browser supports
 * the features required to create streamed responses. Currently, it checks if
 * [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/ReadableStream)
 * can be created.
 *
 * @return {boolean} `true`, if the current browser meets the requirements for
 * streaming responses, and `false` otherwise.
 */
function isSupported(): boolean {
  return canConstructReadableStream()
}

export { isSupported }
