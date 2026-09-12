import type { GetManifestOptions } from '../types'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { glob } from 'tinyglobby'
import { errors } from '../validation/errors'

export interface FileDetails {
  file: string
  hash: string
  size: number
}

export async function* getFileDetails(
  globDirectory: string,
  warnings: string[],
  options: Pick<GetManifestOptions, 'globFollow' | 'globIgnores' | 'globPatterns'>,
): AsyncGenerator<FileDetails, undefined, void> {
  let files: string[]
  const patterns = options.globPatterns!
  const ignore = options.globIgnores!
  const followSymbolicLinks = options.globFollow!
  for (const pattern of patterns) {
    try {
      files = await glob(pattern, {
        cwd: globDirectory,
        ignore,
        onlyFiles: true,
        absolute: false,
        expandDirectories: false,
        followSymbolicLinks,
      })
    }
    catch (err) {
      throw new Error(
        `${errors['unable-to-glob-files']
        } '${err instanceof Error && err.message ? err.message : ''}'`,
      )
    }

    if (files.length === 0) {
      warnings.push(pattern)
    }
    for (const file of files) {
      const filePath = resolve(globDirectory!, file)
      const stats = await stat(filePath)
      // change this to use just node/crypto::hash in the future: node still recommends using createHash
      const hash = createHash('md5').update(await readFile(filePath)).digest('hex')
      yield { file: file.replace(/\\/g, '/'), hash, size: stats.size }
    }
  }
}
