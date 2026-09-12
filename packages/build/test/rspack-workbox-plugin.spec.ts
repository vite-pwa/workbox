import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import * as rspack from '@rspack/core'
import { it as base, describe, expect } from 'vitest'
import { RspackWorkboxPWAPlugin } from '../src/build/rspack'
import { normalizePath } from '../src/utils/resolve-sw-names'
import { createFixture } from './utils/rspack-utils'

// ======================== buildSW ========================
const isWatchMode = process.env.VITEST_MODE === 'WATCH'

function runRspack(config: rspack.Configuration): Promise<rspack.Stats> {
  return new Promise((resolve, reject) => {
    const compiler = rspack.rspack(config)
    compiler.run((error, stats) => {
      compiler.close(() => {})
      if (error) {
        reject(error)
      }
      else {
        resolve(stats!)
      }
    })
  })
}

export const testRspack = base.extend<{
  sandbox: { root: string, dist: string }
}>({
  // eslint-disable-next-line no-empty-pattern
  sandbox: async ({}, use) => {
    await createFixture('rspack', use)
  },
}).skipIf(isWatchMode)

describe('rspack RspackWorkboxPWAPlugin', () => {
  testRspack('runs build-sw with rspack compiler context and relative paths', async ({ sandbox }) => {
    const { dist, root } = sandbox
    const stats = await runRspack({
      mode: 'development',
      context: root,
      devtool: false,
      entry: './src/index.js',
      output: { filename: 'main.js', path: dist },
      plugins: [
        new RspackWorkboxPWAPlugin('build-sw', {
          buildSW: {
            swSrc: normalizePath(path.relative(process.cwd(), path.resolve(root, 'src/sw.js'))),
            swDest: normalizePath(path.relative(process.cwd(), 'sw.js')),
            globPatterns: ['**/*.js'],
            injectionPoint: 'globalThis.__WB_MANIFEST',
            inlineWorkboxRuntime: true,
            sourcemap: false,
            mode: 'development',
            logLevel: 'silent',
            bundlerLogLevel: { rolldown: 'silent' },
          },
        }),
      ],
    })
    expect(stats.toJson({ errors: true }).errors).toEqual([])

    await expect(fs.readFile(path.resolve(dist, 'sw.js'), 'utf8')).resolves.toContain('main.js')
  })
})

// ======================== generateSW ========================
describe('rspack WorkboxPlugin (generate-sw)', () => {
  testRspack('generates a service worker from scratch with rspack compiler context', async ({ sandbox }) => {
    const { dist, root } = sandbox
    const stats = await runRspack({
      mode: 'development',
      context: root,
      devtool: false,
      entry: './src/index.js',
      output: { filename: 'main.js', path: dist },
      plugins: [
        new RspackWorkboxPWAPlugin('generate-sw', {
          generateSW: {
            swDest: normalizePath(path.relative(process.cwd(), 'sw.js')),
            globPatterns: ['**/*.js'],
            inlineWorkboxRuntime: true,
            sourcemap: false,
            mode: 'production',
            logLevel: 'silent',
            bundlerLogLevel: { rolldown: 'silent' },
          },
        }),
      ],
    })
    expect(stats.toJson({ errors: true }).errors).toEqual([])

    const swFilePromise = fs.readFile(path.resolve(dist, 'sw.js'), 'utf8')
    await expect(swFilePromise).resolves.not.toThrow()
    const swContent = await swFilePromise
    expect(swContent).toContain('main.js')
    expect(swContent).not.toContain('__WB_MANIFEST')
  })
})

// ======================== InjectManifest ========================
describe('rspack WorkboxPlugin (inject-manifest)', () => {
  testRspack('inject-manifest', async ({ sandbox }) => {
    const { dist, root } = sandbox
    const stats = await runRspack({
      mode: 'development',
      context: root,
      devtool: false,
      entry: './src/index.js',
      output: { filename: 'main.js', path: dist },
      plugins: [
        new RspackWorkboxPWAPlugin('inject-manifest', {
          injectManifest: {
            swSrc: normalizePath(path.relative(process.cwd(), path.resolve(root, 'src/sw.js'))),
            swDest: normalizePath(path.relative(process.cwd(), 'sw.js')),
            globPatterns: ['**/*.js'],
            injectionPoint: 'globalThis.__WB_MANIFEST',
            logLevel: 'silent',
          },
        }),
      ],
    })
    expect(stats.toJson({ errors: true }).errors).toEqual([])

    const swFilePromise = fs.readFile(path.resolve(dist, 'sw.js'), 'utf8')
    await expect(swFilePromise).resolves.not.toThrow()
    const swContent = await swFilePromise
    expect(swContent).toContain('main.js')
    expect(swContent).not.toContain('__WB_MANIFEST')
  })
})
