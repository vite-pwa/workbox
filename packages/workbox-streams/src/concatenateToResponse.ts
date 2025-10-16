/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { StreamSource } from './_types'
import { concatenate } from './concatenate'
import { createHeaders } from './utils/createHeaders'

export interface ConcatenateToResponseReturn {
  done: Promise<void>
  response: Response
}

/**
 * Takes multiple source Promises, each of which could resolve to a Response, a
 * ReadableStream, or a [BodyInit](https://fetch.spec.whatwg.org/#bodyinit),
 * along with a
 * [HeadersInit](https://fetch.spec.whatwg.org/#typedefdef-headersinit).
 *
 * Returns an object exposing a Response whose body consists of each individual
 * stream's data returned in sequence, along with a Promise which signals when
 * the stream is finished (useful for passing to a FetchEvent's waitUntil()).
 *
 * @param {Array<Promise<StreamSource>>} sourcePromises
 * @param {HeadersInit} [headersInit] If there's no `Content-Type` specified,
 * `'text/html'` will be used by default.
 * @return {done: Promise<void>, stream: ReadableStream}
 */
function concatenateToResponse(
  sourcePromises: Promise<StreamSource>[],
  headersInit: HeadersInit,
): { done: Promise<void>, response: Response } {
  const { done, stream } = concatenate(sourcePromises)

  const headers = createHeaders(headersInit)
  const response = new Response(stream, { headers })

  return { done, response }
}

export { concatenateToResponse }
