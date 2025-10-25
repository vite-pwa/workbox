/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { MapLikeObject } from '../types'
import { WorkboxError } from './WorkboxError'

/*
 * This method throws if the supplied value is not an array.
 * The destructed values are required to produce a meaningful error for users.
 * The destructed and restructured object is so it's clear what is
 * needed.
 */
function isArray(value: any[], details: MapLikeObject) {
  if (!Array.isArray(value)) {
    throw new WorkboxError('not-an-array', details)
  }
}

function hasMethod(object: MapLikeObject, expectedMethod: string, details: MapLikeObject) {
  const type = typeof object[expectedMethod]
  if (type !== 'function') {
    details.expectedMethod = expectedMethod
    throw new WorkboxError('missing-a-method', details)
  }
}

function isType(object: unknown, expectedType: string, details: MapLikeObject) {
  // eslint-disable-next-line valid-typeof
  if (typeof object !== expectedType) {
    details.expectedType = expectedType
    throw new WorkboxError('incorrect-type', details)
  }
}

function isInstance(object: unknown,
  // Need the general type to do the check later.
  // eslint-disable-next-line ts/no-unsafe-function-type
  expectedClass: Function, details: MapLikeObject) {
  if (!(object instanceof expectedClass)) {
    details.expectedClassName = expectedClass.name
    throw new WorkboxError('incorrect-class', details)
  }
}

function isOneOf(value: any, validValues: any[], details: MapLikeObject) {
  if (!validValues.includes(value)) {
    details.validValueDescription = `Valid values are ${JSON.stringify(
      validValues,
    )}.`
    throw new WorkboxError('invalid-value', details)
  }
}

function isArrayOfClass(
  value: any,
  // Need general type to do check later.
  // eslint-disable-next-line ts/no-unsafe-function-type
  expectedClass: Function,
  details: MapLikeObject,
) {
  const error = new WorkboxError('not-array-of-class', details)
  if (!Array.isArray(value)) {
    throw error
  }

  for (const item of value) {
    if (!(item instanceof expectedClass)) {
      throw error
    }
  }
}

const finalAssertExports
// eslint-disable-next-line node/prefer-global/process
  = process.env.NODE_ENV === 'production'
    ? null
    : {
        hasMethod,
        isArray,
        isInstance,
        isOneOf,
        isType,
        isArrayOfClass,
      }

export { finalAssertExports as assert }
