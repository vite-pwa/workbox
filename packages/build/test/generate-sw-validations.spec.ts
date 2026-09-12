import type { GenerateSWOptions, SWType } from '../src/types'
import { describe, expect, it } from 'vitest'
import { DEFAULT_MAXIMUM_FILE_SIZE_TO_CACHE_IN_BYTES } from '../src/utils/constants'
import { deepMergeObject } from '../src/utils/utils'
import { AsyncGenerateSWOptionsSchema } from '../src/validation/async-generate-sw'
import { validateGenerateSW } from '../src/validation/validation-helper'
import { createGenerateSWOptions, defaultTargets, withDummyRuntimeCaching } from './test-helper'

describe('generate-sw validations', () => {
  const objectSchema = AsyncGenerateSWOptionsSchema.pipe[0]
  const entries = objectSchema.entries
  const allFields = Object.entries(entries)
  const requiredFields = allFields.filter((entry) => {
    return entry[1].type !== 'optional'
  }).map(([key]) => key)
  it('required fields', () => {
    expect(requiredFields).toEqual(['swDest'])
  })

  const swTypes: SWType[] = ['classic', 'module', 'classic-and-module']

  describe('basic requirements', () => {
    const swTypeAndRequiredFields = swTypes.flatMap(swType =>
      requiredFields.map(field => ({ swType, field })),
    )

    it.each(swTypeAndRequiredFields)(
      'missing required field "$field" fails for $swType',
      async ({ swType, field }) => {
        const { options } = createGenerateSWOptions(swType)
        // @ts-expect-error forcing validation failure
        options[field] = undefined

        await expect(validateGenerateSW(options)).rejects.toThrow(
          new RegExp(`The '${field}' option is required`),
        )
      },
    )

    it.each(swTypeAndRequiredFields)(
      'invalid type for required field "$field" fails for $swType',
      async ({ swType, field }) => {
        const { options } = createGenerateSWOptions(swType)
        // @ts-expect-error forcing type failure
        options[field] = () => {}
        await expect(validateGenerateSW(options)).rejects.toThrow(
          new RegExp(`The '${field}' option is required`),
        )
      },
    )

    it.each(swTypes)('default values are populated for %s', async (swType) => {
      const { globDirectory, options, swDest } = createGenerateSWOptions(swType)
      await expect(validateGenerateSW(options)).resolves.toMatchObject({
        swDest,
        swType,
        globDirectory,
        inlineWorkboxRuntime: false,
        maximumFileSizeToCacheInBytes: DEFAULT_MAXIMUM_FILE_SIZE_TO_CACHE_IN_BYTES,
        throwMaximumFileSizeToCacheInBytes: true,
        globPatterns: ['**/*.{js,css,html}'],
        globIgnores: ['**/node_modules/**/*'],
      } satisfies GenerateSWOptions<typeof swType>)
    })
  })

  describe('file system and path validations', () => {
    it.each(swTypes)('missing swDest folder fails for %s', async (swType) => {
      const { options } = createGenerateSWOptions(swType, true, {
        swDest: '__missing__/sw.js',
      })
      await expect(validateGenerateSW(options)).rejects.toThrow(
        /The 'swDest' value must be a valid path/,
      )
    })

    it.each(swTypes)('missing globDirectory and runtimeCaching fails for %s', async (swType) => {
      const { options } = createGenerateSWOptions(swType, false)
      await expect(validateGenerateSW(options)).rejects.toThrow(
        /Couldn't find configuration for either precaching or runtime caching/,
      )
    })
    it.each(swTypes)('missing globDirectory fails for %s', async (swType) => {
      const { options } = createGenerateSWOptions(swType, false, {
        globDirectory: '__missing__',
      })
      await expect(validateGenerateSW(options)).rejects.toThrow(
        /The path you entered isn't a valid directory/,
      )
    })

    it.each(swTypes)('missing globDirectory with a runtimeCaching does NOT fail for %s', async (swType) => {
      const { options: classicOptions } = withDummyRuntimeCaching(swType)
      await expect(validateGenerateSW(classicOptions)).resolves.not.toBeUndefined()
    })
  })

  describe('build targets logic', () => {
    it.each(swTypes)('default targets are applied for %s', async (swType) => {
      const { options } = createGenerateSWOptions(swType)
      await expect(validateGenerateSW(options).then((o) => {
        deepMergeObject(options, o)
        return Promise.resolve(options)
      })).resolves.toMatchObject(defaultTargets)
    })
    it.each(swTypes)('targets for %s are preserved (object)', async (swType) => {
      const { options } = createGenerateSWOptions(swType, true, {
        target: {
          classic: 'a',
          module: 'b',
        },
      })
      await expect(validateGenerateSW(options).then((o) => {
        deepMergeObject(options, o)
        return Promise.resolve(options)
      })).resolves.toMatchObject({
        target: {
          classic: 'a',
          module: 'b',
        },
      })
    })
    it.each(swTypes)('targets for %s are preserved (string)', async (swType) => {
      const { options } = createGenerateSWOptions(swType, true, {
        target: 'a',
      })
      await expect(validateGenerateSW(options).then((o) => {
        deepMergeObject(options, o)
        return Promise.resolve(options)
      })).resolves.toMatchObject({
        target: 'a',
      })
    })
    it.each(swTypes)('targets for %s are preserved (string[])', async (swType) => {
      const { options } = createGenerateSWOptions(swType, true, {
        target: ['a', 'b'],
      })
      await expect(validateGenerateSW(options).then((o) => {
        deepMergeObject(options, o)
        return Promise.resolve(options)
      })).resolves.toMatchObject({
        target: ['a', 'b'],
      })
    })
  })

  describe('minify logic', () => {
    const sourcemaps = [true, 'inline', 'hidden'] as const
    const minifyCombinations = sourcemaps.reduce((acc, sourcemap) => {
      for (const swType of swTypes) {
        acc.push([swType, sourcemap])
      }
      return acc
    }, [] as [swType: SWType, sourcemap: true | 'inline' | 'hidden'][])

    it.each(swTypes)('default minify for %s is set tu true when mode is production', async (swType) => {
      const { options } = createGenerateSWOptions(swType, true, {
        mode: 'production',
      })
      await expect(validateGenerateSW(options).then((o) => {
        deepMergeObject(options, o)
        return Promise.resolve(options)
      })).resolves.toMatchObject({
        minify: true,
      })
    })

    it.each(minifyCombinations)('default minify for %s is set to true when sourcemap is %s', async (swType, sourcemap) => {
      const { options } = createGenerateSWOptions(swType, true, {
        sourcemap,
      })
      await expect(validateGenerateSW(options)).resolves.toMatchObject({
        minify: true,
      })
    })

    it.each(swTypes)('default minify for %s is set to true when mode is production even if sourcemap is false', async (swType) => {
      const { options } = createGenerateSWOptions(swType, true, {
        sourcemap: false,
        mode: 'production',
      })
      await expect(validateGenerateSW(options)).resolves.toMatchObject({
        minify: true,
      })
    })

    it.each(swTypes)('default minify for %s is set to false when mode is development and sourcemap is false', async (swType) => {
      const { options } = createGenerateSWOptions(swType, true, {
        mode: 'development',
        sourcemap: false,
      })
      await expect(validateGenerateSW(options)).resolves.toMatchObject({
        minify: false,
      })
    })

    it.each(swTypes)('preserves explicit minify: false for %s even if sourcemap is enabled', async (swType) => {
      const { options } = createGenerateSWOptions(swType, true, {
        sourcemap: true,
        minify: false,
      })
      await expect(validateGenerateSW(options)).resolves.toMatchObject({
        minify: false,
      })
    })

    it.each(swTypes)('preserves explicit minify: true for %s even in development', async (swType) => {
      const { options } = createGenerateSWOptions(swType, true, {
        mode: 'development',
        sourcemap: false,
        minify: true,
      })
      await expect(validateGenerateSW(options)).resolves.toMatchObject({
        minify: true,
      })
    })
  })
})
