import fs from 'node:fs/promises'
import path from 'node:path'
import { rolldown } from 'rolldown'
import { describe, expect } from 'vitest'
import { buildSW as rolldownBuildSW } from '../src/build/rolldown/build-sw'
import { generateSW as rolldownGenerateSW } from '../src/build/rolldown/generate-sw'
import { normalizePath } from '../src/utils/resolve-sw-names'
import { createBuildSWPlugin, createGenerateSWPlugin } from './utils/plugin-utils'
import { testWithSandbox } from './utils/test-sandbox'

// ======================== buildSW ========================
describe('buildSW with Rolldown', () => {
  testWithSandbox('generates a service worker directly', async ({ sandbox }) => {
    const { root, dist } = sandbox

    const swPlugin = createBuildSWPlugin<'rolldown'>(
      root,
      dist,
      rolldownBuildSW,
      { rolldown: 'silent' },
    )

    async function buildAndClose() {
      const build = await rolldown({
        input: path.resolve(root, 'src/index.js'),
        plugins: [swPlugin],
      })
      await build.write({ dir: dist })
      await build.close()
      return true
    }

    await expect(buildAndClose()).resolves.toBe(true)

    const swDest = normalizePath(path.resolve(dist, 'sw.js'))
    const swFilePromise = fs.readFile(swDest, 'utf8')
    await expect(swFilePromise).resolves.not.toThrow()
    const swContent = await swFilePromise
    expect(swContent).toContain('index.js')
    expect(swContent).not.toContain('self.__WB_MANIFEST')
  })
})

// ======================== generateSW ========================
describe('generateSW with Rolldown', () => {
  testWithSandbox('generates a service worker directly', async ({ sandbox }) => {
    const { root, dist } = sandbox

    const swPlugin = createGenerateSWPlugin<'rolldown'>(
      dist,
      rolldownGenerateSW,
      { rolldown: 'silent' },
    )

    async function buildAndClose() {
      const build = await rolldown({
        input: path.resolve(root, 'src/index.js'),
        plugins: [swPlugin],
      })
      await build.write({ dir: dist })
      await build.close()
      return true
    }

    await expect(buildAndClose()).resolves.toBe(true)

    const swDest = normalizePath(path.resolve(dist, 'sw.js'))
    const swFilePromise = fs.readFile(swDest, 'utf8')
    await expect(swFilePromise).resolves.not.toThrow()
    const swContent = await swFilePromise
    expect(swContent).toContain('index.js')
    expect(swContent).not.toContain('self.__WB_MANIFEST')
  })
})
