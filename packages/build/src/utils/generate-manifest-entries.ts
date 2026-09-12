import type {
  BasePartial,
  GetManifestResult,
  GlobPartial,
  ManifestEntry,
} from '../types'
import type { FileDetails } from './get-file-details'
import type { InternalManifestEntry } from './types'
import { createHash } from 'node:crypto'
import { errors } from '../validation/errors'
import { getFileDetails } from './get-file-details'
import { checkInvalidPatterns, checkMaximumFileSizeToCacheExceeded } from './log'
import { migrateGlobsToPicomatch } from './migrate-globs-to-picomatch'
import { transformManifest } from './transform-manifest'

export async function generateManifestEntries(
  options: BasePartial & GlobPartial,
  globDirectory?: string,
): Promise<GetManifestResult> {
  if (!globDirectory) {
    return {
      count: 0,
      manifestEntries: [],
      size: 0,
      warnings: [],
    }
  }

  const globPatterns = options.globPatterns!
  const globIgnores = options.globIgnores!
  const globFollow = options.globFollow!

  const { patterns, ignore } = migrateGlobsToPicomatch({
    globPatterns,
    globIgnores,
  })

  const maxFileSize = typeof options.maximumFileSizeToCacheInBytes === 'number'
    ? options.maximumFileSizeToCacheInBytes
    : -1
  const maxFileSizeExceeded: (ManifestEntry & { size: number })[] = []

  let manifestEntries: InternalManifestEntry[] = []
  const urls = new Map<string, InternalManifestEntry>()
  const invalidPatterns: string[] = []

  let manifest: InternalManifestEntry
  for await (
    const {
      file,
      hash,
      size,
    } of getFileDetails(
      globDirectory,
      invalidPatterns,
      { globFollow, globIgnores: ignore, globPatterns: patterns },
    )
  ) {
    manifest = { url: file, revision: hash, size }
    urls.set(manifest.url, manifest)
    if (maxFileSize > -1 && manifest.size > maxFileSize) {
      maxFileSizeExceeded.push(manifest)
    }
    else {
      manifestEntries.push(manifest)
    }
  }

  const emptyGlobsMessage = checkInvalidPatterns(options.globStrict === true, invalidPatterns)

  if (options.globStrict && emptyGlobsMessage) {
    throw new Error(emptyGlobsMessage)
  }

  const maxSizeMessage = checkMaximumFileSizeToCacheExceeded(
    options.throwMaximumFileSizeToCacheInBytes === true,
    maxFileSize,
    maxFileSizeExceeded,
  )

  if (options.throwMaximumFileSizeToCacheInBytes && maxSizeMessage) {
    throw new Error(maxSizeMessage)
  }

  // tinyglobby is non-deterministic: avoid firing an unnecessary sw update on the client
  manifestEntries.sort(
    (a, b) => a.url.localeCompare(b.url),
  )

  const warnings = [emptyGlobsMessage, maxSizeMessage].filter(Boolean) as string[]

  const templatedURLs = options.templatedURLs

  if (templatedURLs) {
    for (const [url, dependencies] of Object.entries(templatedURLs)) {
      if (!urls.has(url)) {
        throw new Error(errors['templated-url-matches-glob'])
      }

      if (Array.isArray(dependencies)) {
        invalidPatterns.length = 0
        const details: FileDetails[] = []
        for await (
          const file of getFileDetails(
            globDirectory,
            invalidPatterns,
            { globFollow, globIgnores: ignore, globPatterns: dependencies },
          )
        ) {
          details.push(file)
        }
        if (details.length === 0) {
          throw new Error(
            `${errors['bad-template-urls-asset']} The glob `
            + `pattern '${dependencies.toString()}' did not match anything.`,
          )
        }
        let hashOfHashes = ''
        let totalSize = 0
        for (
          const {
            hash,
            size,
          } of details.sort(
            (a, b) => a.file.localeCompare(b.file),
          )
        ) {
          hashOfHashes += hash
          totalSize += size
        }
        urls.set(url, {
          url,
          revision: createHash('md5').update(hashOfHashes).digest('hex'),
          size: totalSize,
        })
      }
      else {
        urls.set(url, {
          url,
          revision: createHash('md5').update(dependencies).digest('hex'),
          size: 0,
        })
      }
    }
  }

  manifestEntries = await transformManifest({
    additionalManifestEntries: options.additionalManifestEntries,
    additionalManifestEntriesGenerator: options.additionalManifestEntriesGenerator,
    dontCacheBustURLsMatching: options.dontCacheBustURLsMatching,
    manifestTransforms: options.manifestTransforms,
    maximumFileSizeToCacheInBytes: options.maximumFileSizeToCacheInBytes,
    modifyURLPrefix: options.modifyURLPrefix,
    warnings,
    manifestEntries,
    failOnDuplicateManifestEntries: options.failOnDuplicateManifestEntries,
  })

  const size = manifestEntries.reduce((acc, entry) => acc + entry.size, 0)
  const count = manifestEntries.length

  return {
    count,
    size,
    manifestEntries: manifestEntries.map(({ size, ...rest }) => rest),
    warnings,
  }
}
