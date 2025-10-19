import type * as v from 'valibot'
import type { GenerateSWOptions, GetManifestOptions, InjectManifestOptions } from '../src/types'
import { describe, expect, expectTypeOf, it } from 'vitest'
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
    // @ts-expect-error - See comment at schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GenerateSWOptionsSchemaType>()
    expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).not.toThrow()
  })

  it('should fail if swDest is missing', () => {
    const options = {
      globDirectory: './',
    } satisfies Partial<GenerateSWOptions>
    expectTypeOf<typeof options>().not.toMatchObjectType<GenerateSWOptionsSchemaType>()
    expect(() => validate(GenerateSWOptionsSchema, options as any, 'generateSW')).toThrow(
      'generateSW() options validation failed: \n- The required option "swDest" is missing.',
    )
  })

  it('should pass with a function for manifestTransforms', () => {
    const options = {
      swDest: 'sw.js',
      globDirectory: './',
      manifestTransforms: [
        (manifest) => {
          // dummy transform
          return { manifest, warnings: [] }
        },
      ],
    } satisfies GenerateSWOptions
    // @ts-expect-error - See comment at schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GenerateSWOptionsSchemaType>()
    expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).not.toThrow()
  })

  it('should pass if globDirectory is missing but runtimeCaching is present', () => {
    const options = {
      swDest: 'sw.js',
      runtimeCaching: [
        {
          urlPattern: /.*/,
          handler: 'NetworkFirst' as const,
        },
      ],
    } satisfies GenerateSWOptions
    // @ts-expect-error - See comment at schema Type Inference Validation.
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
    // @ts-expect-error - See comment at schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GenerateSWOptionsSchemaType>()
    expect(() => validate(GenerateSWOptionsSchema, options, 'generateSW')).toThrow(
      'generateSW() options validation failed: \n- swDest must end with .js',
    )
  })
})

describe('getManifestOptions Schema Validation', () => {
  it('should pass with valid minimal options', () => {
    const options = {
      globDirectory: './',
    } satisfies GetManifestOptions
    // @ts-expect-error - See comment at schema Type Inference Validation.
    expectTypeOf<typeof options>().toMatchObjectType<GetManifestOptionsSchemaType>()
    expect(() => validate(GetManifestOptionsSchema, options, 'getManifest')).not.toThrow()
  })

  it('should fail if globDirectory is missing', () => {
    const options = {} satisfies Partial<GetManifestOptions>
    expectTypeOf<typeof options>().not.toMatchObjectType<GetManifestOptionsSchemaType>()
    expect(() => validate(GetManifestOptionsSchema, options as any, 'getManifest')).toThrow(
      'getManifest() options validation failed: \n- The required option "globDirectory" is missing.',
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
    // @ts-expect-error - See comment at schema Type Inference Validation.
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
      'injectManifest() options validation failed: \n- The required option "swSrc" is missing.',
    )
  })

  it('should fail if swDest does not end with .js', () => {
    const options = {
      swSrc: 'sw.js',
      swDest: 'sw-injected.txt',
      globDirectory: './',
    } satisfies InjectManifestOptions
    expectTypeOf<typeof options>().not.toMatchObjectType<InjectManifestOptionsSchemaType>()
    expect(() => validate(InjectManifestOptionsSchema, options, 'injectManifest')).toThrow(
      'injectManifest() options validation failed: \n- swDest must end with .js',
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
    expect(() => validate(InjectManifestOptionsSchema, options, 'injectManifest')).toThrow(
      'injectManifest() options validation failed: \n- The option "anotherUnknown" is unknown or has been deprecated.',
    )
  })
})
