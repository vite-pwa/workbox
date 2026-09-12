import type {
  GlobPartial,
  RequiredSWDestPartial,
  SWTarget,
  SWTargets,
  SWType,
} from '../../types'
import type {
  BuildGenerateSWOptions,
  BuildSWOptions,
} from '../types'
import type {
  Bundler,
  OriginalEnvironmentData,
  ResolvedSWTargets,
} from './bundler-types'
import path from 'node:path'
import {
  resolveSWNames,
} from '../../utils/resolve-sw-names'

// hoist regexp
export const workboxRegex = [
  /@vite-pwa[\\/]workbox-swkit[\\/]/,
  /[\\/]packages[\\/]workbox[\\/]swkit[\\/]/,
].filter(Boolean)

// DON'T hoist Regexp used with /g via exec/test/split
const camelizeRegexp = /-([a-z0-9])/g

export const BundlerNames: Record<Bundler, string> = {
  vite: 'Vite',
  rolldown: 'Rolldown',
}

export function extractOriginalEnvironmentData<
  T extends SWType,
  Options extends BuildSWOptions<T> | BuildGenerateSWOptions<T>,
>(
  options: Options,
): OriginalEnvironmentData {
  const data = Object.assign({}, {
    mode: options.mode,
    baseUrl: options.baseUrl,
    envDir: options.envDir,
    envPrefix: options.envPrefix,
    define: options.define,
  }) as OriginalEnvironmentData

  if ('injectionPoint' in options) {
    data.injectionPoint = typeof options.injectionPoint === 'string' && options.injectionPoint ? options.injectionPoint : false
  }
  else {
    data.injectionPoint = 'self.__WB_MANIFEST'
  }

  return data
}

export function camelize(str: string): string {
  return str.replace(camelizeRegexp, (_, char) => char.toUpperCase())
}

/**
 * This method resolves the names for the SW source and destination files, as well as the globIgnores to exclude the
 * relevant files from the precache manifest.
 * @param options The options.
 * @param swSrc The service worker source file path.
 * @param generateSW if using generateSW strategy (or buildSW)
 */
export function resolveSWNamesAndGlobIgnores(
  options: GlobPartial & RequiredSWDestPartial,
  swSrc: string,
  generateSW: boolean,
) {
  const {
    newSWSrc,
    swChunkName,
    classicSWSrc,
    classicSWChunkName,
    classicSWDest,
    moduleSWSrc,
    moduleSWChunkName,
    moduleSWDest,
    prefix,
  } = resolveSWNames(options.swDest, swSrc, generateSW)

  // globIgnores is compared to cwd: globDirectory (tinyglobby), but the
  // *Dest paths in resolveSWNames are relative to process.cwd() with
  // `prefix` (destDist) in front. If swDest lives inside globDirectory
  // (normal case, single output directory), `prefix` matches
  // path.relative(cwd, globDirectory) + '/' and must be removed for
  // the ignore to match. The *Src paths (source code, outside the outDir)
  // do not have this prefix and are not touched.
  function stripPrefix(value: string): string {
    return prefix && value.startsWith(prefix) ? value.slice(prefix.length) : value
  }

  options.globIgnores ??= []
  if (generateSW) {
    options.globIgnores.push(stripPrefix(newSWSrc))
    options.globIgnores.push(stripPrefix(classicSWSrc))
    options.globIgnores.push(stripPrefix(moduleSWSrc))
  }
  else {
    options.globIgnores.push(swSrc)
    options.globIgnores.push(classicSWSrc)
    options.globIgnores.push(moduleSWSrc)
  }
  options.globIgnores.push(stripPrefix(options.swDest))
  options.globIgnores.push(`${stripPrefix(options.swDest)}.map`)
  options.globIgnores.push(stripPrefix(classicSWDest))
  options.globIgnores.push(`${stripPrefix(classicSWDest)}.map`)
  options.globIgnores.push(stripPrefix(moduleSWDest))
  options.globIgnores.push(`${stripPrefix(moduleSWDest)}.map`)
  options.globIgnores.push('**/workbox-*.js')
  options.globIgnores.push('**/workbox-*.js.map')
  options.globIgnores.push('**/.vite-pwa/sw-manifest*.json')

  return {
    swSrc: newSWSrc,
    swChunkName,
    swDest: options.swDest,
    classicSWSrc,
    classicSWChunkName,
    classicSWDest,
    moduleSWSrc,
    moduleSWChunkName,
    moduleSWDest,
    prefix,
  }
}

export function prepareSWTargets(target: SWTarget): ResolvedSWTargets {
  return typeof target === 'string' || Array.isArray(target)
    ? {
        classic: target,
        module: target,
      }
    : target
}

export function transformESMTargetToRolldown(swType: SWType, target: SWTargets): SWTargets {
  return swType === 'module' && target === 'baseline-widely-available'
    ? 'esnext'
    : target
}

type AsyncFlatten<T extends unknown[]> = T extends (infer U)[]
  ? Exclude<Awaited<U>, U[]>[]
  : never

export async function asyncFlatten<T extends unknown[]>(
  arr: T,
): Promise<AsyncFlatten<T>> {
  do {
    arr = (await Promise.all(arr)).flat(Infinity) as any
  } while (arr.some((v: any) => v?.then))
  return arr as unknown[] as AsyncFlatten<T>
}
