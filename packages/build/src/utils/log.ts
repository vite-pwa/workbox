/* eslint-disable no-console */
import type { BuildResult, ManifestEntry } from '../types'
import type { LogLevel } from './constants'
import type { InternalManifestEntry } from './types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import pkg from '../../package.json' with { type: 'json' }
import { errors } from '../validation/errors'
import { errStyle } from './colors'
import { normalizePath } from './resolve-sw-names'

export function checkMaximumFileSizeToCacheExceeded(
  error: boolean,
  maximumFileSizeToCacheInBytes: number,
  maxFileSizeExceeded: InternalManifestEntry[],
) {
  if (maxFileSizeExceeded.length === 0) {
    return undefined
  }

  const limitStr = formatBytes(maximumFileSizeToCacheInBytes)
  const color = error ? 'red' : 'yellow'
  const prefix = error ? `\n${errStyle([color, 'bold'], '[Vite PWA]')} ` : ''

  return [
    `${prefix}${errStyle(color, 'Maximum file size exceeded for precaching!')}\n\n`,
    `The following assets exceed the configured limit of ${errStyle('cyan', limitStr)}:\n`,
    `${maxFileSizeExceeded.map(e =>
      `  - ❌ ${errStyle('magenta', e.url)} (${errStyle('yellow', formatBytes(e.size))})`,
    ).join('\n')}\n\n`,
    `${errStyle('bold', 'To resolve this issue, you can either:')}\n`,
    `  1. Increase the ${errStyle('green', '"maximumFileSizeToCacheInBytes"')} option (current: ${errStyle('yellow', limitStr)}).\n`,
    `  2. Exclude these files from the precache using ${errStyle('green', '"globIgnores"')}.\n\n`,
    `${errStyle('dim', 'For more information, please check the official FAQ:')}\n`,
    `👉 ${errStyle('cyan', 'https://vite-pwa-org.netlify.app/guide/faq.html#missing-assets-from-sw-precache-manifest')}\n`,
  ].join('')
}

export function createDuplicatedEntriesMessage(
  duplicated: (string | ManifestEntry)[],
  error: boolean,
) {
  const color = error ? 'red' : 'yellow'
  const prefix = error ? `\n${errStyle([color, 'bold'], '[Vite PWA]')} ` : ''
  return [
    `${prefix}${errStyle(color, 'Duplicate precache manifest entries found!')}\n\n`,
    `The following url assets are duplicated:\n`,
    `${duplicated.map(e =>
      `  -  ${errStyle('magenta', typeof e === 'string' ? e : e.url)}`,
    ).join('\n')}\n\n`,
  ].join('')
}

export function checkInvalidPatterns(isStrict: boolean, invalidPatterns: string[]) {
  if (invalidPatterns.length === 0) {
    return undefined
  }
  const color = isStrict ? 'red' : 'yellow'
  const prefix = isStrict ? `\n${errStyle([color, 'bold'], '[Vite PWA]')} ` : ''
  return [
    `${prefix}${errStyle(color, errors['useless-glob-pattern'])}`,
    invalidPatterns.map(e => `  - ${e}`).join('\n'),
    '',
    errStyle('bold', 'To resolve this issue, you can either:'),
    `  1. Disable ${errStyle('green', '"globStrict"')}${isStrict ? ' to convert this error into a warning' : ''}.`,
    `  2. Remove/Update previous patterns from ${errStyle('green', '"globPatterns"')}.\n\n`,
  ].filter(Boolean).join('\n')
}

export function throwInvalidInjectionPoint(): never {
  const message = [
    `\n${errStyle(['red', 'bold'], '[Vite PWA]')} ${errStyle('red', 'Invalid configuration for injectManifest!')}\n`,
    `You have disabled ${errStyle('green', '"injectionPoint"')} (set to null or false), but you are calling`,
    `the ${errStyle('cyan', 'injectManifest()')} function directly.\n`,
  ].join('\n')

  throw new Error(message)
}

export function formatBytes(bytes: number) {
  if (bytes === 0)
    return `0 ${errStyle('dim', 'Bytes')}`
  const k = 1024
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const val = Number.parseFloat((bytes / k ** i).toFixed(2))
  return `${val} ${errStyle('dim', sizes[i])}`
}

export function logInjectManifestResult(
  buildResult: BuildResult,
  totalTime: number,
  logLevel: LogLevel,
  root: string = process.cwd(),
) {
  if (logLevel === 'silent')
    return

  const { count, size, filePaths, warnings } = buildResult

  console.info(`\n${styleText(['cyan', 'bold'], `Vite PWA v${pkg.version}`)}`)
  console.info(`${styleText('dim', 'strategy')}  ${styleText('magenta', 'inject-manifest')}`)

  // Precaching Summary
  console.info(`${styleText('dim', 'precache')}  ${styleText('green', `${count} entries`)} ${styleText('dim', `(${(size / 1024).toFixed(2)} KiB)`)}`)

  // Files generated table
  console.info(`\n${styleText('green', '✓')} files modified:`)

  // Single pass to collect data and calculate max lengths
  const { files, maxP, maxS } = filePaths.reduce((acc, fp) => {
    const np = normalizePath(path.relative(root, fp))
    const sizeStr = `${(fs.statSync(fp).size / 1024).toFixed(2)} kB`

    acc.files.push({ np, size: sizeStr })
    acc.maxP = Math.max(acc.maxP, np.length)
    acc.maxS = Math.max(acc.maxS, sizeStr.length)

    return acc
  }, { files: [] as { np: string, size: string }[], maxP: 0, maxS: 0 })

  for (const { np, size } of files) {
    const isMap = np.endsWith('.map')
    const line = `  ${np.padEnd(maxP)} ${size.padStart(maxS)}`

    if (isMap) {
      console.info(`${styleText('dim', line)} ${styleText('dim', '│ map')}`)
    }
    else {
      // We only bold the size for primary files
      console.info(`${styleText('dim', line.slice(0, maxP + 3))}${styleText('bold', line.slice(maxP + 3))}`)
    }
  }

  // Warnings are always shown unless silent
  if (warnings && warnings.length > 0) {
    console.warn(errStyle('yellow', `\n${errStyle('bold', '[Vite PWA] Warnings:')}\n${warnings.join('\n')}\n`))
  }

  console.info(`\n${styleText('green', `✓ injection point added in ${totalTime.toFixed(4)}ms`)}`)
}
