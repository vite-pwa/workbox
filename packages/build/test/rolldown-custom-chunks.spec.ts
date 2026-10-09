import type { BuildServiceWorkerOptions } from '../src/build/rolldown'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSW } from '../src/build/rolldown/build-sw'
import { runCustomChunksScenario } from './utils/custom-chunks-utils'
import { createFixture } from './utils/fixture-utils'

const dummySWCode = `
import { precacheAndRoute } from '@vite-pwa/workbox-swkit/precaching';
import './app-cache.js';
precacheAndRoute(self.__WB_MANIFEST);
`

describe('rolldown custom chunks', () => {
  afterEach(() => {
    // Restore console spies as requested by the plan
    vi.restoreAllMocks()
  })

  describe('successful builds', () => {
    it('supports custom chunks for classic service workers', async () => {
      await runCustomChunksScenario(buildSW, 'classic')
    })

    it('supports custom chunks for module service workers', async () => {
      await runCustomChunksScenario(buildSW, 'module')
    })
  })

  describe('error handling and rejections', () => {
    it('rejects if customChunks callback returns the SW chunk name', async () => {
      await createFixture(dummySWCode, async ({ root, dist }) => {
        const src = path.resolve(root, 'src')
        await fs.mkdir(dist, { recursive: true })
        await fs.writeFile(path.resolve(src, 'app-cache.js'), 'console.log("cache");', 'utf-8')
        await fs.writeFile(path.resolve(src, 'sw.js'), dummySWCode, 'utf-8')

        const buildPromise = buildSW({
          swSrc: path.resolve(src, 'sw.js'),
          swDest: path.resolve(dist, 'sw.js'),
          globDirectory: dist,
          globPatterns: [],
          swType: 'classic',
          customChunks: () => 'sw', // Returns the reserved name
        })

        // The error will depend on the exact string you have in validation,
        // but the promise should fail.
        await expect(buildPromise).rejects.toThrow()
      })
    })

    it('rejects if customChunks callback returns the active Workbox runtime name', async () => {
      await createFixture(dummySWCode, async ({ root, dist }) => {
        const src = path.resolve(root, 'src')
        await fs.mkdir(dist, { recursive: true })
        await fs.writeFile(path.resolve(src, 'app-cache.js'), 'console.log("cache");', 'utf-8')
        await fs.writeFile(path.resolve(src, 'sw.js'), dummySWCode, 'utf-8')

        const buildPromise = buildSW({
          swSrc: path.resolve(src, 'sw.js'),
          swDest: path.resolve(dist, 'sw.js'),
          globDirectory: dist,
          globPatterns: [],
          swType: 'classic',
          customChunks: () => 'workbox', // Reserved name for the runtime
        })

        await expect(buildPromise).rejects.toThrow()
      })
    })

    it('rejects with "Critical precache configuration conflict detected!"', async () => {
      await createFixture(dummySWCode, async ({ root, dist }) => {
        const src = path.resolve(root, 'src')
        await fs.mkdir(dist, { recursive: true })

        await fs.writeFile(path.resolve(dist, 'index.js'), 'console.log("dummy");', 'utf-8')

        await fs.writeFile(
          path.resolve(src, 'app-cache.js'),
          'export function initCache() { console.log("cache initialized"); }\n',
          'utf-8',
        )
        await fs.writeFile(path.resolve(src, 'sw.js'), `import { precacheAndRoute } from '@vite-pwa/workbox-swkit/precaching';
import { initCache } from './app-cache.js';

precacheAndRoute(self.__WB_MANIFEST);
initCache();
        `, 'utf-8')

        const options = {
          swSrc: path.resolve(src, 'sw.js'),
          swDest: path.resolve(dist, 'sw.js'),
          globDirectory: dist,
          // EXPLICITLY exclude the chunk to isolate the validation of sw.js
          globPatterns: ['**/*.js'],
          minify: false,
          swType: 'classic',
          customChunks: (moduleId, ctx) => {
            const id = ctx.getModuleInfo(moduleId)?.id
            if (id?.includes('app-cache.js')) {
              return 'app-cache'
            }
          },
        } as BuildServiceWorkerOptions<'classic'>

        const buildPromise1 = buildSW(options)
        await expect(buildPromise1).resolves.toBeTruthy()

        // simulate second build: internal build will exclude SW names, we need
        // to check the error for the SW is there to protect consumer from
        // misconfiguration
        options.globPatterns = []
        options.additionalManifestEntries = ['sw.js']
        // ¡BOOM!
        const buildPromise2 = buildSW(options)

        await expect(buildPromise2).rejects.toThrow(/Critical precache configuration conflict detected!/)
        await expect(buildPromise2).rejects.toThrow(/sw\.js/)

        // check baseUrl variant default base url (/):
        // simulate second build (previous second one failed):
        // internal build will exclude SW names, we need
        // to check the error for the SW is there to protect consumer from
        // misconfiguration
        options.globPatterns = []
        options.additionalManifestEntries = ['/sw.js']
        // ¡BOOM!
        const buildPromise3 = buildSW(options)

        await expect(buildPromise3).rejects.toThrow(/Critical precache configuration conflict detected!/)
        await expect(buildPromise3).rejects.toThrow(/sw\.js/)

        // check baseUrl variant default base url (/base/):
        // simulate second build (previous second one failed):
        // internal build will exclude SW names, we need
        // to check the error for the SW is there to protect consumer from
        // misconfiguration
        options.baseUrl = '/base/'
        options.additionalManifestEntries = ['sw.js']
        // ¡BOOM!
        const buildPromise4 = buildSW(options)

        await expect(buildPromise4).rejects.toThrow(/Critical precache configuration conflict detected!/)
        await expect(buildPromise4).rejects.toThrow(/sw\.js/)

        // check baseUrl variant default base url (/base/):
        // simulate second build (previous second one failed):
        // internal build will exclude SW names, we need
        // to check the error for the SW is there to protect consumer from
        // misconfiguration
        options.baseUrl = '/base/'
        options.additionalManifestEntries = ['/sw.js']
        // ¡BOOM!
        const buildPromise5 = buildSW(options)

        await expect(buildPromise5).rejects.toThrow(/Critical precache configuration conflict detected!/)
        await expect(buildPromise5).rejects.toThrow(/sw\.js/)

        // check baseUrl variant default base url (/base/):
        // simulate second build (previous second one failed):
        // internal build will exclude SW names, we need
        // to check the error for the SW is there to protect consumer from
        // misconfiguration
        options.baseUrl = '/base/'
        options.additionalManifestEntries = ['/base/sw.js']
        // ¡BOOM!
        const buildPromise6 = buildSW(options)

        await expect(buildPromise6).rejects.toThrow(/Critical precache configuration conflict detected!/)
        await expect(buildPromise6).rejects.toThrow(/sw\.js/)
      })
    })
  })
})
