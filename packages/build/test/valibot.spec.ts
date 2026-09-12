import { deepMergeObject } from 'magicast/helpers'
import { expect, it } from 'vitest'
import { validateInjectManifest } from '../src/validation/validation-helper'
import { createInjectManifestOptions } from './test-helper'

it('check some options can be deactivated', async () => {
  let { options } = createInjectManifestOptions({
    injectionPoint: null,
  })
  let promise = validateInjectManifest(
    options,
  ).then((validatedOptions) => {
    deepMergeObject(options, validatedOptions)
    return options
  })
  await expect(promise).resolves.not.toThrow()
  await promise
  expect(options.injectionPoint).toBeNull()
  options = createInjectManifestOptions({
    injectionPoint: false,
  }).options
  promise = validateInjectManifest(
    options,
  ).then((validatedOptions) => {
    deepMergeObject(options, validatedOptions)
    return options
  })
  await expect(promise).resolves.not.toThrow()
  await promise
  expect(options.injectionPoint).toBe(false)
  options = createInjectManifestOptions({
    injectionPoint: '__dummy__',
  }).options
  promise = validateInjectManifest(
    options,
  ).then((validatedOptions) => {
    deepMergeObject(options, validatedOptions)
    return options
  })
  await expect(promise).resolves.not.toThrow()
  await promise
  expect(options.injectionPoint).toBe('__dummy__')
  options = createInjectManifestOptions().options
  promise = validateInjectManifest(
    options,
  ).then((validatedOptions) => {
    deepMergeObject(options, validatedOptions)
    return options
  })
  await expect(promise).resolves.not.toThrow()
  await promise
  expect(options.injectionPoint).toBe('self.__WB_MANIFEST')
})
