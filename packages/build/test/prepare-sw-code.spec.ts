import type { SWType } from '../src/types'
import { parseModule } from 'magicast'
import { describe, expect, it } from 'vitest'
import { prepareSWCode } from '../src/build/builder/prepare-sw-code'
import { generateSWFixture } from './test-helper'

describe('prepare-sw-code (applies only to generateSW strategy)', () => {
  const swTypes: SWType[] = ['classic', 'module', 'classic-and-module']

  function getImportByFrom(module: ReturnType<typeof parseModule>, from: string) {
    return [...module.imports.$items.filter(i => i.from === from).reduce((acc, i) => {
      acc.add(i.imported)
      return acc
    }, new Set<string>())]
  }

  it.each(swTypes)('should not include precaching runtime when manifest is empty (%s)', async (swType) => {
    const promise = prepareSWCode({
      swType,
      swDest: 'sw.js',
      globStrict: false,
      globIgnores: ['**/*.txt'],
      globDirectory: '__missing__',
      globPatterns: ['**/*.js'],
    }, '__missing__')
    await expect(promise).resolves.toSatisfy(
      result => !result.swCode.includes('import'),
      'swCode should not include any static import',
    )
    const { swCode, warnings, ...rest } = await promise
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatch(/One of the glob patterns doesn't match any files:/)
    expect(warnings[0]).toContain('- **/*.js')
    expect(warnings[0]).toMatch(/1\. Disable/)
    expect(warnings[0]).toMatch(/2\. Remove\/Update previous patterns from/)
    expect(rest).toEqual({
      count: 0,
      size: 0,
      manifestEntries: [],
    })
  })
  it.each(swTypes)('should include precaching runtime (%s)', async (swType) => {
    const promise = prepareSWCode({
      swType,
      swDest: 'sw.js',
      globStrict: false,
      inlineWorkboxRuntime: true,
      globIgnores: ['**/sw.js'],
      globDirectory: generateSWFixture,
      globPatterns: ['**/*.{js,html}'],
    }, generateSWFixture)
    await expect(promise).resolves.toBeDefined()
    const { warnings, count, size, manifestEntries, swCode } = await promise
    expect(warnings).toHaveLength(0)
    expect(count).toBe(2)
    expect(size).toBeGreaterThan(700)
    expect(manifestEntries).toHaveLength(2)
    expect(
      manifestEntries.map(n => n.url),
    ).toEqual(['index.html', 'index.js'])
    expect(swCode).toBeDefined()
    const swModule = parseModule(swCode)
    expect(swModule.imports).toBeDefined()
    expect(swModule.imports.$items).toHaveLength(1)
    expect(swModule.imports.$items.map(
      i => i.imported,
    )).toStrictEqual(['precacheAndRoute'])
    expect(swModule.imports.$items.map(
      i => i.from,
    )).toStrictEqual(['@vite-pwa/workbox-swkit/precaching'])
  })
  it.each(swTypes)('should include core and precaching imports (%s)', async (swType) => {
    const promise = prepareSWCode({
      swType,
      swDest: 'sw.js',
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      globIgnores: ['**/sw.js'],
      globDirectory: generateSWFixture,
      globPatterns: ['**/*.js'],
    }, generateSWFixture)

    const { swCode } = await promise
    const swModule = parseModule(swCode)

    const coreImport = getImportByFrom(swModule, '@vite-pwa/workbox-swkit/core')
    expect(coreImport).toBeDefined()
    expect(coreImport).toContain('skipWaiting')

    const precacheImport = getImportByFrom(swModule, '@vite-pwa/workbox-swkit/precaching')
    expect(precacheImport).toBeDefined()
    expect(precacheImport).toContain('precacheAndRoute')
    expect(precacheImport).toContain('cleanupOutdatedCaches')
  })
})
