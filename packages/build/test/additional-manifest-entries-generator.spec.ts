import type { ManifestEntry } from '../src/types'
import { describe, expect, it } from 'vitest'
import { generateManifestEntries } from '../src/utils/generate-manifest-entries'
import { generateSWFixture } from './test-helper'

async function* additionalManifestEntriesGenerator(): AsyncGenerator<string | ManifestEntry, undefined, void> {
  yield { url: '/duplicate.js', revision: 'generator' }
  yield { url: '/unique.js', revision: 'unique' }
}

async function* duplicateEntryGenerator(): AsyncGenerator<string | ManifestEntry, undefined, void> {
  yield { url: '/duplicate.js', revision: 'generator' }
}

describe('failOnDuplicateManifestEntries', () => {
  it('should throw an error listing duplicates when failOnDuplicateManifestEntries is true', async () => {
    const promise = generateManifestEntries(
      {
        globPatterns: ['**/*.js'],
        additionalManifestEntries: [{ url: '/duplicate.js', revision: 'static' }],
        additionalManifestEntriesGenerator,
        failOnDuplicateManifestEntries: true,
      },
      generateSWFixture,
    )
    await expect(promise).rejects.toBeDefined()
    const error = await promise.catch(error => error)
    expect(error).toBeDefined()
    expect(error.toString()).toMatch(/Duplicate precache manifest entries found!/)
    expect(error.toString()).toMatch(/\/duplicate\.js/)
  })

  it('should allow duplicates when failOnDuplicateManifestEntries is false (default)', async () => {
    const promise = generateManifestEntries(
      {
        globPatterns: ['**/*.js'],
        additionalManifestEntries: [{ url: '/duplicate.js', revision: 'static' }],
        additionalManifestEntriesGenerator: duplicateEntryGenerator,
        failOnDuplicateManifestEntries: false,
      },
      generateSWFixture,
    )

    await expect(promise).resolves.not.toThrow()
    const result = await promise
    const duplicateEntries = result.manifestEntries.filter(e => e.url === '/duplicate.js')
    expect(duplicateEntries).toHaveLength(2)
    expect(duplicateEntries).toContainEqual(expect.objectContaining({ revision: 'static' }))
    expect(duplicateEntries).toContainEqual(expect.objectContaining({ revision: 'generator' }))
  })
})
