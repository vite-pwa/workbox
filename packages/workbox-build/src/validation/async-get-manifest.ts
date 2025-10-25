import * as v from 'valibot'
import { AsyncNumericExpressionSchema } from './utils'

// ManifestEntry is used in additionalManifestEntries
const AsyncManifestEntrySchema = v.strictObjectAsync({
  integrity: v.optionalAsync(v.string()),
  revision: v.nullable(v.string()),
  url: v.string(),
})

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
    maximumFileSizeToCacheInBytes: v.optionalAsync(AsyncNumericExpressionSchema, 2097152),
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
     * The local directory you wish to match `globPatterns` against. The path is
     * relative to the current directory.
     */
    globDirectory: v.string(),
  }),
)
