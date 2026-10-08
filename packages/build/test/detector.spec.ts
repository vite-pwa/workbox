import type { Mock } from 'vitest'
import { readFileSync } from 'node:fs'
import { findPackageJSON } from 'node:module'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  collectVersionInfo,
  detectRolldown,
  detectVite,
  detectViteEnvironmentApi,
  includeRolldownOxcPlugin,
} from '../src/build/builder/detector'

vi.mock('node:module', () => ({
  findPackageJSON: vi.fn(),
}))

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}))

const mockedFindPackageJSON = findPackageJSON as Mock
const mockedReadFileSync = readFileSync as Mock
const baseURL = pathToFileURL(`${process.cwd()}/`).href
const VITE_PLUS_CORE_PKG_NAME = '@voidzero-dev/vite-plus-core'

describe('detector', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  function mockPackageJson(pkgData: any) {
    const mockPath = '/mock/path/package.json'
    mockedFindPackageJSON.mockReturnValue(mockPath)
    mockedReadFileSync.mockReturnValue(JSON.stringify(pkgData))
    return mockPath
  }

  describe('standalone Rolldown', () => {
    it('version 1.1.2: detect=true, include-oxc-plugin=true, banner correct', async () => {
      const mockPath = mockPackageJson({ name: 'rolldown', version: '1.1.2' })

      expect(await detectRolldown()).toBe(true)
      expect(includeRolldownOxcPlugin()).toBe(true)
      expect(collectVersionInfo('rolldown', 'Fallback')).toBe('Rolldown 1.1.2')

      expect(mockedFindPackageJSON).toHaveBeenCalledWith('rolldown', baseURL)
      expect(mockedReadFileSync).toHaveBeenCalledWith(mockPath, 'utf8')
    })

    it('version 1.1.3: detect=true, include-oxc-plugin=false', async () => {
      mockPackageJson({ name: 'rolldown', version: '1.1.3' })

      expect(await detectRolldown()).toBe(true)
      expect(includeRolldownOxcPlugin()).toBe(false)
    })

    it('version 0.9.0: detect=false', async () => {
      mockPackageJson({ name: 'rolldown', version: '0.9.0' })

      expect(await detectRolldown()).toBe(false)
    })
  })

  describe('vite+ Wrapper', () => {
    it('wrapper 0.1.0 with bundled Rolldown 1.1.3: detect=true, include-oxc-plugin=false, custom banner', async () => {
      mockPackageJson({
        name: VITE_PLUS_CORE_PKG_NAME,
        version: '0.1.0',
        bundledVersions: {
          vite: '8.0.0',
          rolldown: '1.1.3',
        },
      })

      expect(await detectRolldown()).toBe(true)
      expect(includeRolldownOxcPlugin()).toBe(false)
      expect(collectVersionInfo('rolldown', 'Fallback')).toBe('Rolldown 1.1.3 via Vite+ 0.1.0')
    })

    it('wrapper 9.0.0 without bundled Rolldown key: detect=false, include-oxc-plugin=true', async () => {
      mockPackageJson({
        name: VITE_PLUS_CORE_PKG_NAME,
        version: '9.0.0',
        bundledVersions: {
          vite: '8.0.0',
          // rolldown is missing
        },
      })

      expect(await detectRolldown()).toBe(false)
      expect(includeRolldownOxcPlugin()).toBe(true)
    })
  })

  describe('error handling & fallbacks', () => {
    it('returns fallback if resolution returns undefined', async () => {
      mockedFindPackageJSON.mockReturnValue(undefined)

      expect(await detectRolldown()).toBe(false)
      expect(includeRolldownOxcPlugin()).toBe(true)
      expect(collectVersionInfo('rolldown', 'MyFallback')).toBe('MyFallback')
      expect(mockedReadFileSync).not.toHaveBeenCalled()
    })
  })

  describe('vite regressions', () => {
    it('standalone Vite 8.x passes detectVite', async () => {
      mockPackageJson({ name: 'vite', version: '8.0.0' })

      expect(await detectVite()).toBe(true)
      expect(collectVersionInfo('vite', 'Fallback')).toBe('Vite 8.0.0')
    })

    it('bundled Vite 8.x passes detectVite with Vite+ banner', async () => {
      mockPackageJson({
        name: VITE_PLUS_CORE_PKG_NAME, // Usando la constante que metiste en el spec
        version: '0.1.0',
        bundledVersions: { vite: '8.2.0' },
      })

      expect(await detectVite()).toBe(true)
      expect(collectVersionInfo('vite', 'Fallback')).toBe('Vite 8.2.0 via Vite+ 0.1.0')
    })

    it('bundled Vite 6.x passes detectViteEnvironmentApi and fails detectVite', async () => {
      mockPackageJson({
        name: VITE_PLUS_CORE_PKG_NAME,
        version: '0.1.0',
        bundledVersions: { vite: '6.1.0' },
      })

      expect(await detectVite()).toBe(false)
      expect(await detectViteEnvironmentApi()).toBe(true)
    })
  })

  describe('advanced error handling (throw & malformed JSON)', () => {
    it('returns undefined/fallback if readFileSync throws', async () => {
      mockedFindPackageJSON.mockReturnValue('/mock/path/package.json')
      mockedReadFileSync.mockImplementation(() => {
        throw new Error('Access denied')
      })

      expect(await detectRolldown()).toBeUndefined()
      expect(includeRolldownOxcPlugin()).toBe(false)
      expect(collectVersionInfo('rolldown', 'MyFallback')).toBe('MyFallback')
    })

    it('returns undefined/fallback if JSON is malformed', async () => {
      mockedFindPackageJSON.mockReturnValue('/mock/path/package.json')
      mockedReadFileSync.mockReturnValue('{ this is not valid json }')

      expect(await detectRolldown()).toBeUndefined()
      expect(includeRolldownOxcPlugin()).toBe(false)
      expect(collectVersionInfo('rolldown', 'MyFallback')).toBe('MyFallback')
    })
  })
})
