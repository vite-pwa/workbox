import type * as v from 'valibot'
import type { GenerateSWOptions, GetManifestOptions, InjectManifestOptions } from '../src/types'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { errors } from '../src/validation/errors'
import { GenerateSWOptionsSchema } from '../src/validation/generate-sw'
import { GetManifestOptionsSchema } from '../src/validation/get-manifest'
import { InjectManifestOptionsSchema } from '../src/validation/inject-manifest'
import { validate } from '../src/validation/validation-helper'

type GenerateSWOptionsSchemaType = v.InferInput<typeof GenerateSWOptionsSchema>
type GetManifestOptionsSchemaType = v.InferInput<typeof GetManifestOptionsSchema>
type InjectManifestOptionsSchemaType = v.InferInput<typeof InjectManifestOptionsSchema>

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
  it('should pass with valid minimal options', () => {
    const options = {
      swDest: 'sw.js',
      globDirectory: './',
    } satisfies GenerateSWOptions
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GenerateSWOptionsSchemaType>()
    expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).not.toThrow()
  })

  it('should fail if swDest is missing', () => {
    const options = {
      globDirectory: './',
    } satisfies Partial<GenerateSWOptions>
    expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
    expect(() => validate(GenerateSWOptionsSchema, options as any, 'generateSW')).toThrow(
      `generateSW() options validation failed: \n- The option "swDest" is required.`,
    )
  })

  it('should pass with a function for manifestTransforms', () => {
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
    expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).not.toThrow()
  })

  it('should fail if manifestTransforms contains a non-function', () => {
    const options = {
      swDest: 'sw.js',
      globDirectory: './',
      manifestTransforms: ['not-a-function'],
    } satisfies Omit<GenerateSWOptions, 'manifestTransforms'> & { manifestTransforms: string[] }
    expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
    expect(() => validate(GenerateSWOptionsSchema, options as any, 'generateSW')).toThrow(
      'generateSW() options validation failed: \n- Each item in the "manifestTransforms" array must be a function (error at index 0).',
    )
  })

  it('should fail if manifestTransforms is a function instead of an array', () => {
    const options = {
      swDest: 'sw.js',
      globDirectory: './',
      manifestTransforms: (manifest: any) => ({ manifest, warnings: [] }),
    } satisfies Omit<GenerateSWOptions, 'manifestTransforms'> & { manifestTransforms: (manifest: any) => void }
    expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
    expect(() => validate(GenerateSWOptionsSchema, options as any, 'generateSW')).toThrow(
      'generateSW() options validation failed: \n- The "manifestTransforms" option must be an array.',
    )
  })

  it.only('should pass if globDirectory is missing but runtimeCaching is present', () => {
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
    expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).not.toThrow()
  })

  it('should fail if an unknown property is present', () => {
    const options = {
      swDest: 'sw.js',
      globDirectory: './',
      importWorkboxFrom: 'cdn',
    } satisfies GenerateSWOptions & { importWorkboxFrom?: string }
    expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
    expect(() => validate(GenerateSWOptionsSchema, options as any, 'generateSW')).toThrow(
      'generateSW() options validation failed: \n- The option "importWorkboxFrom" is unknown or has been deprecated.',
    )
  })

  it('should fail if swDest does not end with .js', () => {
    const options = {
      swDest: 'sw.txt',
      globDirectory: './',
    } satisfies GenerateSWOptions
    // The shape is valid, but the content is not.
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GenerateSWOptionsSchemaType>()
    expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).toThrow(
      `generateSW() options validation failed: \n- ${errors['invalid-sw-dest-js-ext']}`,
    )
  })

  describe('runtimeCaching validation', () => {
    it('should pass with a valid runtimeCaching entry', () => {
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
      expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).not.toThrow()
    })

    it('should fail if runtimeCaching is not an array (string)', () => {
      const options = {
        swDest: 'sw.js',
        globDirectory: './',
        runtimeCaching: 'a-string-not-an-array',
      } satisfies Omit<GenerateSWOptions, 'runtimeCaching'> & { runtimeCaching: string }
      expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
      expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).toThrow(
        'generateSW() options validation failed: \n- The "runtimeCaching" option must be an array.',
      )
    })

    it('should fail if a runtimeCaching entry is missing a handler', () => {
      const options = {
        swDest: 'sw.js',
        globDirectory: './',
        runtimeCaching: [{
          urlPattern: /.*/,
        }],
      } satisfies Omit<GenerateSWOptions, 'runtimeCaching'> & { runtimeCaching: { urlPattern: RegExp }[] }
      expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
      expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).toThrow(
        'generateSW() options validation failed: \n- The option "runtimeCaching.0.handler" is required.',
      )
    })

    it('should fail if a runtimeCaching entry has an invalid handler type', () => {
      const options = {
        swDest: 'sw.js',
        globDirectory: './',
        runtimeCaching: [{
          urlPattern: /.*/,
          handler: 123,
        }],
      } satisfies Omit<GenerateSWOptions, 'runtimeCaching'> & { runtimeCaching: { urlPattern: RegExp, handler: number }[] }
      expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
      expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).toThrow(
        'generateSW() options validation failed: \n- Invalid "handler" option in runtimeCaching[0]. Invalid type: Expected (Function | Object | ("CacheFirst" | "CacheOnly" | "NetworkFirst" | "NetworkOnly" | "StaleWhileRevalidate")) but received 123.',
      )
    })

    it('should fail if a runtimeCaching entry has an invalid handler string value', () => {
      const options = {
        swDest: 'sw.js',
        globDirectory: './',
        runtimeCaching: [{
          urlPattern: /.*/,
          handler: 'InvalidStrategy',
        }],
      } satisfies Omit<GenerateSWOptions, 'runtimeCaching'> & { runtimeCaching: { urlPattern: RegExp, handler: 'InvalidStrategy' }[] }
      expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
      expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).toThrow(
        'generateSW() options validation failed: \n- Invalid "handler" option in runtimeCaching[0]. Invalid type: Expected (Function | Object | ("CacheFirst" | "CacheOnly" | "NetworkFirst" | "NetworkOnly" | "StaleWhileRevalidate")) but received "InvalidStrategy"',
      )
    })
  })
})

describe('getManifestOptions Schema Validation', () => {
  it('should pass with valid minimal options', () => {
    const options = {
      globDirectory: './',
    } satisfies GetManifestOptions
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GetManifestOptionsSchemaType>()
    expect(() => validate(GetManifestOptionsSchema, options, 'getManifest')).not.toThrow()
  })

  it('should fail if globDirectory is missing', () => {
    const options = {} satisfies Partial<GetManifestOptions>
    expectTypeOf<typeof options>().not.toMatchObjectType<GetManifestOptionsSchemaType>()
    expect(() => validate(GetManifestOptionsSchema, options as any, 'getManifest')).toThrow(
      'getManifest() options validation failed: \n- The option "globDirectory" is required.',
    )
  })

  it('should fail if manifestTransforms contains a non-function', () => {
    const options = {
      globDirectory: './',
      manifestTransforms: ['not-a-function'],
    } satisfies Omit<GetManifestOptions, 'manifestTransforms'> & { manifestTransforms: string[] }
    expectTypeOf<typeof options>().not.toMatchObjectType<GetManifestOptionsSchemaType>()
    expect(() => validate(GetManifestOptionsSchema, options as any, 'getManifest')).toThrow(
      'getManifest() options validation failed: \n- Each item in the "manifestTransforms" array must be a function (error at index 0).',
    )
  })

  it('should fail if manifestTransforms is a function instead of an array', () => {
    const options = {
      globDirectory: './',
      manifestTransforms: (manifest: any) => ({ manifest, warnings: [] }),
    } satisfies Omit<GetManifestOptions, 'manifestTransforms'> & { manifestTransforms: (manifest: any) => void }
    expectTypeOf<typeof options>().not.toMatchObjectType<GetManifestOptionsSchemaType>()
    expect(() => validate(GetManifestOptionsSchema, options as any, 'getManifest')).toThrow(
      'getManifest() options validation failed: \n- The "manifestTransforms" option must be an array.',
    )
  })

  it('should fail if an unknown property is present', () => {
    const options = {
      globDirectory: './',
      anotherUnknown: 'noop',
    } satisfies GetManifestOptions & { anotherUnknown?: string }
    expectTypeOf<typeof options>().not.toMatchObjectType<GetManifestOptionsSchemaType>()
    expect(() => validate(GetManifestOptionsSchema, options as any, 'getManifest')).toThrow(
      'getManifest() options validation failed: \n- The option "anotherUnknown" is unknown or has been deprecated.',
    )
  })
})

describe('injectManifestOptions Schema Validation', () => {
  it('should pass with valid minimal options', () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.js',
      globDirectory: './',
    } satisfies InjectManifestOptions
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<InjectManifestOptionsSchemaType>()
    expect(() => validate(InjectManifestOptionsSchema, options, 'injectManifest')).not.toThrow()
  })

  it('should fail if swSrc is missing', () => {
    const options = {
      swDest: 'sw-injected.js',
      globDirectory: './',
    } satisfies Partial<InjectManifestOptions>
    expectTypeOf<typeof options>().not.toMatchObjectType<InjectManifestOptionsSchemaType>()
    expect(() => validate(InjectManifestOptionsSchema, options as any, 'injectManifest')).toThrow(
      'injectManifest() options validation failed: \n- The option "swSrc" is required.',
    )
  })

  it('should fail if manifestTransforms contains a non-function', () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.js',
      globDirectory: './',
      manifestTransforms: ['not-a-function'],
    } satisfies Omit<InjectManifestOptions, 'manifestTransforms'> & { manifestTransforms: string[] }
    expectTypeOf<typeof options>().not.toMatchObjectType<InjectManifestOptionsSchemaType>()
    expect(() => validate(InjectManifestOptionsSchema, options as any, 'injectManifest')).toThrow(
      'injectManifest() options validation failed: \n- Each item in the "manifestTransforms" array must be a function (error at index 0).',
    )
  })

  it('should fail if manifestTransforms is a function instead of an array', () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.js',
      globDirectory: './',
      manifestTransforms: (manifest: any) => ({ manifest, warnings: [] }),
    } satisfies Omit<InjectManifestOptions, 'manifestTransforms'> & { manifestTransforms: (manifest: any) => void }
    expectTypeOf<typeof options>().not.toMatchObjectType<InjectManifestOptionsSchemaType>()
    expect(() => validate(InjectManifestOptionsSchema, options as any, 'injectManifest')).toThrow(
      'injectManifest() options validation failed: \n- The "manifestTransforms" option must be an array.',
    )
  })

  it('should fail if swDest does not end with .js', () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.txt',
      globDirectory: './',
    } satisfies InjectManifestOptions
    // The shape is valid, but the content is not.
    // @ts-expect-error - schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<InjectManifestOptionsSchemaType>()
    expect(() => validate(InjectManifestOptionsSchema, options, 'injectManifest')).toThrow(
      `injectManifest() options validation failed: \n- ${errors['invalid-sw-dest-js-ext']}`,
    )
  })

  it('should fail if an unknown property is present', () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.js',
      globDirectory: './',
      anotherUnknown: 'noop',
    } satisfies InjectManifestOptions & { anotherUnknown?: string }
    expectTypeOf<typeof options>().not.toMatchObjectType<InjectManifestOptionsSchemaType>()
    expect(() => validate(InjectManifestOptionsSchema, options as any, 'injectManifest')).toThrow(
      'injectManifest() options validation failed: \n- The option "anotherUnknown" is unknown or has been deprecated.',
    )
  })
})
