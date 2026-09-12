import * as v from 'valibot'
import { logLevel } from '../utils/constants'
import {
  validateGlobDirectory,
  validateSWDestDirectory,
  validateSWSrc,
} from './generation-utils'
import { BundlerLogLevelSchema, ManifestOptionsSchema } from './utils'

export type AsyncInjectManifestOptionsSchemaType = v.InferInput<typeof AsyncInjectManifestOptionsSchema>

export const AsyncInjectManifestOptionsSchema = v.pipeAsync(
  v.strictObject({
    ...ManifestOptionsSchema.entries,
    logLevel: v.optional(
      v.picklist(logLevel),
      'info',
    ),
    bundlerLogLevel: BundlerLogLevelSchema,
    /**
     * The string to find inside of the `swSrc` file. Once found, it will be
     * replaced by the generated precache manifest.
     *
     * **NOTE**: calling `injectManifest` with `injectionPoint` set to `null` or `false` will fail.
     *
     * @default "self.__WB_MANIFEST"
     */
    injectionPoint: v.optional(
      v.union([
        v.string(),
        v.null(),
        v.literal(false),
      ]),
      'self.__WB_MANIFEST',
    ),
    /**
     * The path and filename of the service worker file that will be read during
     * the build process, relative to the current working directory.
     */
    swSrc: v.string(),

    /**
     * The path and filename of the service worker file that will be created by
     * the build process, relative to the current working directory. It must end
     * in '.js'.
     */
    swDest: v.pipe(
      v.string(),
      v.endsWith('.js', 'invalid-sw-dest-js-ext'),
    ),

    /**
     * The local directory you wish to match `globPatterns` against. The path is
     * relative to the current directory.
     */
    globDirectory: v.string(),
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
