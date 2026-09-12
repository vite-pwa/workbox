import type { GenerateSWOptions, SWType } from '../src/types'
import { describe, expect, it } from 'vitest'
import { DEFAULT_MAXIMUM_FILE_SIZE_TO_CACHE_IN_BYTES } from '../src/utils/constants'
import { deepMergeObject } from '../src/utils/utils'
import { AsyncBuildSWOptionsSchema } from '../src/validation/async-build-sw'
import { validateBuildSW } from '../src/validation/build-validation-helper'
import { createBuildSWOptions, defaultTargets } from './test-helper'

describe('build-sw validations', () => {
  const objectSchema = AsyncBuildSWOptionsSchema.pipe[0]
  const entries = objectSchema.entries
  const allFields = Object.entries(entries)
  const requiredFields = allFields.filter((entry) => {
    return entry[1].type !== 'optional'
  }).map(([key]) => key)
  it('required fields', () => {
    expect(requiredFields).toMatchInlineSnapshot(`
      [
        "swSrc",
        "swDest",
        "globDirectory",
      ]
    `)
  })

  const swTypes: SWType[] = ['classic', 'module', 'classic-and-module']

  describe('basic requirements', () => {
    const swTypeAndRequiredFields = swTypes.flatMap(swType =>
      requiredFields.map(field => ({ swType, field })),
    )

    it.each(swTypeAndRequiredFields)(
      'missing required field "$field" fails for $swType',
      async ({ swType, field }) => {
        const { options } = createBuildSWOptions(swType)
        // @ts-expect-error forcing validation failure
        options[field] = undefined

        if (field === 'swSrc') {
          await expect(validateBuildSW(options)).rejects.toThrow(
            new RegExp(`The '${field}' file can\'t be read`),
          )
        }
        else if (field === 'swDest') {
          await expect(validateBuildSW(options)).rejects.toThrow(
            new RegExp(`The '${field}' option is required`),
          )
        }
        else if (field === 'globDirectory') {
          await expect(validateBuildSW(options)).rejects.toThrow(
            new RegExp(`The supplied ${field} must be a path as a string`),
          )
        }
      },
    )

    it.each(swTypeAndRequiredFields)(
      'invalid type for required field "$field" fails for $swType',
      async ({ swType, field }) => {
        const { options } = createBuildSWOptions(swType)
        // @ts-expect-error forcing type failure
        options[field] = () => {}
        if (field === 'swSrc') {
          await expect(validateBuildSW(options)).rejects.toThrow(
            new RegExp(`The '${field}' file can\'t be read`),
          )
        }
        else if (field === 'swDest') {
          await expect(validateBuildSW(options)).rejects.toThrow(
            new RegExp(`The '${field}' option is required`),
          )
        }
        else if (field === 'globDirectory') {
          await expect(validateBuildSW(options)).rejects.toThrow(
            new RegExp(`The supplied ${field} must be a path as a string`),
          )
        }
      },
    )

    it.each(swTypes)('default values are populated for %s', async (swType) => {
      const { globDirectory, options, swDest } = createBuildSWOptions(swType)
      await expect(validateBuildSW(options)).resolves.toMatchObject({
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
      const { options } = createBuildSWOptions(swType, {
        swDest: '__missing__/sw.js',
      })
      await expect(validateBuildSW(options)).rejects.toThrow(
        /The 'swDest' value must be a valid path/,
      )
    })
  })

  describe('build targets logic', () => {
    it.each(swTypes)('default targets are applied for %s', async (swType) => {
      const { options } = createBuildSWOptions(swType)
      await expect(validateBuildSW(options).then((o) => {
        deepMergeObject(options, o)
        return Promise.resolve(options)
      })).resolves.toMatchObject(defaultTargets)
    })
    it.each(swTypes)('targets for %s are preserved (object)', async (swType) => {
      const { options } = createBuildSWOptions(swType, {
        target: {
          classic: 'a',
          module: 'b',
        },
      })
      await expect(validateBuildSW(options).then((o) => {
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
      const { options } = createBuildSWOptions(swType, {
        target: 'a',
      })
      await expect(validateBuildSW(options).then((o) => {
        deepMergeObject(options, o)
        return Promise.resolve(options)
      })).resolves.toMatchObject({
        target: 'a',
      })
    })
    it.each(swTypes)('targets for %s are preserved (string[])', async (swType) => {
      const { options } = createBuildSWOptions(swType, {
        target: ['a', 'b'],
      })
      await expect(validateBuildSW(options).then((o) => {
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
      const { options } = createBuildSWOptions(swType, {
        mode: 'production',
      })
      await expect(validateBuildSW(options).then((o) => {
        deepMergeObject(options, o)
        return Promise.resolve(options)
      })).resolves.toMatchObject({
        minify: true,
      })
    })

    it.each(minifyCombinations)('default minify for %s is set to true when sourcemap is %s', async (swType, sourcemap) => {
      const { options } = createBuildSWOptions(swType, {
        sourcemap,
      })
      await expect(validateBuildSW(options)).resolves.toMatchObject({
        minify: true,
      })
    })

    it.each(swTypes)('default minify for %s is set to true when mode is production even if sourcemap is false', async (swType) => {
      const { options } = createBuildSWOptions(swType, {
        sourcemap: false,
        mode: 'production',
      })
      await expect(validateBuildSW(options)).resolves.toMatchObject({
        minify: true,
      })
    })

    it.each(swTypes)('default minify for %s is set to false when mode is development and sourcemap is false', async (swType) => {
      const { options } = createBuildSWOptions(swType, {
        mode: 'development',
        sourcemap: false,
      })
      await expect(validateBuildSW(options)).resolves.toMatchObject({
        minify: false,
      })
    })

    it.each(swTypes)('preserves explicit minify: false for %s even if sourcemap is enabled', async (swType) => {
      const { options } = createBuildSWOptions(swType, {
        sourcemap: true,
        minify: false,
      })
      await expect(validateBuildSW(options)).resolves.toMatchObject({
        minify: false,
      })
    })

    it.each(swTypes)('preserves explicit minify: true for %s even in development', async (swType) => {
      const { options } = createBuildSWOptions(swType, {
        mode: 'development',
        sourcemap: false,
        minify: true,
      })
      await expect(validateBuildSW(options)).resolves.toMatchObject({
        minify: true,
      })
    })
  })
})
