import type { Node } from '@babel/types'
import * as v from 'valibot'

/**
 * Recursively infers the type of an AST expression node.
 * It does NOT evaluate the expression.
 */
function inferExpressionType(node: Node): 'number' | 'unknown' {
  switch (node.type) {
    case 'NumericLiteral':
      return 'number'
    case 'BinaryExpression': {
      // A binary expression is numeric only if both sides are numeric
      // and the operator is mathematical.
      const leftType = inferExpressionType(node.left)
      const rightType = inferExpressionType(node.right)
      if (leftType === 'number' && rightType === 'number') {
        if (['+', '-', '*', '/', '%'].includes(node.operator))
          return 'number'
      }
      return 'unknown'
    }
    default:
      return 'unknown'
  }
}

// ManifestEntry is used in additionalManifestEntries
export const AsyncManifestEntrySchema = v.strictObjectAsync({
  integrity: v.optionalAsync(v.string()),
  revision: v.nullable(v.string()),
  url: v.string(),
})

/**
 * A custom Valibot schema that accepts either a primitive number
 * or a magicast Proxy representing a numeric expression.
 */
export const AsyncNumericExpressionSchema = v.customAsync<number | object>(
  async (input) => {
    // Accept primitive numbers
    if (typeof input === 'number')
      return true
    // Accept magicast proxies
    if (typeof input === 'object' && input !== null && '$ast' in input) {
      // And statically validate that the expression will result in a number
      return inferExpressionType((input as any).$ast) === 'number'
    }
    return false
  },
  'invalid-number-entry-or-expression',
)

// Reused schema
export const AsyncCacheQueryOptionsSchema = v.strictObjectAsync({
  ignoreMethod: v.optionalAsync(v.boolean()),
  ignoreSearch: v.optionalAsync(v.boolean()),
  ignoreVary: v.optionalAsync(v.boolean()),
})

// Schema for the `options` property within a runtimeCaching entry.
// This allows us to attach cross-field validation rules to it.
export const AsyncRuntimeCachingOptionsSchema = v.strictObjectAsync({
  /**
   * Configuring this will add a workbox-background-sync.BackgroundSyncPlugin instance to the workbox-strategies configured in `handler`.
   */
  backgroundSync: v.optionalAsync(v.strictObjectAsync({
    name: v.string(),
    options: v.optionalAsync(v.strictObjectAsync({ // Inlined QueueOptionsSchema
      forceSyncFallback: v.optionalAsync(v.boolean()),
      maxRetentionTime: v.optionalAsync(AsyncNumericExpressionSchema),
      onSync: v.optionalAsync(v.function()),
    })),
  })),
  /**
   * Configuring this will add a workbox-broadcast-update.BroadcastUpdatePlugin instance to the workbox-strategies configured in `handler`.
   */
  broadcastUpdate: v.optionalAsync(v.strictObjectAsync({
    channelName: v.string(),
    options: v.strictObjectAsync({ // Inlined BroadcastCacheUpdateOptionsSchema
      headersToCheck: v.optionalAsync(v.arrayAsync(v.string())),
      generatePayload: v.optionalAsync(v.function()),
      notifyAllClients: v.optionalAsync(v.boolean()),
    }),
  })),
  /**
   * Configuring this will add a workbox-cacheable-response.CacheableResponsePlugin instance to the workbox-strategies configured in `handler`.
   */
  cacheableResponse: v.optionalAsync(v.strictObjectAsync({ // Inlined CacheableResponseOptionsSchema
    statuses: v.optionalAsync(v.arrayAsync(AsyncNumericExpressionSchema)),
    headers: v.optionalAsync(v.recordAsync(v.string(), v.string())),
  })),
  /**
   * If provided, this will set the `cacheName` property of the workbox-strategies configured in `handler`.
   */
  cacheName: v.optionalAsync(v.nullable(v.string())),
  /**
   * Configuring this will add a workbox-expiration.ExpirationPlugin instance to the workbox-strategies configured in `handler`.
   */
  expiration: v.optionalAsync(v.strictObjectAsync({ // Inlined ExpirationPluginOptionsSchema
    maxEntries: v.optionalAsync(AsyncNumericExpressionSchema),
    maxAgeSeconds: v.optionalAsync(AsyncNumericExpressionSchema),
    matchOptions: v.optionalAsync(AsyncCacheQueryOptionsSchema), // Reused
    purgeOnQuotaError: v.optionalAsync(v.boolean()),
  })),
  /**
   * If provided, this will set the `networkTimeoutSeconds` property of the workbox-strategies configured in `handler`. Note that only 'NetworkFirst' and 'NetworkOnly' support `networkTimeoutSeconds`.
   */
  networkTimeoutSeconds: v.optionalAsync(AsyncNumericExpressionSchema),
  /**
   * Configuring this allows the use of one or more Workbox plugins that don't have "shortcut" options (like `expiration` for workbox-expiration.ExpirationPlugin). The plugins provided here will be added to the workbox-strategies configured in `handler`.
   */
  plugins: v.optionalAsync(v.arrayAsync(v.strictObjectAsync({ // Inlined WorkboxPluginSchema
    cacheDidUpdate: v.optionalAsync(v.function()),
    cachedResponseWillBeUsed: v.optionalAsync(v.function()),
    cacheKeyWillBeUsed: v.optionalAsync(v.function()),
    cacheWillUpdate: v.optionalAsync(v.function()),
    fetchDidFail: v.optionalAsync(v.function()),
    fetchDidSucceed: v.optionalAsync(v.function()),
    handlerDidComplete: v.optionalAsync(v.function()),
    handlerDidError: v.optionalAsync(v.function()),
    handlerDidRespond: v.optionalAsync(v.function()),
    handlerWillRespond: v.optionalAsync(v.function()),
    handlerWillStart: v.optionalAsync(v.function()),
    requestWillFetch: v.optionalAsync(v.function()),
  }))),
  /**
   * Configuring this will add a workbox-precaching.PrecacheFallbackPlugin instance to the workbox-strategies configured in `handler`.
   */
  precacheFallback: v.optionalAsync(v.strictObjectAsync({ fallbackURL: v.string() })),
  /**
   * Enabling this will add a workbox-range-requests.RangeRequestsPlugin instance to the workbox-strategies configured in `handler`.
   */
  rangeRequests: v.optionalAsync(v.boolean()),
  /**
   * Configuring this will pass along the `fetchOptions` value to the workbox-strategies configured in `handler`.
   */
  fetchOptions: v.optionalAsync(v.any()), // RequestInit is too complex to define for now
  /**
   * Configuring this will pass along the `matchOptions` value to the workbox-strategies configured in `handler`.
   */
  matchOptions: v.optionalAsync(AsyncCacheQueryOptionsSchema), // Reused
})

// Schema for a single entry in the runtimeCaching array.
// It's a strict object to prevent unknown properties.
export const AsyncRuntimeCachingEntrySchema = v.strictObjectAsync({
  /**
   * This determines how the runtime route will generate a response.
   * To use one of the built-in workbox-strategies, provide its name, like 'NetworkFirst'.
   * Alternatively, this can be a workbox-core.RouteHandler callback function with custom response logic.
   */
  handler: v.unionAsync([
    v.function(), // RouteHandlerCallback
    v.strictObjectAsync({ handle: v.function() }), // Inlined RouteHandlerObjectSchema
    v.picklist([
      'CacheFirst',
      'CacheOnly',
      'NetworkFirst',
      'NetworkOnly',
      'StaleWhileRevalidate',
    ]),
  ]),
  /**
   * The HTTP method to match against. The default value of 'GET' is normally sufficient, unless you explicitly need to match 'POST', 'PUT', or another type of request.
   */
  method: v.optional(v.picklist([
    'DELETE',
    'GET',
    'HEAD',
    'PATCH',
    'POST',
    'PUT',
  ]), 'GET'),
  options: v.optionalAsync(AsyncRuntimeCachingOptionsSchema),
  /**
   * This match criteria determines whether the configured handler will generate a response for any requests that don't match one of the precached URLs. If multiple `RuntimeCaching` routes are defined, then the first one whose `urlPattern` matches will be the one that responds.
   * This value directly maps to the first parameter passed to workbox-routing.registerRoute. It's recommended to use a workbox-core.RouteMatchCallback function for greatest flexibility.
   */
  urlPattern: v.unionAsync([v.instance(RegExp), v.function(), v.string()]),
})

export const AsyncAdditionalManifestEntriesSchema = v.optionalAsync(v.arrayAsync(v.unionAsync([
  AsyncManifestEntrySchema,
  v.string(),
])))

export const AsyncGlobOptionsSchema = v.objectAsync({
  /**
   * This value can be used to determine the maximum size of files that will be
   * precached. This prevents you from inadvertently precaching very large files
   * that might have accidentally matched one of your patterns.
   * @default 2097152 (2MiB)
   */
  maximumFileSizeToCacheInBytes: v.optionalAsync(AsyncNumericExpressionSchema, 2097152),
  /**
   * Determines whether or not symlinks are followed when generating the
   * precache manifest. For more information, see the definition of `follow` in
   * the `glob` [documentation](https://github.com/isaacs/node-glob#options).
   */
  globFollow: v.optionalAsync(v.boolean(), true),
  /**
   * A set of patterns matching files to always exclude when generating the
   * precache manifest. For more information, see the definition of `ignore` in
   * the `glob` [documentation](https://github.com/isaacs/node-glob#options).
   */
  globIgnores: v.optionalAsync(v.arrayAsync(v.string()), ['**/node_modules/**/*']),
  /**
   * Files matching any of these patterns will be included in the precache
   * manifest. For more information, see the
   * [`glob` primer](https://github.com/isaacs/node-glob#glob-primer).
   */
  globPatterns: v.optionalAsync(v.arrayAsync(v.string()), ['**/*.{js,css,html}']),
  /**
   * If true, an error reading a directory when generating a precache manifest
   * will cause the build to fail. If false, the problematic directory will be
   * skipped. For more information, see the definition of `strict` in the `glob`
   * [documentation](https://github.com/isaacs/node-glob#options).
   */
  globStrict: v.optionalAsync(v.boolean(), true),
})

export const AsyncManifestOptionsSchema = v.strictObjectAsync({
  ...AsyncGlobOptionsSchema.entries,
  /**
   * A list of entries to be precached, in addition to any entries that are
   * generated as part of the build configuration.
   */
  additionalManifestEntries: AsyncAdditionalManifestEntriesSchema,
  /**
   * Assets that match this will be assumed to be uniquely versioned via their
   * URL, and exempted from the normal HTTP cache-busting that's done when
   * populating the precache. While not required, it's recommended that if your
   * existing build process already inserts a `[hash]` value into each filename,
   * you provide a RegExp that will detect that, as it will reduce the bandwidth
   * consumed when precaching.
   */
  dontCacheBustURLsMatching: v.optionalAsync(v.instance(RegExp)),
  /**
   * One or more functions which will be applied sequentially against the
   * generated manifest. If `modifyURLPrefix` or `dontCacheBustURLsMatching` are
   * also specified, their corresponding transformations will be applied first.
   */
  manifestTransforms: v.optionalAsync(v.arrayAsync(v.function())),
  /**
   * An object mapping string prefixes to replacement string values. This can be
   * used to, e.g., remove or add a path prefix from a manifest entry if your
   * web hosting setup doesn't match your local filesystem setup. As an
   * alternative with more flexibility, you can use the `manifestTransforms`
   * option and provide a function that modifies the entries in the manifest
   * using whatever logic you provide.
   */
  modifyURLPrefix: v.optionalAsync(v.recordAsync(v.string(), v.string())),
  /**
   * If a URL is rendered based on some server-side logic, its contents may
   * depend on multiple files or on some other unique string value. The keys in
   * this object are server-rendered URLs. If the values are an array of
   * strings, they will be interpreted as `glob` patterns, and the contents of
   * any files matching the patterns will be used to uniquely version the URL.
   * If used with a single string, it will be interpreted as unique versioning
   * information that you've generated for a given URL.
   */
  templatedURLs: v.optionalAsync(v.recordAsync(v.string(), v.unionAsync([v.arrayAsync(v.string()), v.string()]))),
})
