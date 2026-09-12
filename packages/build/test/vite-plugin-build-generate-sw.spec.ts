import fs from 'node:fs/promises'
import path from 'node:path'
import { build as viteBuild } from 'vite'
import { describe, expect } from 'vitest'
import { normalizePath } from '../src/utils/resolve-sw-names'
import { testWithSandbox } from './utils/test-sandbox'
import { createBuildSWPlugin } from './utils/vite-plugin-utils'

describe('buildSW via VitePWA plugin', () => {
  testWithSandbox(
    'using build-sw strategy builds the service worker',
    async ({ sandbox }) => {
      const { root, dist } = sandbox

      const swPlugin = createBuildSWPlugin(root, dist, 'build-sw', { vite: 'silent' })
      await viteBuild({
        root,
        build: {
          outDir: dist,
          rolldownOptions: { input: path.resolve(root, 'src/index.js'), output: { entryFileNames: 'index.js' } },
        },
        plugins: [swPlugin],
        logLevel: 'silent',
      })

      const swDest = normalizePath(path.resolve(dist, 'sw.js'))
      const swFilePromise = fs.readFile(swDest, 'utf8')
      await expect(swFilePromise).resolves.not.toThrow()
      const swContent = await swFilePromise
      expect(swContent).toContain('index.js')
      expect(swContent).not.toContain('self.__WB_MANIFEST')
    },
  )
})

describe('generateSW via VitePWA plugin', () => {
  testWithSandbox('using generate-sw strategy builds the service worker', async ({ sandbox }) => {
    const { root, dist } = sandbox
    const swPlugin = createBuildSWPlugin(root, dist, 'generate-sw', { vite: 'silent' })
    await viteBuild({
      root,
      build: { outDir: dist, rolldownOptions: { input: path.resolve(root, 'src/index.js'), output: { entryFileNames: 'index.js' } } },
      plugins: [swPlugin],
      logLevel: 'silent',
    })
    const swDest = normalizePath(path.resolve(dist, 'sw.js'))
    const swFilePromise = fs.readFile(swDest, 'utf8')
    await expect(swFilePromise).resolves.not.toThrow()
    const swContent = await swFilePromise
    expect(swContent).toContain('index.js')
    expect(swContent).not.toContain('self.__WB_MANIFEST')
  })
})

describe('injectManifest via VitePWA plugin', () => {
  testWithSandbox('using inject-manifest injects the service worker precache manifest', async ({ sandbox }) => {
    const { root, dist } = sandbox
    const swPlugin = createBuildSWPlugin(root, dist, 'inject-manifest', { vite: 'silent' })
    await viteBuild({
      root,
      build: { outDir: dist, rolldownOptions: { input: path.resolve(root, 'src/index.js'), output: { entryFileNames: 'index.js' } } },
      plugins: [swPlugin],
      logLevel: 'silent',
    })
    const swDest = normalizePath(path.resolve(dist, 'sw.js'))
    const swFilePromise = fs.readFile(swDest, 'utf8')
    await expect(swFilePromise).resolves.not.toThrow()
    const swContent = await swFilePromise
    expect(swContent).toContain('index.js')
    expect(swContent).not.toContain('self.__WB_MANIFEST')
  })
})
