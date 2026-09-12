import type { GetManifestOptions, GetManifestResult } from '../types'
import path from 'node:path'
import process from 'node:process'
import { validateGetManifest } from '../validation/validation-helper'
import { generateManifestEntries } from './generate-manifest-entries'
import { deepMergeObject } from './utils'

export async function buildGetManifest(options: GetManifestOptions): Promise<GetManifestResult> {
  const optionsWithDefaults = await validateGetManifest(
    options,
  )

  deepMergeObject(
    options,
    optionsWithDefaults,
  )

  return await generateManifestEntries(
    options,
    path.resolve(process.cwd(), options.globDirectory),
  )
}
