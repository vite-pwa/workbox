import path from 'node:path'
import process from 'node:process'
import { normalizePath } from './resolve-sw-names'

export function resolveFrom(base: string, value: string): string {
  return normalizePath(path.isAbsolute(value) ? path.relative(base, value) : path.join(base, value))
}

export function resolveSWSrc(base: string, value: string): string {
  return normalizePath(path.isAbsolute(value) ? path.relative(base, value) : value)
}

export function resolveOutputPath(outputPath: string | undefined, fallbackCwd: string): string {
  return normalizePath(path.relative(
    process.cwd(),
    outputPath
      ? path.resolve(fallbackCwd, outputPath)
      : fallbackCwd,
  ))
}
