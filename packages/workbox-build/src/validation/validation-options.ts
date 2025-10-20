import type { GenerateSWOptions } from '../types'
import { errors } from './errors'

const DEFAULT_EXCLUDE_VALUE = [/\.map$/, /^manifest.*\.js$/]

export class WorkboxConfigError extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
export function ensureValidNavigationPreloadConfig(
  options: GenerateSWOptions,
): void {
  if (
    options.navigationPreload
    && (!Array.isArray(options.runtimeCaching)
      || options.runtimeCaching.length === 0)
  ) {
    throw new WorkboxConfigError(errors['nav-preload-runtime-caching'])
  }
}

export function ensureValidCacheExpiration(
  options: GenerateSWOptions,
): void {
  for (const runtimeCaching of options.runtimeCaching || []) {
    if (
      runtimeCaching.options?.expiration
      && !runtimeCaching.options?.cacheName
    ) {
      throw new WorkboxConfigError(errors['cache-name-required'])
    }
  }
}

export function ensureValidRuntimeCachingOrGlobDirectory(
  options: GenerateSWOptions,
): void {
  if (
    !options.globDirectory
    && (!Array.isArray(options.runtimeCaching)
      || options.runtimeCaching.length === 0)
  ) {
    throw new WorkboxConfigError(
      errors['no-manifest-entries-or-runtime-caching'],
    )
  }
}
