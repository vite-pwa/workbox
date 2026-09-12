import type MagicString from 'magic-string'
import type { ManifestEntry } from '../../types'
import type { Bundler, ClassicBuild, CustomChunksInfo } from './bundler-types'
import path from 'node:path'
import remapping from '@jridgewell/remapping'
import pc from 'picocolors'
import { transformClassicChunk } from './transform-classic-chunk'

interface CheckManifestOptions {
  manifestEntries: ManifestEntry[]
  swChunks: Map<string, string[]>
}

function checkManifestEntries({
  manifestEntries,
  swChunks,
}: CheckManifestOptions) {
  if (manifestEntries.length === 0 || swChunks.size === 0) {
    return
  }

  const swEntries = Array.from(swChunks.values()).reduce((acc, entry) => {
    for (const c of entry) {
      acc.add(c)
    }
    return acc
  }, new Set<string>())
  const precacheEntriesFound = new Set<string>()
  for (const entry of manifestEntries) {
    if (swEntries.has(entry.url)) {
      precacheEntriesFound.add(entry.url)
    }
  }
  if (precacheEntriesFound.size > 0) {
    const filesList = Array.from(precacheEntriesFound).map(file => `    • ${pc.yellow(file)}`).join('\n')
    throw new Error([
      `\n${pc.red(pc.bold('[Vite PWA]'))} ${pc.red('Critical precache configuration conflict detected!')}\n`,
      `  The following Service Worker chunks or internal runtime dependencies are targeted for precaching:`,
      filesList,
      `\n  ${pc.cyan('Why is this an error?')}`,
      `  A Service Worker cannot precache itself or its own internal chunk dependencies.`,
      `  Including them inside "manifestEntries" will trigger redundant network requests and`,
      `  can cause severe caching or life-cycle issues during service worker registration.`,
      `\n  ${pc.green('How to fix:')}`,
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
    manifestEntries,
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
