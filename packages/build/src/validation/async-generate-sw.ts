import * as v from 'valibot'
import { errors } from './errors'
import { validateGlobDirectory, validateSWDestDirectory, withSmartMinify } from './generation-utils'
import { BundlerDataSchema, ManifestOptionsSchema, RuntimeCachingEntrySchema, SWTargetSchema } from './utils'

export type AsyncGenerateSWOptionsSchemaType = v.InferInput<typeof AsyncGenerateSWOptionsSchema>

const BaseAsyncGenerateSWOptionsSchema = v.pipeAsync(
  v.strictObject({
    ...BundlerDataSchema.entries,
    ...ManifestOptionsSchema.entries,
    /**
     * The type of the service worker.
     * @default classic
     */
    swType: v.optional(v.picklist([
      'classic',
      'module',
      'classic-and-module',
    ]), 'classic'),
    /**
     * When using `classic` or `module` and splitting workbox runtime (inlineWorkboxRuntime set to false), this flag controls the
     * name of the `workbox-**.js` chunk:
     * - when true, workbox will generate the same old asset name `workbox-<hash>.js` using `hex`
     * - when false, workbox will generate `workbox-classic-<hash>.js` or `workbox-modern-<hash>.js` with modern Vite/Rolldown hash.
     *
     * When using `classic-and-module` (dual build), the build will use modern Vite/Rolldown hash regardless of the value of this flag.
     *
     * @default true
     */
    workboxRuntimeCompatible: v.optional(v.boolean(), true),
    /**
     * Service worker target build.
     */
    target: SWTargetSchema,
    /**
     * Should minify the output?
     * - when specified it is preserved
     * - true when sourcemap is not set to false or mode is set to production
     * - otherwise false
     */
    minify: v.optional(v.boolean()),
    /**
     * An optional ID to be prepended to cache names. This is primarily useful for local development where multiple sites may be served from the same `http://localhost:port` origin.
     */
    cacheId: v.optional(v.nullable(v.string())),
    /**
     * Whether or not Workbox should attempt to identify and delete any precaches created by older, incompatible versions.
     */
    cleanupOutdatedCaches: v.optional(v.boolean(), false),
    /**
     * Whether or not the service worker should [start controlling](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#clientsclaim) any existing clients as soon as it activates.
     */
    clientsClaim: v.optional(v.boolean(), false),
    /**
     * If a navigation request for a URL ending in `/` fails to match a precached URL, this value will be appended to the URL and that will be checked for a precache match. This should be set to what your web server is using for its directory index.
     */
    directoryIndex: v.optional(v.nullable(v.string())),
    /**
     * Whether to disable logging of warnings and errors.
     */
    disableDevLogs: v.optional(v.boolean(), false),
    /**
     * Any search parameter names that match against one of the RegExp in this array will be removed before looking for a precache match. This is useful if your users might request URLs that contain, for example, URL parameters used to track the source of the traffic. If not provided, the default value is `[/^utm_/, /^fbclid$/]`.
     */
    ignoreURLParametersMatching: v.optional(v.array(v.instance(RegExp))),
    /**
     * Whether or not to clean up search parameters from URLs.
     * @default true
     */
    cleanURLs: v.optional(v.boolean(), true),
    /**
     * A callback function that allows you to modify the URL of a precached asset
     * before it's looked up in the cache.
     */
    urlManipulation: v.optional(v.function()),
    /**
     * Controls parallel precaching of assets during service worker installation.
     * When enabled, assets are fetched concurrently up to `concurrency` at a time
     * instead of one by one.
     *
     * Limiting concurrency prevents net::ERR_INSUFFICIENT_RESOURCES errors in Chrome
     * and reduces bandwidth impact on the main app during service worker installation.
     * @see https://github.com/GoogleChrome/workbox/issues/2528
     *
     * Defaults: { enabled: false, concurrency: 5 }
     */
    parallel: v.optional(
      v.pipe(
        v.strictObject({
          enabled: v.optional(v.boolean(), false),
          concurrency: v.optional(
            v.pipe(
              v.number(),
              v.integer(() => errors['parallel-concurrency-integer']),
              v.minValue(1, () => errors['parallel-concurrency-min']),
              // v.maxValue(10, () => errors['parallel-concurrency-max']),
            ),
            5,
          ),
        }),
      ),
      {
        enabled: false,
        concurrency: 5,
      },
    ),
    /**
     * Whether the runtime code for the Workbox library should be included in the top-level service worker, or split into a separate file that needs to be deployed alongside the service worker. Keeping the runtime separate means that users will not have to re-download the Workbox code each time your top-level service worker changes.
     */
    inlineWorkboxRuntime: v.optional(v.boolean(), false),
    /**
     * If specified, all [navigation requests](https://developers.google.com/web/fundamentals/primers/service-workers/high-performance-loading#first_what_are_navigation_requests) for URLs that aren't precached will be fulfilled with the HTML at the URL provided. You must pass in the URL of an HTML document that is listed in your precache manifest. This is meant to be used in a Single Page App scenario, in which you want all navigations to use common [App Shell HTML](https://developers.google.com/web/fundamentals/architecture/app-shell).
     */
    navigateFallback: v.optional(v.nullable(v.string()), null),
    /**
     * An optional array of regular expressions that restricts which URLs the configured `navigateFallback` behavior applies to. This is useful if only a subset of your site's URLs should be treated as being part of a [Single Page App](https://en.wikipedia.org/wiki/Single-page_application). If both `navigateFallbackDenylist` and `navigateFallbackAllowlist` are configured, the denylist takes precedent.
     */
    navigateFallbackAllowlist: v.optional(v.array(v.instance(RegExp))),
    /**
     * An optional array of regular expressions that restricts which URLs the configured `navigateFallback` behavior applies to. This is useful if only a subset of your site's URLs should be treated as being part of a [Single Page App](https://en.wikipedia.org/wiki/Single-page_application). If both `navigateFallbackDenylist` and `navigateFallbackAllowlist` are configured, the denylist takes precedent.
     */
    navigateFallbackDenylist: v.optional(v.array(v.instance(RegExp))),
    /**
     * Whether or not to enable [navigation preload](https://developers.google.com/web/tools/workbox/modules/workbox-navigation-preload) in the generated service worker. When set to true, you must also use `runtimeCaching` to set up an appropriate response strategy that will match navigation requests, and make use of the preloaded response.
     */
    navigationPreload: v.optional(v.boolean(), false),
    /**
     * When using Workbox's build tools to generate your service worker, you can specify one or more runtime caching configurations. These are then translated to {@link workbox-routing.registerRoute} calls using the match and handler configuration you define.
     */
    runtimeCaching: v.optional(v.array(RuntimeCachingEntrySchema)),
    /**
     * Whether to add an unconditional call to [`skipWaiting()`](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#skip_the_waiting_phase) to the generated service worker. If `false`, then a `message` listener will be added instead, allowing client pages to trigger `skipWaiting()` by calling `postMessage({type: 'SKIP_WAITING'})` on a waiting service worker.
     */
    skipWaiting: v.optional(v.boolean(), false),
    /**
     * Whether to create a sourcemap for the generated service worker files.
     * - `false`: No sourcemap will be generated.
     * - `true`: A separate sourcemap file will be generated.
     * - `inline`: The sourcemap will be appended to the output file as a data URL.
     * - `hidden`: A separate sourcemap file will be generated, but the link to the sourcemap (`//# sourceMappingURL` comment) will not be included in the output file.
     *
     * @default false
     */
    sourcemap: v.optional(
      v.union([
        v.boolean(),
        v.literal('hidden'),
        v.literal('inline'),
      ]),
      false,
    ),
    /**
     * The path and filename of the service worker file that will be created by the build process, relative to the current working directory. It must end in '.js'.
     */
    swDest: v.pipe(
      v.string(),
      v.endsWith('.js', 'invalid-sw-dest-js-ext'),
    ),
    /**
     * The local directory you wish to match `globPatterns` against. The path is
     * relative to the current directory.
     */
    globDirectory: v.optional(v.string()),
  }),
  v.forwardAsync(
    v.checkAsync(
      async (input) => {
        return await validateSWDestDirectory(input.swDest)
      },
      'invalid-sw-dest',
    ),
    ['swDest'],
  ),
  v.forwardAsync(
    v.checkAsync(
      async input => !!input.runtimeCaching || (typeof input.globDirectory === 'string'),
      'no-manifest-entries-or-runtime-caching',
    ),
    ['globDirectory'],
  ),
  v.forwardAsync(
    v.checkAsync(
      async (input) => {
        return typeof input.globDirectory === 'string'
          ? await validateGlobDirectory(input.globDirectory)
          : true
      },
      'glob-directory-invalid',
    ),
    ['globDirectory'],
  ),
  v.forwardAsync(
    v.checkAsync(
      async input => !input.navigationPreload || (Array.isArray(input.runtimeCaching) && input.runtimeCaching.length > 0),
      'nav-preload-runtime-caching',
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
      'cache-name-required',
    ),
    ['runtimeCaching'],
  ),
)

export const AsyncGenerateSWOptionsSchema = v.pipeAsync(
  BaseAsyncGenerateSWOptionsSchema,
  withSmartMinify(),
)
