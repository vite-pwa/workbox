import type { InjectManifestOptions } from '../src/types'
import { describe, expect, it } from 'vitest'
import { DEFAULT_MAXIMUM_FILE_SIZE_TO_CACHE_IN_BYTES } from '../src/utils/constants'
import { AsyncInjectManifestOptionsSchema } from '../src/validation/async-inject-manifest'
import { validateInjectManifest } from '../src/validation/validation-helper'
import { createInjectManifestOptions } from './test-helper'

describe('inject-manifest validations', () => {
  const objectSchema = AsyncInjectManifestOptionsSchema.pipe[0]
  const entries = objectSchema.entries
  const allFields = Object.entries(entries)
  const requiredFields = allFields.filter((entry) => {
    return entry[1].type !== 'optional'
  }).map(([key]) => key)
  it('required fields', () => {
    expect(requiredFields).toEqual(['swSrc', 'swDest', 'globDirectory'])
  })

  const messages: Record<string, RegExp> = {
    swSrc: /The 'swSrc' file can't be read/,
    swDest: /The 'swDest' option is required/,
    globDirectory: /The supplied globDirectory must be a path as a string/,
  }

  it.each(requiredFields)('missing %s option fails', async (field) => {
    const { options } = createInjectManifestOptions()
    // @ts-expect-error this is the desired test
    options[field] = undefined
    expect(messages[field]).not.toBeUndefined()
    await expect(validateInjectManifest(options)).rejects.toThrow(messages[field])
  })

  it.each(requiredFields)('invalid %s option type fails', async (field) => {
    const { options } = createInjectManifestOptions()
    // @ts-expect-error this is the desired test
    options[field] = () => {}
    expect(messages[field]).not.toBeUndefined()
    await expect(validateInjectManifest(options)).rejects.toThrow(messages[field])
  })

  it('default values are populated', async () => {
    const { globDirectory, options, swDest, swSrc } = createInjectManifestOptions()
    await expect(validateInjectManifest(options)).resolves.toMatchObject({
      swDest,
      swSrc,
      globDirectory,
      maximumFileSizeToCacheInBytes: DEFAULT_MAXIMUM_FILE_SIZE_TO_CACHE_IN_BYTES,
      throwMaximumFileSizeToCacheInBytes: true,
      globPatterns: ['**/*.{js,css,html}'],
      globIgnores: ['**/node_modules/**/*'],
    } satisfies InjectManifestOptions)
  })

  it('missing swSrc fails', async () => {
    const { options } = createInjectManifestOptions({
      swSrc: '__missing__/sw.js',
    })
    await expect(validateInjectManifest(options)).rejects.toThrow(
      messages.swSrc,
    )
  })

  it('missing swDest fails', async () => {
    const { options } = createInjectManifestOptions({
      swDest: '__missing__/sw.js',
    })
    await expect(validateInjectManifest(options)).rejects.toThrow(
      /The 'swDest' value must be a valid path/,
    )
  })

  it('missing globDirectory fails', async () => {
    const { options } = createInjectManifestOptions({
      globDirectory: '__missing__',
    })
    await expect(validateInjectManifest(options)).rejects.toThrow(
      /The path you entered isn't a valid directory/,
    )
  })
})
