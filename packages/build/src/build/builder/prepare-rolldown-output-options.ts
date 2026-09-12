import type {
  Bundler,
  BundlerPluginType,
  ClassicBuild,
  PrepareBundlerBuilder,
  RolldownOptions,
} from './bundler-types'
import path from 'node:path'
import process from 'node:process'
import { includeRolldownOxcPlugin } from './detector'
import { prepareCodeSplittingGroups } from './prepare-code-splitting-groups'
import { prepareDefineOptions } from './prepare-define-options'
import { RolldownPlugin } from './rolldown-plugin'

export async function prepareRolldownOutputOptions<B extends Bundler>(
  bundler: B,
  options: RolldownOptions<B>,
): Promise<PrepareBundlerBuilder<B>> {
  const swName = path.basename(options.swDest)
  const destFolder = path.dirname(options.swDest)

  const {
    sourcemap,
    originalSWType,
    swType,
    swSrc,
    swDest,
    swChunkName,
    minify,
    inlineWorkboxRuntime,
    workboxRuntimeCompatible,
    plugins = [],
    generateSW,
    generateSWCode,
    filePaths,
    manifestEntries,
    chunkNames = '-',
    sources,
  } = options

  const sep = chunkNames === 'dot' ? '.' : '-'

  const define = await prepareDefineOptions(
    options,
  )

  const workboxName = inlineWorkboxRuntime !== true
    ? (inlineWorkboxRuntime.workboxChunkName || (
        swType === 'classic'
          ? 'workbox-classic'
          : 'workbox-module'
      ))
    : undefined

  // DON'T ADD sourcemap, minify and dir here: will break vite sourcemap
  const rolldownOptions: import('rolldown').OutputOptions = {
    format: 'esm',
    comments: {
      legal: !minify,
      jsdoc: false,
      annotation: false,
    },
    cleanDir: false,
    hashCharacters: workboxRuntimeCompatible ? 'hex' : undefined,
    chunkFileNames: (chunk) => {
      return workboxName && chunk.name === workboxName
        ? `${workboxName}${sep}[hash].js`
        : `[name]${sep}[hash].js`
    },
    assetFileNames: `[name]${sep}[hash].[ext]`,
    entryFileNames: (chunk) => {
      return chunk.name === swChunkName
        ? swName
        : `[name]${sep}[hash].js`
    },
  }

  const classicBuild: ClassicBuild = {
    swType,
    filePaths,
    generateSW,
    generateSWCode,
    swChunkName,
    workboxName,
    manifestEntries,
    addChunksSuffixes: originalSWType === 'classic-and-module' || !workboxRuntimeCompatible,
  }

  const customChunksInfo = prepareCodeSplittingGroups(
    options,
    rolldownOptions,
    classicBuild,
    workboxName,
  )

  plugins.unshift(RolldownPlugin(
    sources,
    {
      swType,
      bundler,
      destFolder,
      customChunksInfo,
      classicBuild,
      sourcemap,
    },
    swSrc,
  ))

  if (bundler === 'rolldown') {
    if (includeRolldownOxcPlugin()) {
      plugins.unshift(await import('./rolldown-render-chunk-plugin').then(({
        RolldownRenderChunkPlugin,
      }) => RolldownRenderChunkPlugin(
        define,
        sourcemap,
      )))
    }
    rolldownOptions.sourcemap = sourcemap
    rolldownOptions.minify = minify
    rolldownOptions.topLevelVar = true
    rolldownOptions.dir = path.resolve(
      process.cwd(),
      path.dirname(swDest),
    )
  }

  return {
    define,
    plugins: plugins as BundlerPluginType<B>[],
    rolldownOptions,
  }
}
