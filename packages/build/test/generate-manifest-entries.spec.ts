import type {
  GenerateSWOptions,
  GetManifestOptions,
  InjectManifestOptions,
} from '../src/types'
import { deepMergeObject } from 'magicast/helpers'
import { describe, expect, it } from 'vitest'
import { generateManifestEntries } from '../src/utils/generate-manifest-entries'
import { validateGenerateSW, validateGetManifest, validateInjectManifest } from '../src/validation/validation-helper'
import {
  createGenerateSWOptions,
  createGetManifestOptions,
  createInjectManifestOptions,
  generateSWFixture,
  injectManifestFixture,
} from './test-helper'

describe('generate-manifest-entries results', () => {
  async function runWith<T extends GetManifestOptions | InjectManifestOptions | GenerateSWOptions<'classic'>>(
    createFn: (opts?: T) => { options: T },
    validateFn: (opts: T) => Promise<any>,
    customOptions: Partial<T> = {},
  ) {
    const { options } = createFn({
      globPatterns: ['**/*.{js,html}'],
      ...customOptions,
    } as T)
    const validated = await validateFn(options)
    deepMergeObject(options, validated)

    const promise = generateManifestEntries(options, options.globDirectory)
    await expect(promise).resolves.not.toThrow()
    const result = await promise

    return { options, result }
  }
  it ('get-manifest: handles generate-sw and inject-manifest fixtures correctly', async () => {
    const { result: r1 } = await runWith(createGetManifestOptions, validateGetManifest, {
      globDirectory: generateSWFixture,
    })
    expect(r1.manifestEntries.map(n => n.url)).toEqual(['index.html', 'index.js'])

    const { result: r2 } = await runWith(createGetManifestOptions, validateGetManifest, {
      globDirectory: injectManifestFixture,
    })
    expect(r2.manifestEntries.map(n => n.url)).toEqual(['custom-sw.js', 'index.html', 'index.js', 'sw.js'])

    const { result: r3 } = await runWith(createGetManifestOptions, validateGetManifest, {
      globDirectory: injectManifestFixture,
      globIgnores: ['custom-sw.js', 'sw.js'],
    })
    expect(r3.manifestEntries.map(n => n.url)).toEqual(['index.html', 'index.js'])
  })
  it ('generate-sw: handles generate-sw fixture correctly', async () => {
    const { result } = await runWith(
      () => createGenerateSWOptions('classic'),
      validateGenerateSW,
    )
    expect(result.manifestEntries.map(n => n.url)).toEqual(['index.html', 'index.js'])
  })
  it ('inject-manifest: handles inject-manifest fixture correctly', async () => {
    const { result: r1 } = await runWith(createInjectManifestOptions, validateInjectManifest)
    expect(r1.manifestEntries.map(n => n.url)).toEqual(['custom-sw.js', 'index.html', 'index.js', 'sw.js'])

    const { result: r2 } = await runWith(createInjectManifestOptions, validateInjectManifest, {
      globIgnores: ['custom-sw.js', 'sw.js'],
    })
    expect(r2.manifestEntries.map(n => n.url)).toEqual(['index.html', 'index.js'])
  })
})
