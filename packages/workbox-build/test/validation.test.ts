import type * as v from 'valibot'
import type { GenerateSWOptions, GetManifestOptions, InjectManifestOptions } from '../src/types'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { AsyncGenerateSWOptionsSchema } from '../src/validation/async-generate-sw'
import { AsyncGetManifestOptionsSchema } from '../src/validation/async-get-manifest'
import { AsyncInjectManifestOptionsSchema } from '../src/validation/async-inject-manifest'
import { errors } from '../src/validation/errors'
import { validateAsync } from '../src/validation/validation-helper'

type GenerateSWOptionsSchemaType = v.InferInput<typeof AsyncGenerateSWOptionsSchema>
type GetManifestOptionsSchemaType = v.InferInput<typeof AsyncGetManifestOptionsSchema>
type InjectManifestOptionsSchemaType = v.InferInput<typeof AsyncInjectManifestOptionsSchema>

describe('schema Type Inference Validation', () => {
  it('should correctly infer types that are compatible with the original Workbox types', () => {
    // @ts-expect-error - This is a type-level test. The IDE may complain because the nominal
    // types are different, but `expectTypeOf` checks for structural compatibility, which is what we care about.
    // This test will fail at COMPILE time if the schema's inferred type is not assignable to the original Workbox type.
    expectTypeOf<GenerateSWOptionsSchemaType>().toEqualTypeOf<GenerateSWOptions>()
    // @ts-expect-error - See comment above.
    expectTypeOf<GetManifestOptionsSchemaType>().toEqualTypeOf<GetManifestOptions>()
    // @ts-expect-error - See comment above.
    expectTypeOf<InjectManifestOptionsSchemaType>().toEqualTypeOf<InjectManifestOptions>()
  })
})

describe('generateSWOptions Schema Validation', () => {
  it('should pass with valid minimal options', async () => {
    const options = {
      swDest: 'sw.js',
      globDirectory: './',
    } satisfies GenerateSWOptions
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GenerateSWOptionsSchemaType>()
    await expect(validateAsync(AsyncGenerateSWOptionsSchema, options, 'generateSW')).resolves.not.toThrow()
  })

  it('should fail if swDest is missing', async () => {
    const options = {
      globDirectory: './',
    } satisfies Partial<GenerateSWOptions>
    expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
    await expect(validateAsync(AsyncGenerateSWOptionsSchema, options as any, 'generateSW')).rejects.toThrow(
      `generateSW() options validation failed: \n- The option "swDest" is required.`,
    )
  })

  it('should pass with a function for manifestTransforms', async () => {
    const options = {
      swDest: 'sw.js',
      globDirectory: './',
      manifestTransforms: [
        (manifest: any) => {
          return { manifest, warnings: [] }
        },
      ],
    } satisfies GenerateSWOptions
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GenerateSWOptionsSchemaType>()
    await expect(validateAsync(AsyncGenerateSWOptionsSchema, options, 'generateSW')).resolves.not.toThrow()
  })

  it('should fail if manifestTransforms contains a non-function', async () => {
    const options = {
      swDest: 'sw.js',
      globDirectory: './',
      manifestTransforms: ['not-a-function'],
    } satisfies Omit<GenerateSWOptions, 'manifestTransforms'> & { manifestTransforms: string[] }
    expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
    await expect(validateAsync(AsyncGenerateSWOptionsSchema, options as any, 'generateSW')).rejects.toThrow(
      'generateSW() options validation failed: \n- Each item in the "manifestTransforms" array must be a function (error at index 0).',
    )
  })

  it('should fail if manifestTransforms is a function instead of an array', async () => {
    const options = {
      swDest: 'sw.js',
      globDirectory: './',
      manifestTransforms: (manifest: any) => ({ manifest, warnings: [] }),
    } satisfies Omit<GenerateSWOptions, 'manifestTransforms'> & { manifestTransforms: (manifest: any) => void }
    expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
    await expect(validateAsync(AsyncGenerateSWOptionsSchema, options as any, 'generateSW')).rejects.toThrow(
      'generateSW() options validation failed: \n- The "manifestTransforms" option must be an array.',
    )
  })

  it('should pass if globDirectory is missing but runtimeCaching is present', async () => {
    const options = {
      swDest: 'sw.js',
      runtimeCaching: [
        {
          urlPattern: /.*/,
          handler: 'NetworkFirst',
        },
      ],
    } satisfies GenerateSWOptions
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GenerateSWOptionsSchemaType>()
    await expect(validateAsync(AsyncGenerateSWOptionsSchema, options, 'generateSW')).resolves.not.toThrow()
  })

  it('should fail if an unknown property is present', async () => {
    const options = {
      swDest: 'sw.js',
      globDirectory: './',
      importWorkboxFrom: 'cdn',
    } satisfies GenerateSWOptions & { importWorkboxFrom?: string }
    expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
    await expect(validateAsync(AsyncGenerateSWOptionsSchema, options as any, 'generateSW')).rejects.toThrow(
      'generateSW() options validation failed: \n- The option "importWorkboxFrom" is unknown or has been deprecated.',
    )
  })

  it('should fail if swDest does not end with .js', async () => {
    const options = {
      swDest: 'sw.txt',
      globDirectory: './',
    } satisfies GenerateSWOptions
    // The shape is valid, but the content is not.
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GenerateSWOptionsSchemaType>()
    await expect(validateAsync(AsyncGenerateSWOptionsSchema, options, 'generateSW')).rejects.toThrow(
      `generateSW() options validation failed: \n- ${errors['invalid-sw-dest-js-ext']}`,
    )
  })

  describe('runtimeCaching validation', () => {
    it('should pass with a valid runtimeCaching entry', async () => {
      const options = {
        swDest: 'sw.js',
        globDirectory: './',
        runtimeCaching: [{
          urlPattern: /.*/,
          handler: 'NetworkFirst',
        }],
      } satisfies GenerateSWOptions
      // @ts-expect-error - schema Type Inference Validation.
      expectTypeOf<typeof options>().toMatchObjectType<GenerateSWOptionsSchemaType>()
      await expect(validateAsync(AsyncGenerateSWOptionsSchema, options, 'generateSW')).resolves.not.toThrow()
    })

    it('should fail if runtimeCaching is not an array (string)', async () => {
      const options = {
        swDest: 'sw.js',
        globDirectory: './',
        runtimeCaching: 'a-string-not-an-array',
      } satisfies Omit<GenerateSWOptions, 'runtimeCaching'> & { runtimeCaching: string }
      expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
      await expect(validateAsync(AsyncGenerateSWOptionsSchema, options, 'generateSW')).rejects.toThrow(
        'generateSW() options validation failed: \n- The "runtimeCaching" option must be an array.',
      )
    })

    it('should fail if a runtimeCaching entry is missing a handler', async () => {
      const options = {
        swDest: 'sw.js',
        globDirectory: './',
        runtimeCaching: [{
          urlPattern: /.*/,
        }],
      } satisfies Omit<GenerateSWOptions, 'runtimeCaching'> & { runtimeCaching: { urlPattern: RegExp }[] }
      expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
      await expect(validateAsync(AsyncGenerateSWOptionsSchema, options, 'generateSW')).rejects.toThrow(
        'generateSW() options validation failed: \n- The option "runtimeCaching.0.handler" is required.',
      )
    })

    it('should fail if a runtimeCaching entry has an invalid handler type', async () => {
      const options = {
        swDest: 'sw.js',
        globDirectory: './',
        runtimeCaching: [{
          urlPattern: /.*/,
          handler: 123,
        }],
      } satisfies Omit<GenerateSWOptions, 'runtimeCaching'> & { runtimeCaching: { urlPattern: RegExp, handler: number }[] }
      expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
      await expect(validateAsync(AsyncGenerateSWOptionsSchema, options, 'generateSW')).rejects.toThrow(
        'generateSW() options validation failed: \n- Invalid "handler" option in runtimeCaching[0]. Invalid type: Expected (Function | Object | ("CacheFirst" | "CacheOnly" | "NetworkFirst" | "NetworkOnly" | "StaleWhileRevalidate")) but received 123.',
      )
    })

    it('should fail if a runtimeCaching entry has an invalid handler string value', async () => {
      const options = {
        swDest: 'sw.js',
        globDirectory: './',
        runtimeCaching: [{
          urlPattern: /.*/,
          handler: 'InvalidStrategy',
        }],
      } satisfies Omit<GenerateSWOptions, 'runtimeCaching'> & { runtimeCaching: { urlPattern: RegExp, handler: 'InvalidStrategy' }[] }
      expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
      await expect(validateAsync(AsyncGenerateSWOptionsSchema, options, 'generateSW')).rejects.toThrow(
        'generateSW() options validation failed: \n- Invalid "handler" option in runtimeCaching[0]. Invalid type: Expected (Function | Object | ("CacheFirst" | "CacheOnly" | "NetworkFirst" | "NetworkOnly" | "StaleWhileRevalidate")) but received "InvalidStrategy"',
      )
    })
  })
})

describe('getManifestOptions Schema Validation', () => {
  it('should pass with valid minimal options', async () => {
    const options = {
      globDirectory: './',
    } satisfies GetManifestOptions
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GetManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncGetManifestOptionsSchema, options, 'getManifest')).resolves.not.toThrow()
  })

  it('should fail if globDirectory is missing', async () => {
    const options = {} satisfies Partial<GetManifestOptions>
    expectTypeOf<typeof options>().not.toMatchObjectType<GetManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncGetManifestOptionsSchema, options as any, 'getManifest')).rejects.toThrow(
      'getManifest() options validation failed: \n- The option "globDirectory" is required.',
    )
  })

  it('should fail if manifestTransforms contains a non-function', async () => {
    const options = {
      globDirectory: './',
      manifestTransforms: ['not-a-function'],
    } satisfies Omit<GetManifestOptions, 'manifestTransforms'> & { manifestTransforms: string[] }
    expectTypeOf<typeof options>().not.toMatchObjectType<GetManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncGetManifestOptionsSchema, options as any, 'getManifest')).rejects.toThrow(
      'getManifest() options validation failed: \n- Each item in the "manifestTransforms" array must be a function (error at index 0).',
    )
  })

  it('should fail if manifestTransforms is a function instead of an array', async () => {
    const options = {
      globDirectory: './',
      manifestTransforms: (manifest: any) => ({ manifest, warnings: [] }),
    } satisfies Omit<GetManifestOptions, 'manifestTransforms'> & { manifestTransforms: (manifest: any) => void }
    expectTypeOf<typeof options>().not.toMatchObjectType<GetManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncGetManifestOptionsSchema, options as any, 'getManifest')).rejects.toThrow(
      'getManifest() options validation failed: \n- The "manifestTransforms" option must be an array.',
    )
  })

  it('should fail if an unknown property is present', async () => {
    const options = {
      globDirectory: './',
      anotherUnknown: 'noop',
    } satisfies GetManifestOptions & { anotherUnknown?: string }
    expectTypeOf<typeof options>().not.toMatchObjectType<GetManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncGetManifestOptionsSchema, options as any, 'getManifest')).rejects.toThrow(
      'getManifest() options validation failed: \n- The option "anotherUnknown" is unknown or has been deprecated.',
    )
  })
})

describe('injectManifestOptions Schema Validation', () => {
  it('should pass with valid minimal options', async () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.js',
      globDirectory: './',
    } satisfies InjectManifestOptions
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<InjectManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncInjectManifestOptionsSchema, options, 'injectManifest')).resolves.not.toThrow()
  })

  it('should fail if swSrc is missing', async () => {
    const options = {
      swDest: 'sw-injected.js',
      globDirectory: './',
    } satisfies Partial<InjectManifestOptions>
    expectTypeOf<typeof options>().not.toMatchObjectType<InjectManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncInjectManifestOptionsSchema, options as any, 'injectManifest')).rejects.toThrow(
      'injectManifest() options validation failed: \n- The option "swSrc" is required.',
    )
  })

  it('should fail if manifestTransforms contains a non-function', async () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.js',
      globDirectory: './',
      manifestTransforms: ['not-a-function'],
    } satisfies Omit<InjectManifestOptions, 'manifestTransforms'> & { manifestTransforms: string[] }
    expectTypeOf<typeof options>().not.toMatchObjectType<InjectManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncInjectManifestOptionsSchema, options as any, 'injectManifest')).rejects.toThrow(
      'injectManifest() options validation failed: \n- Each item in the "manifestTransforms" array must be a function (error at index 0).',
    )
  })

  it('should fail if manifestTransforms is a function instead of an array', async () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.js',
      globDirectory: './',
      manifestTransforms: (manifest: any) => ({ manifest, warnings: [] }),
    } satisfies Omit<InjectManifestOptions, 'manifestTransforms'> & { manifestTransforms: (manifest: any) => void }
    expectTypeOf<typeof options>().not.toMatchObjectType<InjectManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncInjectManifestOptionsSchema, options as any, 'injectManifest')).rejects.toThrow(
      'injectManifest() options validation failed: \n- The "manifestTransforms" option must be an array.',
    )
  })

  it('should fail if swDest does not end with .js', async () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.txt',
      globDirectory: './',
    } satisfies InjectManifestOptions
    // The shape is valid, but the content is not.
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<InjectManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncInjectManifestOptionsSchema, options, 'injectManifest')).rejects.toThrow(
      `injectManifest() options validation failed: \n- ${errors['invalid-sw-dest-js-ext']}`,
    )
  })

  it('should fail if an unknown property is present', async () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.js',
      globDirectory: './',
      anotherUnknown: 'noop',
    } satisfies InjectManifestOptions & { anotherUnknown?: string }
    expectTypeOf<typeof options>().not.toMatchObjectType<InjectManifestOptionsSchemaType>()
    await expect(validateAsync(AsyncInjectManifestOptionsSchema, options as any, 'injectManifest')).rejects.toThrow(
      'injectManifest() options validation failed: \n- The option "anotherUnknown" is unknown or has been deprecated.',
    )
  })
})
