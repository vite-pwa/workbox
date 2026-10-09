import type MagicString from 'magic-string'
import type { ManifestEntry } from '../../types'
import type { Bundler, ClassicBuild, CustomChunksInfo } from './bundler-types'
import path from 'node:path'
import remapping from '@jridgewell/remapping'
import { errStyle } from '../../utils/colors'
import { transformClassicChunk } from './transform-classic-chunk'

interface CheckManifestOptions {
  manifestEntries: ManifestEntry[]
  swChunks: Map<string, string[]>
  mappedChunkFiles: Map<string, string>
  baseUrl: string
}

function normalizeUrlEntry(entry: ManifestEntry, baseUrl: string): string {
  let url = entry.url.startsWith(baseUrl)
    ? entry.url.slice(baseUrl.length)
    : entry.url
  // integrations won't allow relative paths: ./ will be normalized to /
  // include this normalization here to ensure we check the correct file name
  // against the generated manifest entry url
  if (url.startsWith('.')) {
    url = url.slice(1)
  }
  else if (url.startsWith('..')) {
    url = url.slice(2)
  }
  return url.startsWith('/') ? url.slice(1) : url
}

function checkManifestEntries({
  baseUrl,
  manifestEntries,
  swChunks,
  mappedChunkFiles,
}: CheckManifestOptions) {
  if (manifestEntries.length === 0) {
    return
  }

  const swEntries = Array.from(swChunks.values()).reduce((acc, entry) => {
    for (const c of entry) {
      acc.add(c)
    }
    return acc
  }, new Set<string>())
  const swName = mappedChunkFiles.get('sw')
  if (swName) {
    swEntries.add(swName)
  }
  // normalize base only once, to avoid repeated string concatenation
  // at normalizeUrlEntry in the loop
  let base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  if (base.startsWith('.')) {
    base = base.slice(1)
  }
  else if (base.startsWith('..')) {
    base = base.slice(2)
  }
  const precacheEntriesFound = new Set<string>()
  for (const entry of manifestEntries) {
    const normalizedUrl = normalizeUrlEntry(entry, base)
    if (swEntries.has(normalizedUrl)) {
      precacheEntriesFound.add(normalizedUrl)
    }
  }
  if (precacheEntriesFound.size > 0) {
    const filesList = Array.from(precacheEntriesFound).map(file => `    • ${errStyle('yellow', file)}`).join('\n')
    throw new Error([
      `\n${errStyle(['red', 'bold'], '[Vite PWA]')} ${errStyle('red', 'Critical precache configuration conflict detected!')}\n`,
      `  The following Service Worker chunks or internal runtime dependencies are targeted for precaching:`,
      filesList,
      `\n  ${errStyle('cyan', 'Why is this an error?')}`,
      `  A Service Worker cannot precache itself or its own internal chunk dependencies.`,
      `  Including them inside "manifestEntries" will trigger redundant network requests and`,
      `  can cause severe caching or life-cycle issues during service worker registration.`,
      `\n  ${errStyle('green', 'How to fix:')}`,
      `  Please update your configuration to exclude these file patterns from precaching (e.g., using "globIgnores").`,
    ].join('\n'))
  }
}

type BundleType<T extends Bundler> = T extends 'rolldown'
  ? import('rolldown').OutputBundle
  : import('vite').Rolldown.OutputBundle

interface PrepareSWChunksOptions<T extends Bundler> {
  bundle: BundleType<T>
  destFolder: string
  customChunksInfo: CustomChunksInfo
  classicBuild: ClassicBuild
  writeFiles?: true
  baseUrl: string
}

export async function prepareSWChunks<T extends Bundler>({
  bundle,
  destFolder,
  customChunksInfo,
  classicBuild: {
    swType,
    swChunkName,
    filePaths,
    manifestEntries,
  },
  baseUrl,
}: PrepareSWChunksOptions<T>) {
  for (const chunk of Object.values(bundle)) {
    filePaths.push(path.resolve(destFolder, chunk.fileName))
    if (chunk.name && chunk.type === 'chunk') {
      customChunksInfo.importedFileChunks.set(chunk.fileName, chunk.name)
      let imports: string[] | undefined
      customChunksInfo.mappedChunkFiles.set(chunk.name, chunk.fileName)
      if (chunk.imports.length > 0) {
        imports = Array.from(chunk.imports)
      }
      if (imports) {
        customChunksInfo.mappedChunkImports.set(chunk.name, chunk.imports)
      }
      // add 'sw' chunk => we use temp sw names: self.__WB_MANIFEST already injected
      if (chunk.name === swChunkName) {
        customChunksInfo.importedFileChunks.set(chunk.fileName, 'sw')
        customChunksInfo.mappedChunkFiles.set('sw', chunk.fileName)
        if (imports) {
          customChunksInfo.mappedChunkImports.set('sw', chunk.imports)
        }
      }
    }
  }

  // check precache manifest entries against the generated chunk imports
  // to prevent critical misconfiguration
  checkManifestEntries({
    baseUrl,
    manifestEntries,
    mappedChunkFiles: customChunksInfo.mappedChunkFiles,
    swChunks: customChunksInfo.mappedChunkImports,
  })

  for (const chunk of Object.values(bundle)) {
    if (chunk.type !== 'chunk') {
      continue
    }

    let magicString: MagicString | undefined

    if (swType === 'classic') {
      // --- service worker ---
      if (chunk.name === swChunkName) {
        magicString = await transformClassicChunk(
          'sw',
          chunk.code,
          customChunksInfo,
        ).then(ms => ms)
      }
      // --- custom chunks ---
      else if (customChunksInfo.mappedChunkFiles.has(chunk.name)) {
        magicString = await transformClassicChunk(
          chunk.name,
          chunk.code,
          customChunksInfo,
        ).then(ms => ms)
      }
    }

    if (magicString?.hasChanged()) {
      chunk.code = magicString.toString()
      if (chunk.map) {
        // `hires: true` is required, or the composed map comes back empty.
        const step = magicString.generateMap({
          source: chunk.fileName,
          includeContent: true,
          hires: true,
        })

        // Casts to `any`: @jridgewell/remapping has its own SourceMap type
        // (RawSourceMap | DecodedSourceMap) that doesn't have a 1:1 match with either the output
        // of magic-string or the native SourceMap of rolldown. Runtime-compatible,
        // only type friction between 3 different libraries.
        const composedMap = remapping(
          [step as any, chunk.map as any],
          () => null,
        )

        // Assign the composed map, do not spread it. `toString()` lives on its
        // prototype, and spreading would leave you with `[object Object]`.
        chunk.map = composedMap as any

        // The emitted file comes from this asset, not from `chunk.map`.
        const asset = bundle[`${chunk.fileName}.map`]
        if (asset && asset.type === 'asset') {
          asset.source = composedMap.toString()
        }
      }
    }
  }
}
