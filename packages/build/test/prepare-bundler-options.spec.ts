import type { PrepareBundlerOptions } from '../src/build/builder/bundler-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prepareBundlerOptions } from '../src/build/builder/prepare-bundler-options'
import { resolveSWNamesAndGlobIgnores, transformESMTargetToRolldown } from '../src/build/builder/utils'

// Mock de fsp.writeFile
vi.mock('node:fs/promises', () => ({
  default: {
    writeFile: vi.fn(() => Promise.resolve()),
  },
  writeFile: vi.fn(() => Promise.resolve()),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('common bundler options are correctly generated', () => {
  describe('transformESMTargetToRolldown', () => {
    it('transformESMTargetToRolldown resolves correctly to chrome96 for Rolldown', () => {
      expect(transformESMTargetToRolldown(
        'module',
        'chrome96',
      )).toEqual('chrome96')
    })
    it('transformESMTargetToRolldown resolves correctly to esnext for Rolldown', () => {
      expect(transformESMTargetToRolldown(
        'module',
        'baseline-widely-available',
      )).toEqual('esnext')
    })
  })
  describe('resolveSWNamesAndGlobIgnores', () => {
    it('generateSW', () => {
      expect(resolveSWNamesAndGlobIgnores(
        { swDest: 'sw.js' },
        '',
        true,
      )).toMatchInlineSnapshot(`
        {
          "classicSWChunkName": "sw-classic",
          "classicSWDest": "sw-classic.js",
          "classicSWSrc": "sw-classic.js",
          "moduleSWChunkName": "sw-module",
          "moduleSWDest": "sw-module.js",
          "moduleSWSrc": "sw-module.js",
          "prefix": "",
          "swChunkName": "sw",
          "swDest": "sw.js",
          "swSrc": "sw.js",
        }
      `)
    })
    it('generateSW with custom sw name', () => {
      expect(resolveSWNamesAndGlobIgnores(
        { swDest: 'custom-sw.js' },
        '',
        true,
      )).toMatchInlineSnapshot(`
        {
          "classicSWChunkName": "custom-sw-classic",
          "classicSWDest": "custom-sw-classic.js",
          "classicSWSrc": "custom-sw-classic.js",
          "moduleSWChunkName": "custom-sw-module",
          "moduleSWDest": "custom-sw-module.js",
          "moduleSWSrc": "custom-sw-module.js",
          "prefix": "",
          "swChunkName": "custom-sw",
          "swDest": "custom-sw.js",
          "swSrc": "custom-sw.js",
        }
      `)
    })
    it('default buildSW generates custom sw names', () => {
      expect(resolveSWNamesAndGlobIgnores(
        { swDest: 'sw.js' },
        'sw.js',
        false,
      )).toMatchInlineSnapshot(`
        {
          "classicSWChunkName": "sw",
          "classicSWDest": "sw-classic.js",
          "classicSWSrc": "sw.js",
          "moduleSWChunkName": "sw",
          "moduleSWDest": "sw-module.js",
          "moduleSWSrc": "sw.js",
          "prefix": "",
          "swChunkName": "sw",
          "swDest": "sw.js",
          "swSrc": "sw.js",
        }
      `)
    })
    it('buildSW with custom sw dest generates custom sw names', () => {
      expect(resolveSWNamesAndGlobIgnores({
        swDest: 'custom-sw.js',
      }, 'sw.js', false)).toMatchInlineSnapshot(`
        {
          "classicSWChunkName": "sw",
          "classicSWDest": "custom-sw-classic.js",
          "classicSWSrc": "sw.js",
          "moduleSWChunkName": "sw",
          "moduleSWDest": "custom-sw-module.js",
          "moduleSWSrc": "sw.js",
          "prefix": "",
          "swChunkName": "sw",
          "swDest": "custom-sw.js",
          "swSrc": "sw.js",
        }
      `)
    })
  })
  describe('prepareBundlerOptions', () => {
    it('classic-and-module generates 2 bundler options for generateSW', async () => {
      const {
        classicSWSrc,
        classicSWChunkName,
        moduleSWSrc,
        moduleSWChunkName,
        swDest,
        classicSWDest,
        moduleSWDest,
      } = resolveSWNamesAndGlobIgnores(
        { swDest: 'sw.js' },
        '',
        true,
      )
      const options = {
        mode: 'production',
        swType: 'classic-and-module',
        swSrc: '',
        swChunkName: '',
        swDest,
        classicSWDest,
        moduleSWDest,
        classicSWSrc: classicSWSrc!,
        classicSWChunkName: classicSWChunkName!,
        moduleSWSrc: moduleSWSrc!,
        moduleSWChunkName: moduleSWChunkName!,
        inlineWorkboxRuntime: false,
        minify: false,
        manifestEntries: [],
        target: { classic: 'es2015', module: 'esnext' },
        workboxRuntimeCompatible: false,
        generateSW: { swCode: 'console.log("sw")' },
        originalEnvironmentData: undefined!,
      } satisfies PrepareBundlerOptions

      const {
        builds,
      } = prepareBundlerOptions(options)

      expect(builds).toHaveLength(2)
      expect(builds[0].inlineWorkboxRuntime !== true && builds[0].inlineWorkboxRuntime.workboxChunkName).toBe('workbox-classic')
      expect(builds[1].inlineWorkboxRuntime !== true && builds[1].inlineWorkboxRuntime.workboxChunkName).toBe('workbox-module')
    })
    it('classic-and-module generates 2 bundler options for buildSW', async () => {
      const {
        swSrc,
        swChunkName,
        swDest,
        classicSWDest,
        moduleSWDest,
      } = resolveSWNamesAndGlobIgnores(
        { swDest: 'sw.js' },
        'sw.js',
        false,
      )
      const options = {
        mode: 'production',
        swType: 'classic-and-module',
        swSrc,
        swChunkName,
        swDest,
        classicSWDest,
        moduleSWDest,
        classicSWSrc: '',
        classicSWChunkName: '',
        moduleSWSrc: '',
        moduleSWChunkName: '',
        inlineWorkboxRuntime: false,
        minify: false,
        manifestEntries: [],
        target: { classic: 'es2015', module: 'esnext' },
        workboxRuntimeCompatible: false,
        generateSW: { swCode: 'console.log("sw")' },
        originalEnvironmentData: undefined!,
      } satisfies PrepareBundlerOptions

      const {
        builds,
      } = prepareBundlerOptions(options)

      expect(builds).toHaveLength(2)
      expect(builds[0].inlineWorkboxRuntime !== true && builds[0].inlineWorkboxRuntime.workboxChunkName).toBe('workbox-classic')
      expect(builds[1].inlineWorkboxRuntime !== true && builds[1].inlineWorkboxRuntime.workboxChunkName).toBe('workbox-module')
    })
  })
})
