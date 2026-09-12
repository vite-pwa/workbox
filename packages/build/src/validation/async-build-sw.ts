import * as v from 'valibot'
import { AsyncInjectManifestOptionsSchema } from './async-inject-manifest'
import {
  validateGlobDirectory,
  validateSWDestDirectory,
  validateSWSrc,
  withSmartMinify,
} from './generation-utils'
import { BundlerDataSchema, SWTargetSchema } from './utils'

/**
 * We extract the base entries from InjectManifest to reuse them.
 * Since AsyncInjectManifestOptionsSchema is a v.pipeAsync,
 * we access the internal object schema entries.
 */
const AsyncBaseInjectManifestEntries = AsyncInjectManifestOptionsSchema.pipe[0]

const BaseInjectManifestEntries = v.pipeAsync(
  v.strictObject({
    ...BundlerDataSchema.entries,
    ...AsyncBaseInjectManifestEntries.entries,
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
     * Whether the runtime code for the Workbox library should be included in the top-level service worker, or split into a separate file that needs to be deployed alongside the service worker. Keeping the runtime separate means that users will not have to re-download the Workbox code each time your top-level service worker changes.
     */
    inlineWorkboxRuntime: v.optional(v.boolean(), false),
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
     * Whether to create a sourcemap.
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
     * Custom chunks support.
     * This allows splitting specific modules into separate files.
     * @experimental
     */
    customChunks: v.optional(
      v.function(),
    ),
    alias: v.optional(v.any()),
  }),
  v.forwardAsync(
    v.checkAsync(
      async (input) => {
        return await validateSWSrc(input.swSrc)
      },
      'invalid-sw-src',
    ),
    ['swSrc'],
  ),
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
      async (input) => {
        return await validateGlobDirectory(input.globDirectory)
      },
      'glob-directory-invalid',
    ),
    ['globDirectory'],
  ),
)

export const AsyncBuildSWOptionsSchema = v.pipeAsync(
  BaseInjectManifestEntries,
  // Smart minify transformation logic
  withSmartMinify(),
)
