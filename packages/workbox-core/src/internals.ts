import { assert } from './_private/assert'
import { cacheMatchIgnoreParams } from './_private/cacheMatchIgnoreParams'
import { cacheNames as privateCacheNames } from './_private/cacheNames'
import { canConstructReadableStream } from './_private/canConstructReadableStream'
import { canConstructResponseFromBodyStream } from './_private/canConstructResponseFromBodyStream'
import { Deferred } from './_private/Deferred'
import { dontWaitFor } from './_private/dontWaitFor'
import { executeQuotaErrorCallbacks } from './_private/executeQuotaErrorCallbacks'
import { getFriendlyURL } from './_private/getFriendlyURL'
import { logger } from './_private/logger'
import { resultingClientExists } from './_private/resultingClientExists'
import { timeout } from './_private/timeout'
import { waitUntil } from './_private/waitUntil'
import { WorkboxError } from './_private/WorkboxError'

// Workbox's internal functions, classes, variables, and more. Feel free to use them,
// but they are not documented. Note: they do follow semver.
export {
  assert,
  cacheMatchIgnoreParams,
  canConstructReadableStream,
  canConstructResponseFromBodyStream,
  Deferred,
  dontWaitFor,
  executeQuotaErrorCallbacks,
  getFriendlyURL,
  logger,
  privateCacheNames,
  resultingClientExists,
  timeout,
  waitUntil,
  WorkboxError,
}
