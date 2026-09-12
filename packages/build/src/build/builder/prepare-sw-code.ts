import type { GenerateSWOptions, GetManifestResult, SWType } from '../../types'
import { builders, generateCode, parseExpression, parseModule } from 'magicast'
import serialize from 'serialize-javascript'
import { generateManifestEntries } from '../../utils/generate-manifest-entries'

export interface InternalGetManifestResult extends GetManifestResult {
  swCode: string
}

export async function prepareSWCode<T extends SWType>(
  options: GenerateSWOptions<T>,
  globDirectory?: string,
): Promise<InternalGetManifestResult> {
  const swModule = parseModule('')

  const manifestEntries = await generateManifestEntries(options, globDirectory)

  const strategyImports = new Set<string>()
  if (options.runtimeCaching) {
    for (const entry of options.runtimeCaching) {
      if (typeof entry.handler === 'string') {
        strategyImports.add(capitalize(entry.handler))
      }
    }
  }

  if (manifestEntries.manifestEntries.length > 0) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/precaching', imported: 'precacheAndRoute' })
  }

  if (options.navigationPreload) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/navigation-preload', imported: 'enable' })
  }

  if (options.cacheId) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/core', imported: 'setCacheNameDetails' })
  }
  if (options.clientsClaim) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/core', imported: 'clientsClaim' })
  }
  if (options.skipWaiting) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/core', imported: 'skipWaiting' })
  }
  if (options.cleanupOutdatedCaches) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/precaching', imported: 'cleanupOutdatedCaches' })
  }

  const needsRegisterRoute = options.runtimeCaching?.length || options.navigateFallback
  if (needsRegisterRoute) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/routing', imported: 'registerRoute' })
  }

  if (options.navigateFallback) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/routing', imported: 'NavigationRoute' })
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/precaching', imported: 'createHandlerBoundToURL' })
  }

  if (options.runtimeCaching?.length) {
    if (strategyImports.size > 0) {
      for (const strategyImport of strategyImports) {
        swModule.imports.$append({
          from: '@vite-pwa/workbox-swkit/strategies',
          imported: strategyImport,
        })
      }
    }
  }

  const swCode: string[] = []

  if (options.navigationPreload) {
    swCode.push('enable()')
  }

  if (options.cacheId) {
    const call = builders.functionCall('setCacheNameDetails', { prefix: options.cacheId })
    swCode.push(generateCode(call).code)
  }

  if (options.skipWaiting) {
    swCode.push('self.skipWaiting()')
  }
  else {
    swCode.push(`self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})`)
  }

  if (options.clientsClaim) {
    swCode.push('clientsClaim()')
  }

  if (manifestEntries.manifestEntries.length > 0) {
    const precacheOptions: any = {}
    if (options.directoryIndex) {
      precacheOptions.directoryIndex = options.directoryIndex
    }
    if (options.ignoreURLParametersMatching) {
      precacheOptions.ignoreURLParametersMatching = options.ignoreURLParametersMatching
    }
    if (options.cleanURLs) {
      precacheOptions.cleanURLs = options.cleanURLs
    }
    if (options.urlManipulation) {
      precacheOptions.urlManipulation = parseExpression(serialize(options.urlManipulation, { unsafe: true }))
    }
    if (options.parallel) {
      precacheOptions.parallel = options.parallel
    }

    const precacheAndRoute = Object.keys(precacheOptions).length > 0
      ? builders.functionCall('precacheAndRoute', manifestEntries.manifestEntries, precacheOptions)
      : builders.functionCall('precacheAndRoute', manifestEntries.manifestEntries)

    swCode.push(generateCode(precacheAndRoute).code)
  }

  if (options.cleanupOutdatedCaches) {
    swCode.push('cleanupOutdatedCaches()')
  }

  if (options.navigateFallback) {
    const handler = builders.functionCall('createHandlerBoundToURL', options.navigateFallback)
    let newOptions: any
    if (options.navigateFallbackAllowlist || options.navigateFallbackDenylist) {
      newOptions = {}
      if (options.navigateFallbackAllowlist) {
        newOptions.allowlist = options.navigateFallbackAllowlist
      }
      if (options.navigateFallbackDenylist) {
        newOptions.denylist = options.navigateFallbackDenylist
      }
    }
    const navigationRoute = newOptions
      ? builders.newExpression('NavigationRoute', handler, newOptions)
      : builders.newExpression('NavigationRoute', handler)
    const registerRoute = builders.functionCall('registerRoute', navigationRoute)
    swCode.push(generateCode(registerRoute).code)
  }

  if (options.runtimeCaching) {
    swCode.push(...getRuntimeCachingEntries(options))
  }

  if (options.disableDevLogs) {
    swCode.push('self.__WB_DISABLE_DEV_LOGS = true')
  }

  const importsCode = generateCode(swModule.imports, {
    format: {
      tabWidth: 2,
      useTabs: false,
      quote: 'single',
      trailingComma: false,
      arrayBracketSpacing: false,
      objectCurlySpacing: false,
      arrowParensAlways: true,
      useSemi: false,
    },
  }).code

  return Object.assign({}, manifestEntries, {
    swCode: `${importsCode}\n\n${swCode.join('\n')}`,
  })
}

function capitalize(s: string, sanitize = false) {
  const value = s.charAt(0).toUpperCase() + s.slice(1)
  return sanitize ? value.replace(/['"]/g, '') : value
}

function getRuntimeCachingEntries<T extends SWType>(
  options: GenerateSWOptions<T>,
): string[] {
  const entries: string[] = []
  if (!options.runtimeCaching) {
    return entries
  }

  for (const entry of options.runtimeCaching) {
    let handlerNode: any

    if (typeof entry.handler === 'string') {
      const strategyName = capitalize(entry.handler, true)

      const args = entry.options ? [parseExpression(serialize(entry.options, { unsafe: true }))] : undefined
      handlerNode = args && args.length > 0
        ? builders.newExpression(strategyName, ...args)
        : builders.newExpression(strategyName)
    }
    else {
      handlerNode = parseExpression(serialize(entry.handler, { unsafe: true }))
    }

    let urlPatternNode: any
    if (typeof entry.urlPattern === 'string') {
      urlPatternNode = entry.urlPattern
    }
    else if (entry.urlPattern instanceof RegExp) {
      urlPatternNode = builders.newExpression('RegExp', entry.urlPattern.source, entry.urlPattern.flags)
    }
    else {
      urlPatternNode = parseExpression(serialize(entry.urlPattern, { unsafe: true }))
    }

    const routeCallArgs: any[] = [urlPatternNode, handlerNode]

    if (entry.method) {
      routeCallArgs.push(entry.method)
    }

    const routeCallNode = builders.functionCall(
      'registerRoute',
      ...routeCallArgs,
    )

    entries.push(generateCode(routeCallNode).code)
  }

  return entries
}
