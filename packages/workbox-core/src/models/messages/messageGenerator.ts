/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { messages } from './messages'

function fallback(code: string, ...args: any[]) {
  let msg = code
  if (args.length > 0) {
    msg += ` :: ${JSON.stringify(args)}`
  }
  return msg
}

function generatorFunction(code: string, details = {}) {
  const message = messages[code]
  if (!message) {
    throw new Error(`Unable to find message for code '${code}'.`)
  }

  return message(details)
}

// eslint-disable-next-line node/prefer-global/process
export const messageGenerator = process.env.NODE_ENV === 'production' ? fallback : generatorFunction
