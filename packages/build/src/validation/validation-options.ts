import type { GenerateSWOptions, SWType } from '../types'
import { errors } from './errors'

const DEFAULT_EXCLUDE_VALUE = [/\.map$/, /^manifest.*\.js$/]

export class WorkboxConfigError extends Error {
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
export function ensureValidNavigationPreloadConfig(
  options: GenerateSWOptions<SWType>,
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
  options: GenerateSWOptions<SWType>,
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
  options: GenerateSWOptions<SWType>,
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
