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

      const promise = detectRolldown()
      await expect(promise).resolves.toBe(true)
      expect(includeRolldownOxcPlugin()).toBe(true)
      expect(collectVersionInfo('rolldown', 'Fallback')).toBe('Rolldown 1.1.2')

      expect(mockedFindPackageJSON).toHaveBeenCalledWith('rolldown', baseURL)
      expect(mockedReadFileSync).toHaveBeenCalledWith(mockPath, 'utf8')
    })

    it('version 1.1.3: detect=true, include-oxc-plugin=false', async () => {
      mockPackageJson({ name: 'rolldown', version: '1.1.3' })

      await expect(detectRolldown()).resolves.toBe(true)
      expect(includeRolldownOxcPlugin()).toBe(false)
    })

    it('version 0.9.0: detect=false', async () => {
      mockPackageJson({ name: 'rolldown', version: '0.9.0' })

      await expect(detectRolldown()).resolves.toBe(false)
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

      await expect(detectRolldown()).resolves.toBe(true)
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

      await expect(detectRolldown()).resolves.toBe(false)
      expect(includeRolldownOxcPlugin()).toBe(true)
      expect(collectVersionInfo('rolldown', 'MyFallback')).toBe('MyFallback')
    })
  })

  describe('error handling & fallbacks', () => {
    it('returns fallback if resolution returns undefined', async () => {
      mockedFindPackageJSON.mockReturnValue(undefined)

      await expect(detectRolldown()).resolves.toBe(false)
      expect(includeRolldownOxcPlugin()).toBe(true)
      expect(collectVersionInfo('rolldown', 'MyFallback')).toBe('MyFallback')
      expect(mockedReadFileSync).not.toHaveBeenCalled()
    })

    it('does not fall through to Vite+ lookup on non-ERR_MODULE_NOT_FOUND errors', async () => {
      mockedFindPackageJSON.mockImplementation(() => {
        const err = new Error('boom') as NodeJS.ErrnoException
        err.code = 'EACCES'
        throw err
      })

      await expect(detectRolldown()).resolves.toBeUndefined()
      expect(mockedFindPackageJSON).not.toHaveBeenCalledWith('vite', baseURL)
    })

    it('prioritizes direct rolldown package over Vite+ fallback when both resolve', async () => {
      mockedFindPackageJSON.mockImplementation((specifier: string) => {
        if (specifier === 'rolldown') {
          return '/fake/node_modules/rolldown/package.json'
        }
        if (specifier === 'vite') {
          return '/fake/node_modules/vite/package.json'
        }
      })

      mockedReadFileSync.mockImplementation((filePath: string) => {
        if (filePath === '/fake/node_modules/rolldown/package.json') {
          return JSON.stringify({ name: 'rolldown', version: '1.2.5' })
        }
        if (filePath === '/fake/node_modules/vite/package.json') {
          return JSON.stringify({
            name: VITE_PLUS_CORE_PKG_NAME,
            version: '0.1.0',
            bundledVersions: { vite: '8.0.0', rolldown: '1.0.0' },
          })
        }
        return '{}'
      })

      await expect(detectRolldown()).resolves.toBe(true)
      const versionInfo = collectVersionInfo('rolldown', 'fallback')
      expect(versionInfo).toContain('1.2.5')
      expect(versionInfo).not.toContain('via Vite+')
    })

    it('returns false (not undefined) when neither rolldown nor vite can be found', async () => {
      mockedFindPackageJSON.mockImplementation((specifier: string) => {
        const err = new Error(`Cannot find package '${specifier}'`) as NodeJS.ErrnoException
        err.code = 'ERR_MODULE_NOT_FOUND'
        throw err
      })

      await expect(detectRolldown()).resolves.toBe(false)
      await expect(detectVite()).resolves.toBe(false)
      expect(collectVersionInfo('rolldown', 'MyFallback')).toBe('MyFallback')
      expect(mockedReadFileSync).not.toHaveBeenCalled()
    })
  })

  describe('vite regressions', () => {
    it('standalone Vite 8.x passes detectVite', async () => {
      mockPackageJson({ name: 'vite', version: '8.0.0' })

      await expect(detectVite()).resolves.toBe(true)
      expect(collectVersionInfo('vite', 'Fallback')).toBe('Vite 8.0.0')
    })

    it('bundled Vite 8.x passes detectVite with Vite+ banner', async () => {
      mockPackageJson({
        name: VITE_PLUS_CORE_PKG_NAME,
        version: '0.1.0',
        bundledVersions: { vite: '8.2.0' },
      })

      await expect(detectVite()).resolves.toBe(true)
      expect(collectVersionInfo('vite', 'Fallback')).toBe('Vite 8.2.0 via Vite+ 0.1.0')
    })

    it('bundled Vite 6.x passes detectViteEnvironmentApi and fails detectVite', async () => {
      mockPackageJson({
        name: VITE_PLUS_CORE_PKG_NAME,
        version: '0.1.0',
        bundledVersions: { vite: '6.1.0' },
      })

      await expect(detectVite()).resolves.toBe(false)
      await expect(detectViteEnvironmentApi()).resolves.toBe(true)
    })
  })

  describe('advanced error handling (throw & malformed JSON)', () => {
    it('returns undefined/fallback if readFileSync throws', async () => {
      mockedFindPackageJSON.mockReturnValue('/mock/path/package.json')
      mockedReadFileSync.mockImplementation(() => {
        throw new Error('Access denied')
      })

      await expect(detectRolldown()).resolves.toBeUndefined()
      expect(includeRolldownOxcPlugin()).toBe(false)
      expect(collectVersionInfo('rolldown', 'MyFallback')).toBe('MyFallback')
    })

    it('returns undefined/fallback if JSON is malformed', async () => {
      mockedFindPackageJSON.mockReturnValue('/mock/path/package.json')
      mockedReadFileSync.mockReturnValue('{ this is not valid json }')

      await expect(detectRolldown()).resolves.toBeUndefined()
      expect(includeRolldownOxcPlugin()).toBe(false)
      expect(collectVersionInfo('rolldown', 'MyFallback')).toBe('MyFallback')
    })
  })

  describe('vite+ alias (vite aliased to vite-plus-core, rolldown unaliased)', () => {
    const viteCorePath = '/mock/vite-plus-core/package.json'

    function throwNotFound(name: string): never {
      const err = new Error(`Cannot find package '${name}'`) as NodeJS.ErrnoException
      err.code = 'ERR_MODULE_NOT_FOUND'
      throw err
    }

    it.each([
      ['returns undefined', () => undefined],
      ['throws ERR_MODULE_NOT_FOUND', () => throwNotFound('rolldown')],
    ])('resolves bundled Rolldown via Vite+ core when rolldown lookup %s', async (_label, onRolldown) => {
      mockedFindPackageJSON.mockImplementation((specifier: string) => {
        if (specifier === 'vite') {
          return viteCorePath
        }
        return onRolldown()
      })

      mockedReadFileSync.mockImplementation((path: string) => {
        if (path === viteCorePath) {
          return JSON.stringify({
            name: VITE_PLUS_CORE_PKG_NAME,
            version: '0.1.0',
            bundledVersions: { vite: '8.0.0', rolldown: '1.1.3' },
          })
        }
        throw new Error(`Unexpected path: ${path}`)
      })

      await expect(detectRolldown()).resolves.toBe(true)
      expect(includeRolldownOxcPlugin()).toBe(false)
      expect(collectVersionInfo('rolldown', 'Fallback')).toBe('Rolldown 1.1.3 via Vite+ 0.1.0')

      expect(mockedFindPackageJSON).toHaveBeenCalledWith('rolldown', baseURL)
      expect(mockedFindPackageJSON).toHaveBeenCalledWith('vite', baseURL)
      expect(mockedReadFileSync).toHaveBeenCalledWith(viteCorePath, 'utf8')
    })
  })
})
