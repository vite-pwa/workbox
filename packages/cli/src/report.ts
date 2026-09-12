import type { BuildResult, GetManifestResult } from '@vite-pwa/workbox-build/types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pc from 'picocolors'

function logHeader(strategy: string, count: number, size: number): void {
  console.info(`${pc.dim('strategy')}  ${pc.magenta(strategy)}`)
  console.info(`${pc.dim('precache')}  ${pc.green(`${count} entries`)} ${pc.dim(`(${(size / 1024).toFixed(2)} KiB)`)}`)
}

function logWarnings(warnings: ReadonlyArray<string>): void {
  if (warnings.length)
    console.warn(pc.yellow(`\n${pc.bold('PWA Warnings:')}\n${warnings.map(w => `  ! ${w}`).join('\n')}\n`))
}

export function reportBuildResult(strategy: string, result: BuildResult, root: string = process.cwd()): void {
  logHeader(strategy, result.count, result.size)
  console.info(`\n${pc.green('✓')} files generated:`)
  for (const filePath of result.filePaths) {
    const size = `${(fs.statSync(filePath).size / 1024).toFixed(2)} kB`
    console.info(`  ${pc.dim(path.relative(root, filePath))}  ${pc.bold(size)}`)
  }
  logWarnings(result.warnings)
}

export function reportManifest(result: GetManifestResult): void {
  logHeader('get-manifest', result.count, result.size)
  console.info(`\n${pc.green('✓')} manifest entries:`)
  for (const entry of result.manifestEntries)
    console.info(`  ${pc.dim(entry.revision ?? '—')}  ${entry.url}`)
  logWarnings(result.warnings)
}
