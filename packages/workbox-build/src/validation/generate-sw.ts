import * as v from 'valibot'
import { errors } from './errors'
import { NumericExpressionSchema } from './utils'

// Reused schema
const CacheQueryOptionsSchema = v.strictObject({
  ignoreMethod: v.optional(v.boolean()),
  ignoreSearch: v.optional(v.boolean()),
  ignoreVary: v.optional(v.boolean()),
})

/*
export const GenerateSWOptionsSchema = v.pipe(
  v.strictObject({
    /!**
     * A list of entries to be precached, in addition to any entries that are generated as part of the build configuration.
     *!/
    additionalManifestEntries: v.optional(v.array(v.union([
      v.object({ // Inlined ManifestEntrySchema
        integrity: v.optional(v.string()),
        revision: v.nullable(v.string()),
        url: v.string(),
      }),
      v.string(),
    ]))),
    /!**
     * Assets that match this will be assumed to be uniquely versioned via their URL, and exempted from the normal HTTP cache-busting that's done when populating the precache. While not required, it's recommended that if your existing build process already inserts a `[hash]` value into each filename, you provide a RegExp that will detect that, as it will reduce the bandwidth consumed when precaching.
     *!/
    dontCacheBustURLsMatching: v.optional(v.instance(RegExp)),
    /!**
     * One or more functions which will be applied sequentially against the generated manifest. If `modifyURLPrefix` or `dontCacheBustURLsMatching` are also specified, their corresponding transformations will be applied first.
     *!/
    manifestTransforms: v.optional(v.array(v.function())),
    /!**
     * This value can be used to determine the maximum size of files that will be precached. This prevents you from inadvertently precaching very large files that might have accidentally matched one of your patterns.
     *!/
    maximumFileSizeToCacheInBytes: v.optional(v.number(), 2097152),
    /!**
     * An object mapping string prefixes to replacement string values. This can be used to, e.g., remove or add a path prefix from a manifest entry if your web hosting setup doesn't match your local filesystem setup. As an alternative with more flexibility, you can use the `manifestTransforms` option and provide a function that modifies the entries in the manifest using whatever logic you provide.
     *!/
    modifyURLPrefix: v.optional(v.record(v.string(), v.string())),
    /!**
     * Determines whether or not symlinks are followed when generating the precache manifest. For more information, see the definition of `follow` in the `glob` [documentation](https://github.com/isaacs/node-glob#options).
     *!/
    globFollow: v.optional(v.boolean(), true),
    /!**
     * A set of patterns matching files to always exclude when generating the precache manifest. For more information, see the definition of `ignore` in the `glob` [documentation](https://github.com/isaacs/node-glob#options).
     *!/
    globIgnores: v.optional(v.array(v.string()), ['**!/node_modules/!**!/!*']),
    /!**
     * Files matching any of these patterns will be included in the precache manifest. For more information, see the
     * [`glob` primer](https://github.com/isaacs/node-glob#glob-primer).
     *!/
    globPatterns: v.optional(v.array(v.string()), ['**!/!*.{js,css,html}']),
    /!**
     * If true, an error reading a directory when generating a precache manifest will cause the build to fail. If false, the problematic directory will be skipped. For more information, see the definition of `strict` in the `glob` [documentation](https://github.com/isaacs/node-glob#options).
     *!/
    globStrict: v.optional(v.boolean(), true),
    /!**
     * If a URL is rendered based on some server-side logic, its contents may depend on multiple files or on some other unique string value. The keys in this object are server-rendered URLs. If the values are an array of strings, they will be interpreted as `glob` patterns, and the contents of any files matching the patterns will be used to uniquely version the URL. If used with a single string, it will be interpreted as unique versioning information that you've generated for a given URL.
     *!/
    templatedURLs: v.optional(v.record(v.string(), v.union([v.array(v.string()), v.string()]))),
    /!**
     * The [targets](https://babeljs.io/docs/en/babel-preset-env#targets) to pass to `babel-preset-env` when transpiling the service worker bundle.
     *!/
    babelPresetEnvTargets: v.optional(v.array(v.string()), ['chrome >= 56']),
    /!**
     * An optional ID to be prepended to cache names. This is primarily useful for local development where multiple sites may be served from the same `http://localhost:port` origin.
     *!/
    cacheId: v.optional(v.nullable(v.string())),
    /!**
     * Whether or not Workbox should attempt to identify and delete any precaches created by older, incompatible versions.
     *!/
    cleanupOutdatedCaches: v.optional(v.boolean(), false),
    /!**
     * Whether or not the service worker should [start controlling](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#clientsclaim) any existing clients as soon as it activates.
     *!/
    clientsClaim: v.optional(v.boolean(), false),
    /!**
     * If a navigation request for a URL ending in `/` fails to match a precached URL, this value will be appended to the URL and that will be checked for a precache match. This should be set to what your web server is using for its directory index.
     *!/
    directoryIndex: v.optional(v.nullable(v.string())),
    disableDevLogs: v.optional(v.boolean(), false),
    /!**
     * Any search parameter names that match against one of the RegExp in this array will be removed before looking for a precache match. This is useful if your users might request URLs that contain, for example, URL parameters used to track the source of the traffic. If not provided, the default value is `[/^utm_/, /^fbclid$/]`.
     *!/
    ignoreURLParametersMatching: v.optional(v.array(v.instance(RegExp))),
    /!**
     * A list of JavaScript files that should be passed to [`importScripts()`](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts) inside the generated service worker file. This is useful when you want to let Workbox create your top-level service worker file, but want to include some additional code, such as a push event listener.
     *!/
    importScripts: v.optional(v.array(v.string())),
    /!**
     * Whether the runtime code for the Workbox library should be included in the top-level service worker, or split into a separate file that needs to be deployed alongside the service worker. Keeping the runtime separate means that users will not have to re-download the Workbox code each time your top-level service worker changes.
     *!/
    inlineWorkboxRuntime: v.optional(v.boolean(), false),
    /!**
     * If set to 'production', then an optimized service worker bundle that excludes debugging info will be produced. If not explicitly configured here, the `process.env.NODE_ENV` value will be used, and failing that, it will fall back to `'production'`.
     *!/
    mode: v.optional(v.nullable(v.string()), 'production'),
    /!**
     * If specified, all [navigation requests](https://developers.google.com/web/fundamentals/primers/service-workers/high-performance-loading#first_what_are_navigation_requests) for URLs that aren't precached will be fulfilled with the HTML at the URL provided. You must pass in the URL of an HTML document that is listed in your precache manifest. This is meant to be used in a Single Page App scenario, in which you want all navigations to use common [App Shell HTML](https://developers.google.com/web/fundamentals/architecture/app-shell).
     *!/
    navigateFallback: v.optional(v.nullable(v.string()), null),
    /!**
     * An optional array of regular expressions that restricts which URLs the configured `navigateFallback` behavior applies to. This is useful if only a subset of your site's URLs should be treated as being part of a [Single Page App](https://en.wikipedia.org/wiki/Single-page_application). If both `navigateFallbackDenylist` and `navigateFallbackAllowlist` are configured, the denylist takes precedent.
     *!/
    navigateFallbackAllowlist: v.optional(v.array(v.instance(RegExp))),
    /!**
     * An optional array of regular expressions that restricts which URLs the configured `navigateFallback` behavior applies to. This is useful if only a subset of your site's URLs should be treated as being part of a [Single Page App](https://en.wikipedia.org/wiki/Single-page_application). If both `navigateFallbackDenylist` and `navigateFallbackAllowlist` are configured, the denylist takes precedent.
     *!/
    navigateFallbackDenylist: v.optional(v.array(v.instance(RegExp))),
    /!**
     * Whether or not to enable [navigation preload](https://developers.google.com/web/tools/workbox/modules/workbox-navigation-preload) in the generated service worker. When set to true, you must also use `runtimeCaching` to set up an appropriate response strategy that will match navigation requests, and make use of the preloaded response.
     *!/
    navigationPreload: v.optional(v.boolean(), false),
    /!**
     * Controls whether or not to include support for [offline Google Analytics](https://developers.google.com/web/tools/workbox/guides/enable-offline-analytics). When `true`, the call to `workbox-google-analytics`'s `initialize()` will be added to your generated service worker. When set to an `Object`, that object will be passed in to the `initialize()` call, allowing you to customize the behavior.
     *!/
    /!* offlineGoogleAnalytics: v.optional(v.union([
      v.object({ // Inlined GoogleAnalyticsInitializeOptionsSchema
        cacheName: v.optional(v.string()),
        parameterOverrides: v.optional(v.record(v.string(), v.string())),
        hitFilter: v.optional(v.function()),
      }),
      v.boolean(),
    ]), false), *!/
    /!**
     * When using Workbox's build tools to generate your service worker, you can specify one or more runtime caching configurations. These are then translated to {@link workbox-routing.registerRoute} calls using the match and handler configuration you define.
     *!/
    runtimeCaching: v.optional(v.array(v.object({
      /!**
       * This determines how the runtime route will generate a response.
       * To use one of the built-in workbox-strategies, provide its name, like 'NetworkFirst'.
       * Alternatively, this can be a workbox-core.RouteHandler callback function with custom response logic.
       *!/
      handler: v.union([
        v.function(), // RouteHandlerCallback
        v.object({ handle: v.function() }), // Inlined RouteHandlerObjectSchema
        v.picklist([
          'CacheFirst',
          'CacheOnly',
          'NetworkFirst',
          'NetworkOnly',
          'StaleWhileRevalidate',
        ]),
      ]),
      /!**
       * The HTTP method to match against. The default value of 'GET' is normally sufficient, unless you explicitly need to match 'POST', 'PUT', or another type of request.
       *!/
      method: v.optional(v.picklist([
        'DELETE',
        'GET',
        'HEAD',
        'PATCH',
        'POST',
        'PUT',
      ]), 'GET'),
      options: v.optional(v.object({
        /!**
         * Configuring this will add a workbox-background-sync.BackgroundSyncPlugin instance to the workbox-strategies configured in `handler`.
         *!/
        backgroundSync: v.optional(v.object({
          name: v.string(),
          options: v.optional(v.object({ // Inlined QueueOptionsSchema
            forceSyncFallback: v.optional(v.boolean()),
            maxRetentionTime: v.optional(v.number()),
            onSync: v.optional(v.function()),
          })),
        })),
        /!**
         * Configuring this will add a workbox-broadcast-update.BroadcastUpdatePlugin instance to the workbox-strategies configured in `handler`.
         *!/
        broadcastUpdate: v.optional(v.object({
          channelName: v.string(),
          options: v.object({ // Inlined BroadcastCacheUpdateOptionsSchema
            headersToCheck: v.optional(v.array(v.string())),
            generatePayload: v.optional(v.function()),
            notifyAllClients: v.optional(v.boolean()),
          }),
        })),
        /!**
         * Configuring this will add a workbox-cacheable-response.CacheableResponsePlugin instance to the workbox-strategies configured in `handler`.
         *!/
        cacheableResponse: v.optional(v.object({ // Inlined CacheableResponseOptionsSchema
          statuses: v.optional(v.array(v.number())),
          headers: v.optional(v.record(v.string(), v.string())),
        })),
        /!**
         * If provided, this will set the `cacheName` property of the workbox-strategies configured in `handler`.
         *!/
        cacheName: v.optional(v.nullable(v.string())),
        /!**
         * Configuring this will add a workbox-expiration.ExpirationPlugin instance to the workbox-strategies configured in `handler`.
         *!/
        expiration: v.optional(v.object({ // Inlined ExpirationPluginOptionsSchema
          maxEntries: v.optional(v.number()),
          maxAgeSeconds: v.optional(v.number()),
          matchOptions: v.optional(CacheQueryOptionsSchema), // Reused
          purgeOnQuotaError: v.optional(v.boolean()),
        })),
        /!**
         * If provided, this will set the `networkTimeoutSeconds` property of the workbox-strategies configured in `handler`. Note that only 'NetworkFirst' and 'NetworkOnly' support `networkTimeoutSeconds`.
         *!/
        networkTimeoutSeconds: v.optional(v.number()),
        /!**
         * Configuring this allows the use of one or more Workbox plugins that don't have "shortcut" options (like `expiration` for workbox-expiration.ExpirationPlugin). The plugins provided here will be added to the workbox-strategies configured in `handler`.
         *!/
        plugins: v.optional(v.array(v.object({ // Inlined WorkboxPluginSchema
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
        /!**
         * Configuring this will add a workbox-precaching.PrecacheFallbackPlugin instance to the workbox-strategies configured in `handler`.
         *!/
        precacheFallback: v.optional(v.object({ fallbackURL: v.string() })),
        /!**
         * Enabling this will add a workbox-range-requests.RangeRequestsPlugin instance to the workbox-strategies configured in `handler`.
         *!/
        rangeRequests: v.optional(v.boolean()),
        /!**
         * Configuring this will pass along the `fetchOptions` value to the workbox-strategies configured in `handler`.
         *!/
        fetchOptions: v.optional(v.any()), // RequestInit is too complex to define for now
        /!**
         * Configuring this will pass along the `matchOptions` value to the workbox-strategies configured in `handler`.
         *!/
        matchOptions: v.optional(CacheQueryOptionsSchema), // Reused
      })),
      /!**
       * This match criteria determines whether the configured handler will generate a response for any requests that don't match one of the precached URLs. If multiple `RuntimeCaching` routes are defined, then the first one whose `urlPattern` matches will be the one that responds.
       * This value directly maps to the first parameter passed to workbox-routing.registerRoute. It's recommended to use a workbox-core.RouteMatchCallback function for greatest flexibility.
       *!/
      urlPattern: v.union([v.instance(RegExp), v.function(), v.string()]),
    }))),
    /!**
     * Whether to add an unconditional call to [`skipWaiting()`](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#skip_the_waiting_phase) to the generated service worker. If `false`, then a `message` listener will be added instead, allowing client pages to trigger `skipWaiting()` by calling `postMessage({type: 'SKIP_WAITING'})` on a waiting service worker.
     *!/
    skipWaiting: v.optional(v.boolean(), false),
    /!**
     * Whether to create a sourcemap for the generated service worker files.
     *!/
    sourcemap: v.optional(v.boolean(), true),
    /!**
     * The path and filename of the service worker file that will be created by the build process, relative to the current working directory. It must end in '.js'.
     *!/
    swDest: v.pipe(
      v.string(errors['missing-sw-dest']),
      v.endsWith('.js', errors['invalid-sw-dest-js-ext']),
    ),
    /!**
     * The local directory you wish to match `globPatterns` against. The path is
     * relative to the current directory.
     *!/
    globDirectory: v.optional(v.string()),
  }),
  // This is the cross-field validation rule.
  v.forward(
    v.check(
      input => !!input.runtimeCaching || (typeof input.globDirectory === 'string'),
      errors['no-manifest-entries-or-runtime-caching'],
    ),
    // If the check fails, assign the error to the 'globDirectory' field.
    ['globDirectory'],
  ),
  // This is the cross-field validation rule for navigationPreload.
  v.forward(
    v.check(
      input => !input.navigationPreload || (Array.isArray(input.runtimeCaching) && input.runtimeCaching.length > 0),
      errors['nav-preload-runtime-caching'],
    ),
    ['navigationPreload'],
  ),
)
*/

// Schema for the `options` property within a runtimeCaching entry.
// This allows us to attach cross-field validation rules to it.
export const RuntimeCachingOptionsSchema = v.strictObject({
  backgroundSync: v.optional(v.strictObject({
    name: v.string(),
    options: v.optional(v.strictObject({
      forceSyncFallback: v.optional(v.boolean()),
      maxRetentionTime: v.optional(NumericExpressionSchema),
      onSync: v.optional(v.function()),
    })),
  })),
  broadcastUpdate: v.optional(v.strictObject({
    channelName: v.string(),
    options: v.strictObject({
      headersToCheck: v.optional(v.array(v.string())),
      generatePayload: v.optional(v.function()),
      notifyAllClients: v.optional(v.boolean()),
    }),
  })),
  cacheableResponse: v.optional(v.strictObject({
    statuses: v.optional(v.array(NumericExpressionSchema)),
    headers: v.optional(v.record(v.string(), v.string())),
  })),
  cacheName: v.optional(v.nullable(v.string())),
  expiration: v.optional(v.strictObject({
    maxEntries: v.optional(NumericExpressionSchema),
    maxAgeSeconds: v.optional(NumericExpressionSchema),
    matchOptions: v.optional(CacheQueryOptionsSchema),
    purgeOnQuotaError: v.optional(v.boolean()),
  })),
  networkTimeoutSeconds: v.optional(NumericExpressionSchema),
  plugins: v.optional(v.array(v.strictObject({
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
  precacheFallback: v.optional(v.strictObject({ fallbackURL: v.string() })),
  rangeRequests: v.optional(v.boolean()),
  fetchOptions: v.optional(v.any()),
  matchOptions: v.optional(CacheQueryOptionsSchema),
})

// Schema for a single entry in the runtimeCaching array.
// It's a strict object to prevent unknown properties.
export const RuntimeCachingEntrySchema = v.strictObject({
  handler: v.union([
    v.function(),
    v.strictObject({ handle: v.function() }),
    v.picklist([
      'CacheFirst',
      'CacheOnly',
      'NetworkFirst',
      'NetworkOnly',
      'StaleWhileRevalidate',
    ]),
  ]),
  method: v.optional(v.picklist([
    'DELETE',
    'GET',
    'HEAD',
    'PATCH',
    'POST',
    'PUT',
  ]), 'GET'),
  options: v.optional(RuntimeCachingOptionsSchema),
  urlPattern: v.union([v.instance(RegExp), v.function(), v.string()]),
})

export const GenerateSWOptionsSchema = v.pipe(
  v.strictObject({
    additionalManifestEntries: v.optional(v.array(v.union([
      v.strictObject({
        integrity: v.optional(v.string()),
        revision: v.nullable(v.string()),
        url: v.string(),
      }),
      v.string(),
    ]))),
    dontCacheBustURLsMatching: v.optional(v.instance(RegExp)),
    manifestTransforms: v.optional(v.array(v.function())),
    maximumFileSizeToCacheInBytes: v.optional(NumericExpressionSchema, 2097152),
    modifyURLPrefix: v.optional(v.record(v.string(), v.string())),
    globFollow: v.optional(v.boolean(), true),
    globIgnores: v.optional(v.array(v.string()), ['**/node_modules/**/*']),
    globPatterns: v.optional(v.array(v.string()), ['**/*.{js,css,html}']),
    globStrict: v.optional(v.boolean(), true),
    templatedURLs: v.optional(v.record(v.string(), v.union([v.array(v.string()), v.string()]))),
    babelPresetEnvTargets: v.optional(v.array(v.string()), ['chrome >= 56']),
    cacheId: v.optional(v.nullable(v.string())),
    cleanupOutdatedCaches: v.optional(v.boolean(), false),
    clientsClaim: v.optional(v.boolean(), false),
    directoryIndex: v.optional(v.nullable(v.string())),
    disableDevLogs: v.optional(v.boolean(), false),
    ignoreURLParametersMatching: v.optional(v.array(v.instance(RegExp))),
    importScripts: v.optional(v.array(v.string())),
    inlineWorkboxRuntime: v.optional(v.boolean(), false),
    mode: v.optional(v.nullable(v.string()), 'production'),
    navigateFallback: v.optional(v.nullable(v.string()), null),
    navigateFallbackAllowlist: v.optional(v.array(v.instance(RegExp))),
    navigateFallbackDenylist: v.optional(v.array(v.instance(RegExp))),
    navigationPreload: v.optional(v.boolean(), false),
    runtimeCaching: v.optional(v.array(RuntimeCachingEntrySchema)),
    skipWaiting: v.optional(v.boolean(), false),
    sourcemap: v.optional(v.boolean(), true),
    swDest: v.pipe(
      v.string(errors['invalid-sw-dest']),
      v.endsWith('.js', errors['invalid-sw-dest-js-ext']),
    ),
    globDirectory: v.optional(v.string()),
  }),
  v.forward(
    v.check(
      input => !!input.runtimeCaching || (typeof input.globDirectory === 'string'),
      errors['no-manifest-entries-or-runtime-caching'],
    ),
    ['globDirectory'],
  ),
  v.forward(
    v.check(
      input => !input.navigationPreload || (Array.isArray(input.runtimeCaching) && input.runtimeCaching.length > 0),
      errors['nav-preload-runtime-caching'],
    ),
    ['navigationPreload'],
  ),
  // This is the cross-field validation for cacheName when expiration is present.
  v.forward(
    v.check(
      (options) => {
        const runtimeCaching = options.runtimeCaching
        if (!runtimeCaching) {
          return true
        }
        for (const runtime of runtimeCaching) {
          if (runtime.options?.expiration && !runtime.options?.cacheName) {
            return false
          }
        }

        return true
      },
      errors['cache-name-required'],
    ),
    ['runtimeCaching'],
  ),
)
