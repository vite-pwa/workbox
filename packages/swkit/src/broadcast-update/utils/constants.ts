/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

export const CACHE_UPDATED_MESSAGE_TYPE = 'CACHE_UPDATED'
export const CACHE_UPDATED_MESSAGE_META = 'workbox-broadcast-update'
export const NOTIFY_ALL_CLIENTS = true
export const DEFAULT_HEADERS_TO_CHECK: string[] = [
  'content-length',
  'etag',
  'last-modified',
]
