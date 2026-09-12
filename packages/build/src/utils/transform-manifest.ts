import type { BasePartial, ManifestTransform } from '../types'
import type { InternalManifestEntry } from './types'
import { errors } from '../validation/errors'
import {
  additionalManifestEntriesTransform,
} from './additional-manifest-entries-transform'
import { createDuplicatedEntriesMessage } from './log'
import { modifyURLPrefixTransform } from './modify-url-prefix-transform'
import {
  noRevisionForURLsMatchingTransform,
} from './no-revision-for-urls-matching-transform'

export async function transformManifest({
  additionalManifestEntries,
  additionalManifestEntriesGenerator,
  dontCacheBustURLsMatching,
  manifestEntries,
  manifestTransforms,
  modifyURLPrefix,
  warnings,
  failOnDuplicateManifestEntries,
}: BasePartial & {
  manifestEntries: InternalManifestEntry[]
  warnings: string[]
}): Promise<InternalManifestEntry[]> {
  if (additionalManifestEntries || additionalManifestEntriesGenerator) {
    const staticTransform = additionalManifestEntriesTransform(
      additionalManifestEntries,
      additionalManifestEntriesGenerator,
    )
    const result = await staticTransform(manifestEntries)
    if (!('manifest' in result)) {
      throw new Error(errors['bad-manifest-transforms-return-value'])
    }
    manifestEntries = result.manifest
    if (result.warnings) {
      warnings.push(...result.warnings)
    }
  }

  const transformsToApply: ManifestTransform[] = []
  if (modifyURLPrefix) {
    transformsToApply.push(modifyURLPrefixTransform(modifyURLPrefix))
  }
  if (dontCacheBustURLsMatching) {
    transformsToApply.push(noRevisionForURLsMatchingTransform(dontCacheBustURLsMatching))
  }
  if (manifestTransforms) {
    transformsToApply.push(...manifestTransforms)
  }

  for (const transformer of transformsToApply) {
    const result = await transformer(manifestEntries)
    if (!('manifest' in result)) {
      throw new Error(errors['bad-manifest-transforms-return-value'])
    }
    manifestEntries = result.manifest
    if (result.warnings) {
      warnings.push(...result.warnings)
    }
  }

  const seen = new Set<string>()
  const duplicates: string[] = []
  for (const entry of manifestEntries) {
    if (seen.has(entry.url)) {
      duplicates.push(entry.url)
      continue
    }
    seen.add(entry.url)
  }

  if (duplicates.length > 0) {
    const message = createDuplicatedEntriesMessage(
      duplicates,
      failOnDuplicateManifestEntries === true,
    )
    if (failOnDuplicateManifestEntries) {
      throw new Error(message)
    }
    else {
      warnings.push(message)
    }
  }

  return manifestEntries
}
