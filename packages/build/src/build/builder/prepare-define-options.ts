import type {
  Bundler,
  RolldownOptions,
} from './bundler-types'
import path from 'node:path'
import process from 'node:process'
import { loadEnv, resolveEnvPrefix } from './env'

/**
 * This is a simplified version of Vite logic using:
 * - [resolved configuration logic](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/config.ts) and
 * - [definePlugin](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/define.ts)
 *
 * @param options The Rolldown options to use.
 */
export async function prepareDefineOptions<T extends Bundler>(
  options: RolldownOptions<T>,
): Promise<Record<string, string>> {
  // 1. Extract original environment data captured from the consumer
  const original = options.originalEnvironmentData

  // 2. Initial Mode and NODE_ENV resolution
  // Vite sets NODE_ENV based on the mode if not present in the process
  const mode = options.mode || original.mode || 'production'

  // Use a local variable to avoid mutating the global process.env
  let resolvedNodeEnv = process.env.NODE_ENV || mode

  // 3. envDir normalization (following Vite's resolveConfig logic)
  const envDir = original.envDir !== false
    ? path.resolve(process.cwd(), original.envDir || options.envDir || '.')
    : false

  const envPrefix = original.envPrefix ?? options.envPrefix ?? 'VITE_'

  // 4. Load .env files using your internal loadEnv
  let userEnv: Record<string, string> = {}
  if (envDir !== false) {
    const resolvedPrefixes = resolveEnvPrefix(envPrefix)
    userEnv = loadEnv(mode, envDir, resolvedPrefixes)
  }

  // 5. Handle VITE_USER_NODE_ENV (Vite's staging/custom mode logic)
  // If the loaded .env has VITE_USER_NODE_ENV=development, we force NODE_ENV
  const isNodeEnvSet = !!process.env.NODE_ENV
  const userNodeEnv = userEnv.VITE_USER_NODE_ENV || process.env.VITE_USER_NODE_ENV
  if (!isNodeEnvSet && userNodeEnv === 'development') {
    resolvedNodeEnv = 'development'
  }

  const isProduction = resolvedNodeEnv === 'production'

  // 6. Build the ENV object (Equivalent to resolved.env in Vite)
  const builtInEnv = {
    MODE: mode,
    DEV: !isProduction,
    PROD: isProduction,
    SSR: false,
    BASE_URL: original.baseUrl || '/',
  }

  const mergedEnv = Object.assign({}, builtInEnv, userEnv)

  // 7. Prepare the final DEFINE object
  const define: Record<string, any> = {
    // Process.env.NODE_ENV replacements (matching Vite's definePlugin)
    'process.env.NODE_ENV': JSON.stringify(resolvedNodeEnv),
    'global.process.env.NODE_ENV': JSON.stringify(resolvedNodeEnv),
    'globalThis.process.env.NODE_ENV': JSON.stringify(resolvedNodeEnv),
  }

  // 8. Static individual replacements for import.meta.env.KEY
  for (const [key, value] of Object.entries(mergedEnv)) {
    define[`import.meta.env.${key}`] = JSON.stringify(value)
  }

  // 9. Full object replacement for import.meta.env
  define['import.meta.env'] = JSON.stringify(mergedEnv)

  // 10. Apply User-Specific Defines (Last word)
  // We prioritize: User Define > User Env (.env) > Built-in Env
  if (original.define) {
    for (const [key, value] of Object.entries(original.define)) {
      // If it's already a string that looks serialized, keep it; otherwise, stringify.
      define[key] = typeof value === 'string' && (value.startsWith('"') || value.startsWith('\''))
        ? value
        : JSON.stringify(value)
    }
  }

  if (!options.generateSW) {
    if ('injectionPoint' in original) {
      const userInjectionPoint = original.injectionPoint

      if (typeof userInjectionPoint === 'string' && userInjectionPoint) {
        define[userInjectionPoint] = JSON.stringify(options.manifestEntries)
      }
      else {
        define['self.__WB_MANIFEST'] = JSON.stringify('undefined')
      }
    }
    else {
      define['self.__WB_MANIFEST'] = JSON.stringify(options.manifestEntries)
    }
  }
  else {
    define['self.__WB_MANIFEST'] = JSON.stringify('undefined')
  }

  return define
}
