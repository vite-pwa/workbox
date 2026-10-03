import type { BuildResult, GetManifestResult } from '@vite-pwa/workbox-build/types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { errStyle } from '@vite-pwa/workbox-build/utils/colors'

function logHeader(strategy: string, count: number, size: number): void {
  console.info(`${styleText('dim', 'strategy')}  ${styleText('magenta', strategy)}`)
  console.info(`${styleText('dim', 'precache')}  ${styleText('green', `${count} entries`)} ${styleText('dim', `(${(size / 1024).toFixed(2)} KiB)`)}`)
}

function logWarnings(warnings: ReadonlyArray<string>): void {
  if (warnings.length)
    console.warn(errStyle('yellow', `\n${errStyle('bold', 'PWA Warnings:')}\n${warnings.map(w => `  ! ${w}`).join('\n')}\n`))
}

export function reportBuildResult(strategy: string, result: BuildResult, root: string = process.cwd()): void {
  logHeader(strategy, result.count, result.size)
  console.info(`\n${styleText('green', '✓')} files generated:`)
  for (const filePath of result.filePaths) {
    const size = `${(fs.statSync(filePath).size / 1024).toFixed(2)} kB`
    console.info(`  ${styleText('dim', path.relative(root, filePath))}  ${styleText('bold', size)}`)
  }
  logWarnings(result.warnings)
}

export function reportManifest(result: GetManifestResult): void {
  logHeader('get-manifest', result.count, result.size)
  console.info(`\n${styleText('green', '✓')} manifest entries:`)
  for (const entry of result.manifestEntries)
    console.info(`  ${styleText('dim', entry.revision ?? '—')}  ${entry.url}`)
  logWarnings(result.warnings)
}
