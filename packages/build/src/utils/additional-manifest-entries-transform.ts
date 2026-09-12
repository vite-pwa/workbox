import type { ManifestEntry } from '../types'
import type { InternalManifestEntry } from './types'
import { errors } from '../validation/errors'

interface AdditionalManifestEntriesTransform {
  (manifest: InternalManifestEntry[]): Promise<{
    manifest: InternalManifestEntry[]
    warnings: string[]
  }>
}

function addAdditionalManifestEntry(
  manifest: InternalManifestEntry[],
  stringEntries: Set<string>,
  additionalEntry: string | ManifestEntry,
): void {
  // Warn about either a string or an object that lacks a revision property.
  // (An object with a revision property set to null is okay.)
  if (typeof additionalEntry === 'string') {
    stringEntries.add(additionalEntry)
    manifest.push({
      revision: null,
      size: 0,
      url: additionalEntry,
    })
  }
  else {
    if (additionalEntry && additionalEntry.revision === undefined) {
      stringEntries.add(additionalEntry.url)
    }
    manifest.push(Object.assign({ size: 0 }, additionalEntry))
  }
}

export function additionalManifestEntriesTransform(
  additionalManifestEntries?: Array<ManifestEntry | string>,
  additionalManifestEntriesGenerator?: () => AsyncGenerator<ManifestEntry | string, undefined, void>,
): AdditionalManifestEntriesTransform {
  return async (manifest: InternalManifestEntry[]) => {
    const warnings: string[] = []
    const stringEntries = new Set<string>()

    if (additionalManifestEntries) {
      for (const additionalEntry of additionalManifestEntries) {
        addAdditionalManifestEntry(manifest, stringEntries, additionalEntry)
      }
    }

    if (additionalManifestEntriesGenerator) {
      for await (const additionalEntry of additionalManifestEntriesGenerator()) {
        addAdditionalManifestEntry(manifest, stringEntries, additionalEntry)
      }
    }

    if (stringEntries.size > 0) {
      let urls = '\n'
      for (const stringEntry of stringEntries) {
        urls += `  - ${stringEntry}\n`
      }

      warnings.push(errors['string-entry-warning'] + urls)
    }

    return {
      manifest,
      warnings,
    }
  }
}
