import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import * as v from 'valibot'

export async function validateSWSrc(swSrc: string): Promise<boolean> {
  return await fs.lstat(path.resolve(process.cwd(), swSrc)).then(stats => stats.isFile()).catch(() => false)
}

export async function validateSWDestDirectory(swDest: string): Promise<boolean> {
  const swDestParent = path.dirname(path.resolve(process.cwd(), swDest))
  return await fs.lstat(swDestParent).then(stats => stats.isDirectory()).catch(() => false)
}

export async function validateGlobDirectory(globDirectory: string): Promise<boolean> {
  return await fs.lstat(globDirectory).then(stats => stats.isDirectory()).catch(() => false)
}

/**
 * Shared smart minify transformation
 */
export function withSmartMinify<T extends { mode?: string | null, sourcemap?: any, minify?: boolean }>() {
  return v.transformAsync(async (data: T) => {
    if (data.minify === undefined) {
      data.minify = data.mode === 'production' || data.sourcemap !== false
    }
    return data
  })
}
