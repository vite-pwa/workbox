import * as v from 'valibot'
import {
  DEFAULT_MAXIMUM_FILE_SIZE_TO_CACHE_IN_BYTES,
  logLevel,
  rolldownLogLevel,
  viteLogLevel,
} from '../utils/constants'

interface BaseNode {
  type: string
}

interface NumericLiteral extends BaseNode {
  type: 'NumericLiteral'
  value: number
}

interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression'
  left: ExpressionNode
  right: ExpressionNode
  operator: string
}

// babel type: we don't need babel for this
type ExpressionNode = NumericLiteral | BinaryExpression | BaseNode

/**
 * Recursively infers the type of AST expression node.
 * It does NOT evaluate the expression.
 */
function inferExpressionType(node: ExpressionNode): 'number' | 'unknown' {
  switch (node.type) {
    case 'NumericLiteral':
      return 'number'
    case 'BinaryExpression': {
      const be = node as BinaryExpression
      // A binary expression is numeric only if both sides are numeric
      // and the operator is mathematical.
      const leftType = inferExpressionType(be.left)
      const rightType = inferExpressionType(be.right)
      if (leftType === 'number' && rightType === 'number') {
        if (['+', '-', '*', '/', '%'].includes(be.operator))
          return 'number'
      }
      return 'unknown'
    }
    default:
      return 'unknown'
  }
}

// ManifestEntry is used in additionalManifestEntries
export const ManifestEntrySchema = v.strictObject({
  integrity: v.optional(v.string()),
  revision: v.nullable(v.string()),
  url: v.string(),
})

export const SWTargetsSchema = v.union([
  v.string(),
  v.array(v.string()),
])

export const SWTargetSchema = v.optional(
  v.union([
    v.string(),
    v.array(v.string()),
    v.strictObject({
      classic: SWTargetsSchema,
      module: SWTargetsSchema,
    }),
  ]),
  {
    classic: ['chrome56', 'safari11', 'firefox60'],
    module: 'baseline-widely-available',
  },
)

/**
 * A custom Valibot schema that accepts either a primitive number
 * or a magicast Proxy representing a numeric expression.
 */
export const NumericExpressionSchema = v.custom<number | object>(
  (input) => {
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
export const CacheQueryOptionsSchema = v.strictObject({
  ignoreMethod: v.optional(v.boolean()),
  ignoreSearch: v.optional(v.boolean()),
  ignoreVary: v.optional(v.boolean()),
})

// Schema for the `options` property within a runtimeCaching entry.
// This allows us to attach cross-field validation rules to it.
export const RuntimeCachingOptionsSchema = v.strictObject({
  /**
   * Configuring this will add a workbox-background-sync.BackgroundSyncPlugin instance to the workbox-strategies configured in `handler`.
   */
  backgroundSync: v.optional(v.strictObject({
    name: v.string(),
    options: v.optional(v.strictObject({ // Inlined QueueOptionsSchema
      forceSyncFallback: v.optional(v.boolean()),
      maxRetentionTime: v.optional(NumericExpressionSchema),
      onSync: v.optional(v.function()),
    })),
  })),
  /**
   * Configuring this will add a workbox-broadcast-update.BroadcastUpdatePlugin instance to the workbox-strategies configured in `handler`.
   */
  broadcastUpdate: v.optional(v.strictObject({
    options: v.strictObject({ // Inlined BroadcastCacheUpdateOptionsSchema
      headersToCheck: v.optional(v.array(v.string())),
      generatePayload: v.optional(v.function()),
      notifyAllClients: v.optional(v.boolean()),
    }),
  })),
  /**
   * Configuring this will add a workbox-cacheable-response.CacheableResponsePlugin instance to the workbox-strategies configured in `handler`.
   */
  cacheableResponse: v.optional(v.strictObject({ // Inlined CacheableResponseOptionsSchema
    statuses: v.optional(v.array(NumericExpressionSchema)),
    headers: v.optional(v.record(v.string(), v.string())),
  })),
  /**
   * If provided, this will set the `cacheName` property of the workbox-strategies configured in `handler`.
   */
  cacheName: v.optional(v.nullable(v.string())),
  /**
   * Configuring this will add a workbox-expiration.ExpirationPlugin instance to the workbox-strategies configured in `handler`.
   */
  expiration: v.optional(v.strictObject({ // Inlined ExpirationPluginOptionsSchema
    maxEntries: v.optional(NumericExpressionSchema),
    maxAgeSeconds: v.optional(NumericExpressionSchema),
    matchOptions: v.optional(CacheQueryOptionsSchema), // Reused
    purgeOnQuotaError: v.optional(v.boolean()),
  })),
  /**
   * If provided, this will set the `networkTimeoutSeconds` property of the workbox-strategies configured in `handler`. Note that only 'NetworkFirst' and 'NetworkOnly' support `networkTimeoutSeconds`.
   */
  networkTimeoutSeconds: v.optional(NumericExpressionSchema),
  /**
   * Configuring this allows the use of one or more Workbox plugins that don't have "shortcut" options (like `expiration` for workbox-expiration.ExpirationPlugin). The plugins provided here will be added to the workbox-strategies configured in `handler`.
   */
  plugins: v.optional(v.array(v.strictObject({ // Inlined WorkboxPluginSchema
    cacheDidUpdate: v.optional(v.function()),
    cachedResponseWillBeUsed: v.optional(v.function()),
    cacheKeyWillBeUsed: v.optional(v.function()),
    cacheWillUpdate: v.optional(v.function()),
    fetchDidFail: v.optional(v.function()),
    fetchDidSucceed: v.optional(v.function()),
    handlerDidComplete: v.optional(v.function()),
    handlerDidError: v.optional(v.function()),
    handlerDidRespond: v.optional(v.function()),
    handlerWillRespond: v.optional(v.function()),
    handlerWillStart: v.optional(v.function()),
    requestWillFetch: v.optional(v.function()),
  }))),
  /**
   * Configuring this will add a workbox-precaching.PrecacheFallbackPlugin instance to the workbox-strategies configured in `handler`.
   */
  precacheFallback: v.optional(v.strictObject({ fallbackURL: v.string() })),
  /**
   * Enabling this will add a workbox-range-requests.RangeRequestsPlugin instance to the workbox-strategies configured in `handler`.
   */
  rangeRequests: v.optional(v.boolean()),
  /**
   * Configuring this will pass along the `fetchOptions` value to the workbox-strategies configured in `handler`.
   */
  fetchOptions: v.optional(v.any()), // RequestInit is too complex to define for now
  /**
   * Configuring this will pass along the `matchOptions` value to the workbox-strategies configured in `handler`.
   */
  matchOptions: v.optional(CacheQueryOptionsSchema), // Reused
})

// Schema for a single entry in the runtimeCaching array.
// It's a strict object to prevent unknown properties.
export const RuntimeCachingEntrySchema = v.strictObject({
  /**
   * This determines how the runtime route will generate a response.
   * To use one of the built-in workbox-strategies, provide its name, like 'NetworkFirst'.
   * Alternatively, this can be a workbox-core.RouteHandler callback function with custom response logic.
   */
  handler: v.union([
    v.function(), // RouteHandlerCallback
    v.strictObject({ handle: v.function() }), // Inlined RouteHandlerObjectSchema
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
  options: v.optional(RuntimeCachingOptionsSchema),
  /**
   * This match criteria determines whether the configured handler will generate a response for any requests that don't match one of the precached URLs. If multiple `RuntimeCaching` routes are defined, then the first one whose `urlPattern` matches will be the one that responds.
   * This value directly maps to the first parameter passed to workbox-routing.registerRoute. It's recommended to use a workbox-core.RouteMatchCallback function for greatest flexibility.
   */
  urlPattern: v.union([v.instance(RegExp), v.function(), v.string()]),
})

export const AdditionalManifestEntriesSchema = v.optional(v.array(v.union([
  ManifestEntrySchema,
  v.string(),
])))

export const GlobOptionsSchema = v.object({
  /**
   * This value can be used to determine the maximum size of files that will be
   * precached. This prevents you from inadvertently precaching very large files
   * that might have accidentally matched one of your patterns.
   * @default 2097152 (2MiB)
   */
  maximumFileSizeToCacheInBytes: v.optional(NumericExpressionSchema, DEFAULT_MAXIMUM_FILE_SIZE_TO_CACHE_IN_BYTES),
  /**
   * Should `maximumFileSizeToCacheInBytes` exceeded throw an error?.
   * @default true
   */
  throwMaximumFileSizeToCacheInBytes: v.optional(v.boolean(), true),
  /**
   * Determines whether or not symlinks are followed when generating the
   * precache manifest. For more information, see the definition of `followSymbolicLinks`
   * in the `glob` [documentation](https://superchupu.dev/tinyglobby).
   * @default true
   */
  globFollow: v.optional(v.boolean(), true),
  /**
   * Files matching any of these patterns will be included in the precache
   * manifest. For more information, see the
   * [tinyglobby](https://superchupu.dev/tinyglobby).
   */
  globPatterns: v.optional(v.array(v.string()), ['**/*.{js,css,html}']),
  /**
   * A set of patterns matching files to always exclude when generating the
   * precache manifest. For more information, see the definition of `ignore` in
   * the `glob` [documentation](https://superchupu.dev/tinyglobby).
   */
  globIgnores: v.optional(v.array(v.string()), ['**/node_modules/**/*']),
  /**
   * If true, an error reading a directory when generating a precache manifest
   * will cause the build to fail. If false, the problematic directory will be
   * skipped. For more information, see the definition of `strict` in the `glob`
   * [documentation](https://superchupu.dev/tinyglobby).
   * @default true
   */
  globStrict: v.optional(v.boolean(), true),
})

export const ManifestOptionsSchema = v.strictObject({
  ...GlobOptionsSchema.entries,
  /**
   * A list of entries to be precached, in addition to any entries that are
   * generated as part of the build configuration.
   */
  additionalManifestEntries: AdditionalManifestEntriesSchema,
  /**
   * Async generator that yields additional entries to be preached
   */
  additionalManifestEntriesGenerator: v.optional(v.function()),
  /**
   * Assets that match this will be assumed to be uniquely versioned via their
   * URL, and exempted from the normal HTTP cache-busting that's done when
   * populating the pre-cache. While not required, it's recommended that if your
   * existing build process already inserts a `[hash]` value into each filename,
   * you provide a RegExp that will detect that, as it will reduce the bandwidth
   * consumed when precaching.
   */
  dontCacheBustURLsMatching: v.optional(v.instance(RegExp)),
  /**
   * One or more functions which will be applied sequentially against the
   * generated manifest. If `modifyURLPrefix` or `dontCacheBustURLsMatching` are
   * also specified, their corresponding transformations will be applied first.
   */
  manifestTransforms: v.optional(v.array(v.function())),
  /**
   * An object mapping string prefixes to replacement string values. This can be
   * used to, e.g., remove or add a path prefix from a manifest entry if your
   * web hosting setup doesn't match your local filesystem setup. As an
   * alternative with more flexibility, you can use the `manifestTransforms`
   * option and provide a function that modifies the entries in the manifest
   * using whatever logic you provide.
   */
  modifyURLPrefix: v.optional(v.record(v.string(), v.string())),
  /**
   * When true, throw an error listing all duplicate precache entry URLs.
   * @default false
   */
  failOnDuplicateManifestEntries: v.optional(v.boolean(), false),
  /**
   * If a URL is rendered based on some server-side logic, its contents may
   * depend on multiple files or on some other unique string value. The keys in
   * this object are server-rendered URLs. If the values are an array of
   * strings, they will be interpreted as `glob` patterns, and the contents of
   * any files matching the patterns will be used to uniquely version the URL.
   * If used with a single string, it will be interpreted as unique versioning
   * information that you've generated for a given URL.
   */
  templatedURLs: v.optional(v.record(v.string(), v.union([v.array(v.string()), v.string()]))),
})

export const BundlerLogLevelSchema = v.optional(
  v.object({
    rolldown: v.optional(v.picklist(rolldownLogLevel), 'warn'),
    vite: v.optional(v.picklist(viteLogLevel), 'warn'),
  }),
  { rolldown: 'warn', vite: 'warn' },
)

export const BundlerDataSchema = v.object({
  logLevel: v.optional(
    v.picklist(logLevel),
    'info',
  ),
  bundlerLogLevel: BundlerLogLevelSchema,
  /**
   * If set to 'production', then an optimized service worker bundle that excludes debugging info will be produced. If not explicitly configured here, the `process.env.NODE_ENV` value will be used, and failing that, it will fall back to `'production'`.
   */
  mode: v.optional(v.nullable(v.string()), 'production'),
  /**
   * Base url.
   * @default '/'
   */
  baseUrl: v.optional(v.string(), '/'),
  // Specific optional fields
  define: v.optional(v.record(v.string(), v.any())),
  /**
   * The directory from which .env files are loaded.
   * @default 'root'
   */
  envDir: v.optional(v.union([v.string(), v.literal(false)]), 'root'),
  /**
   * Env variables starting with this prefix will be exposed to your client code.
   * @default 'VITE_'
   */
  envPrefix: v.optional(v.union([v.string(), v.array(v.string())]), 'VITE_'),
  plugins: v.optional(v.any()),
  /**
   * Specifies the separator style used for code splitting chunk names, assets, and entries.
   * By default, Vite and Rolldown use the `dash (-)` separator:
   * - chunkFileNames: `[name]-[hash].js`
   * - assetFileNames: `[name]-[hash].[ext]`
   * - entryFileNames: `[name]-[hash].js` (Note: The main Service Worker entry won't include the `-[hash]`)
   *
   * Switching to `dot (.)` makes it easier to programmatically extract the `[hash]` from the filename
   * (e.g., in backend environments). Enabling this changes the naming patterns to:
   * - chunkFileNames: `[name].[hash].js`
   * - assetFileNames: `[name].[hash].[ext]`
   * - entryFileNames: `[name].[hash].js` (Note: The main Service Worker entry won't include the `.[hash]`)
   *
   * @default 'dash'
   */
  chunkNames: v.optional(
    v.picklist(['dash', 'dot']),
    'dash',
  ),
  /**
   * Enables the generation of the build manifest specifically for the Service Worker structure.
   *
   * The manifest naming follows the same architectural strategy as the Service Worker assets:
   * - `sw-manifest.json`: When using a single Service Worker strategy or when `workboxRuntimeCompatible` is enabled.
   * - `sw-manifest-classic.json`: When using a dual Service Worker build for the classic variant, or when `workboxRuntimeCompatible` is disabled.
   * - `sw-manifest-module.json`: When using a dual Service Worker build for the module variant, or when `workboxRuntimeCompatible` is disabled.
   *
   * The generated files will be emitted to the `.vite-pwa` subfolder within the build output directory,
   * matching Vite's standard manifest structure (containing only `file`, `name`, `src`, `isEntry`, and `imports`).
   *
   * @see https://vite.dev/guide/backend-integration.html
   * @default false
   */
  manifest: v.optional(v.boolean(), false),
})
