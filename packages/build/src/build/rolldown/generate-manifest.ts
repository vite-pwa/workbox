import type { RolldownOutput } from 'rolldown'
import type { RolldownBuildOptions } from './internal-types'
import fsp from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

// simplified version from:
// https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/manifest.ts
interface ManifestChunk {
  /**
   * The input file name of this chunk / asset if known
   */
  src?: string
  /**
   * The output file name of this chunk / asset
   */
  file: string
  /**
   * Whether this chunk or asset is an entry point
   */
  isEntry?: boolean
  /**
   * The name of this chunk / asset if known
   */
  name?: string
  /**
   * The list of statically imported chunks by this chunk
   *
   * The values are the keys of the manifest. This field is only present in JS chunks.
   */
  imports?: string[]
}

type Manifest = Record<string, ManifestChunk>

export async function generateManifest(
  manifestName: string,
  options: RolldownBuildOptions,
  output: RolldownOutput,
) {
  const swManifest: Manifest = {}

  const {
    swSrc,
    swChunkName,
    swDest,
  } = options

  for (const chunkOrAsset of output.output) {
    if (chunkOrAsset.type === 'chunk') {
      const fileName = chunkOrAsset.fileName
      if (chunkOrAsset.isEntry && chunkOrAsset.name === swChunkName) {
        swManifest[swSrc] = {
          file: path.basename(swDest),
          name: chunkOrAsset.name,
          src: swSrc,
          isEntry: true,
          imports: chunkOrAsset.imports.map(i => `_${i}`),
        }
      }
      else {
        swManifest[`_${fileName}`] = {
          file: fileName,
          name: chunkOrAsset.name,
          ...(chunkOrAsset.imports.length > 0
            ? {
                imports: chunkOrAsset.imports.map(i => `_${i}`),
              }
            : {}),
        }
      }
    }
  }

  const outDir = path.dirname(path.resolve(process.cwd(), swDest))
  const name = path.resolve(outDir, manifestName)
  const outputDir = path.dirname(name)
  await fsp.mkdir(outputDir, { recursive: true })
  await fsp.writeFile(
    name,
    JSON.stringify(swManifest, null, 2),
    'utf8',
  )
}
