import fs from 'node:fs/promises'
import path from 'node:path'
import { build as viteBuild } from 'vite'
import { describe, expect } from 'vitest'
import { buildSW as viteBuildSW } from '../src/build/vite/build-sw'
import { generateSW as viteGenerateSW } from '../src/build/vite/generate-sw'
import { buildSWLegacy } from '../src/build/vite/legacy-build-sw'
import { generateSWLegacy } from '../src/build/vite/legacy-generate-sw'
import { normalizePath } from '../src/utils/resolve-sw-names'
import { createBuildSWPlugin, createGenerateSWPlugin } from './utils/plugin-utils'
import { testWithSandbox } from './utils/test-sandbox'

// ======================== buildSW ========================
describe('buildSW with Vite (modern)', () => {
  testWithSandbox(
    'generates a service worker using a plugin with closeBundle (Vite 8+)',
    async ({ sandbox }) => {
      const { root, dist } = sandbox

      const swPlugin = createBuildSWPlugin<'vite'>(root, dist, viteBuildSW, { vite: 'silent' })
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

describe('generates a service worker using legacy buildSW (Vite <8)', () => {
  testWithSandbox('generates a service worker using legacy buildSW (Vite <8 via Rolldown)', async ({ sandbox }) => {
    const { root, dist } = sandbox
    const swPlugin = createBuildSWPlugin<'vite'>(root, dist, buildSWLegacy, { rolldown: 'silent' })
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

// ======================== generateSW ========================
describe('generateSW with Vite (modern)', () => {
  testWithSandbox(
    'generates a service worker using generateSW with closeBundle (Vite 8+)',
    async ({ sandbox }) => {
      const { root, dist } = sandbox

      const swPlugin = createGenerateSWPlugin<'vite'>(dist, viteGenerateSW, { vite: 'silent' })
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

describe('generateSW with Vite legacy (<8)', () => {
  testWithSandbox('generates a service worker using generateSWLegacy (Vite <8 via Rolldown)', async ({ sandbox }) => {
    const { root, dist } = sandbox
    const swPlugin = createGenerateSWPlugin<'vite'>(dist, generateSWLegacy, { rolldown: 'silent' })
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
