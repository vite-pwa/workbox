import * as v from 'valibot'
import { AsyncManifestOptionsSchema } from './utils'

export type AsyncGetManifestOptionsSchemaType = v.InferInput<typeof AsyncGetManifestOptionsSchema>

export const AsyncGetManifestOptionsSchema = v.pipeAsync(
  v.strictObjectAsync({
    ...AsyncManifestOptionsSchema.entries,
    /**
     * The local directory you wish to match `globPatterns` against. The path is
     * relative to the current directory.
     */
    globDirectory: v.string(),
  }),
)
