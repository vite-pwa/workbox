import { errors } from '@vite-pwa/workbox-build/validation/errors'
import * as v from 'valibot'
import { AsyncManifestEntrySchema, AsyncRuntimeCachingEntrySchema } from './utils'

export const AsyncGetManifestOptionsSchema = v.pipeAsync(
  v.strictObjectAsync({
  /**
   * A list of entries to be precached, in addition to any entries that are
   * generated as part of the build configuration.
   */
    additionalManifestEntries: v.optionalAsync(v.arrayAsync(v.unionAsync([AsyncManifestEntrySchema, v.string()]))),
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
     * This value can be used to determine the maximum size of files that will be
     * precached. This prevents you from inadvertently precaching very large files
     * that might have accidentally matched one of your patterns.
     * @default 2097152 (2MiB)
     */
    maximumFileSizeToCacheInBytes: v.optionalAsync(v.number(), 2097152),
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
    /**
     * The [targets](https://babeljs.io/docs/en/babel-preset-env#targets) to pass to `babel-preset-env` when transpiling the service worker bundle.
     */
    babelPresetEnvTargets: v.optionalAsync(v.arrayAsync(v.string()), ['chrome >= 56']),
    /**
     * An optional ID to be prepended to cache names. This is primarily useful for local development where multiple sites may be served from the same `http://localhost:port` origin.
     */
    cacheId: v.optionalAsync(v.nullable(v.string())),
    /**
     * Whether or not Workbox should attempt to identify and delete any precaches created by older, incompatible versions.
     */
    cleanupOutdatedCaches: v.optionalAsync(v.boolean(), false),
    /**
     * Whether or not the service worker should [start controlling](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#clientsclaim) any existing clients as soon as it activates.
     */
    clientsClaim: v.optionalAsync(v.boolean(), false),
    /**
     * If a navigation request for a URL ending in `/` fails to match a precached URL, this value will be appended to the URL and that will be checked for a precache match. This should be set to what your web server is using for its directory index.
     */
    directoryIndex: v.optionalAsync(v.nullable(v.string())),
    /**
     * Whether to disable logging of warnings and errors.
     */
    disableDevLogs: v.optionalAsync(v.boolean(), false),
    /**
     * Any search parameter names that match against one of the RegExp in this array will be removed before looking for a precache match. This is useful if your users might request URLs that contain, for example, URL parameters used to track the source of the traffic. If not provided, the default value is `[/^utm_/, /^fbclid$/]`.
     */
    ignoreURLParametersMatching: v.optionalAsync(v.arrayAsync(v.instance(RegExp))),
    /**
     * A list of JavaScript files that should be passed to [`importScripts()`](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts) inside the generated service worker file. This is useful when you want to let Workbox create your top-level service worker file, but want to include some additional code, such as a push event listener.
     */
    importScripts: v.optionalAsync(v.arrayAsync(v.string())),
    /**
     * Whether the runtime code for the Workbox library should be included in the top-level service worker, or split into a separate file that needs to be deployed alongside the service worker. Keeping the runtime separate means that users will not have to re-download the Workbox code each time your top-level service worker changes.
     */
    inlineWorkboxRuntime: v.optionalAsync(v.boolean(), false),
    /**
     * If set to 'production', then an optimized service worker bundle that excludes debugging info will be produced. If not explicitly configured here, the `process.env.NODE_ENV` value will be used, and failing that, it will fall back to `'production'`.
     */
    mode: v.optionalAsync(v.nullable(v.string()), 'production'),
    /**
     * If specified, all [navigation requests](https://developers.google.com/web/fundamentals/primers/service-workers/high-performance-loading#first_what_are_navigation_requests) for URLs that aren't precached will be fulfilled with the HTML at the URL provided. You must pass in the URL of an HTML document that is listed in your precache manifest. This is meant to be used in a Single Page App scenario, in which you want all navigations to use common [App Shell HTML](https://developers.google.com/web/fundamentals/architecture/app-shell).
     */
    navigateFallback: v.optionalAsync(v.nullable(v.string()), null),
    /**
     * An optional array of regular expressions that restricts which URLs the configured `navigateFallback` behavior applies to. This is useful if only a subset of your site's URLs should be treated as being part of a [Single Page App](https://en.wikipedia.org/wiki/Single-page_application). If both `navigateFallbackDenylist` and `navigateFallbackAllowlist` are configured, the denylist takes precedent.
     */
    navigateFallbackAllowlist: v.optionalAsync(v.arrayAsync(v.instance(RegExp))),
    /**
     * An optional array of regular expressions that restricts which URLs the configured `navigateFallback` behavior applies to. This is useful if only a subset of your site's URLs should be treated as being part of a [Single Page App](https://en.wikipedia.org/wiki/Single-page_application). If both `navigateFallbackDenylist` and `navigateFallbackAllowlist` are configured, the denylist takes precedent.
     */
    navigateFallbackDenylist: v.optionalAsync(v.arrayAsync(v.instance(RegExp))),
    /**
     * Whether or not to enable [navigation preload](https://developers.google.com/web/tools/workbox/modules/workbox-navigation-preload) in the generated service worker. When set to true, you must also use `runtimeCaching` to set up an appropriate response strategy that will match navigation requests, and make use of the preloaded response.
     */
    navigationPreload: v.optionalAsync(v.boolean(), false),
    /**
     * Controls whether or not to include support for [offline Google Analytics](https://developers.google.com/web/tools/workbox/guides/enable-offline-analytics). When `true`, the call to `workbox-google-analytics`'s `initialize()` will be added to your generated service worker. When set to an `Object`, that object will be passed in to the `initialize()` call, allowing you to customize the behavior.
     */
    /* offlineGoogleAnalytics: v.optionalAsync(v.unionAsync([
      v.objectAsync({ // Inlined GoogleAnalyticsInitializeOptionsSchema
        cacheName: v.optionalAsync(v.string()),
        parameterOverrides: v.optionalAsync(v.recordAsync(v.string(), v.string())),
        hitFilter: v.optionalAsync(v.function()),
      }),
      v.boolean(),
    ]), false), */
    /**
     * When using Workbox's build tools to generate your service worker, you can specify one or more runtime caching configurations. These are then translated to {@link workbox-routing.registerRoute} calls using the match and handler configuration you define.
     */
    runtimeCaching: v.optionalAsync(v.arrayAsync(AsyncRuntimeCachingEntrySchema)),
    /**
     * Whether to add an unconditional call to [`skipWaiting()`](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#skip_the_waiting_phase) to the generated service worker. If `false`, then a `message` listener will be added instead, allowing client pages to trigger `skipWaiting()` by calling `postMessage({type: 'SKIP_WAITING'})` on a waiting service worker.
     */
    skipWaiting: v.optionalAsync(v.boolean(), false),
    /**
     * Whether to create a sourcemap for the generated service worker files.
     */
    sourcemap: v.optionalAsync(v.boolean(), true),
    /**
     * The path and filename of the service worker file that will be created by the build process, relative to the current working directory. It must end in '.js'.
     */
    swDest: v.pipeAsync(
      v.string(errors['missing-sw-dest']),
      v.endsWith('.js', errors['invalid-sw-dest-js-ext']),
    ),
    /**
     * The local directory you wish to match `globPatterns` against. The path is
     * relative to the current directory.
     */
    globDirectory: v.optionalAsync(v.string()),
  }),
  v.forwardAsync(
    v.checkAsync(
      async input => !!input.runtimeCaching || (typeof input.globDirectory === 'string'),
      errors['no-manifest-entries-or-runtime-caching'],
    ),
    ['globDirectory'],
  ),
  v.forwardAsync(
    v.checkAsync(
      async input => !input.navigationPreload || (Array.isArray(input.runtimeCaching) && input.runtimeCaching.length > 0),
      errors['nav-preload-runtime-caching'],
    ),
    ['navigationPreload'],
  ),
  // This is the cross-field validation for cacheName when expiration is present.
  v.forwardAsync(
    v.checkAsync(
      async (options) => {
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
