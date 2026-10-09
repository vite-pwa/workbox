import type {
  CodeSplittingNameFunction,
  CodeSplittingOptions,
  OutputOptions,
} from 'rolldown'
import type { ClassicBuild, RolldownOptions } from '../src/build/builder/bundler-types'
import { describe, expect, it } from 'vitest'
import { prepareCodeSplittingGroups } from '../src/build/builder/prepare-code-splitting-groups'

describe('prepareCodeSplittingGroups', () => {
  it('assigns "vite-pwa-workbox-custom-chunks" debugName when customChunks or detectCircularDeps is active', () => {
    const options = { detectCircularDeps: true } as RolldownOptions<'rolldown'>
    const rolldownOptions = {} as OutputOptions
    const classicBuild = {} as ClassicBuild

    prepareCodeSplittingGroups(options, rolldownOptions, classicBuild)

    const groups = (rolldownOptions.codeSplitting as CodeSplittingOptions)?.groups as any[]
    expect(groups[0].debugName).toBe('vite-pwa-workbox-custom-chunks')
  })

  it('assigns "vite-pwa-workbox-chunk" debugName for fallback runtime splitting without customChunks', () => {
    const options = {} as RolldownOptions<'rolldown'>
    const rolldownOptions = {} as OutputOptions
    const classicBuild = {} as ClassicBuild

    prepareCodeSplittingGroups(options, rolldownOptions, classicBuild, undefined)

    const groups = (rolldownOptions.codeSplitting as CodeSplittingOptions)?.groups as any[]
    expect(groups[0].debugName).toBe('vite-pwa-workbox-chunk')
  })

  describe('chunk name resolution and precedence', () => {
    it('prioritizes Workbox module matching over customChunks callback', () => {
      const options = {
        detectCircularDeps: true,
        customChunks: () => 'my-custom-chunk',
      } as unknown as RolldownOptions<'rolldown'>
      const rolldownOptions = {} as import('rolldown').OutputOptions
      const classicBuild = { workboxName: 'wb-runtime' } as ClassicBuild

      prepareCodeSplittingGroups(options, rolldownOptions, classicBuild)

      const nameFn = (rolldownOptions.codeSplitting as CodeSplittingOptions)?.groups![0].name as CodeSplittingNameFunction

      expect(nameFn('@vite-pwa/workbox-swkit/precaching/index.js', {} as any)).toBe('wb-runtime')
      expect(nameFn('src/app-cache.js', {} as any)).toBe('my-custom-chunk')
    })

    it('returns undefined for falsy results from customChunks', () => {
      const options = {
        detectCircularDeps: true,
        customChunks: () => false,
      } as unknown as RolldownOptions<'rolldown'>
      const rolldownOptions = {} as OutputOptions
      const classicBuild = {} as ClassicBuild

      prepareCodeSplittingGroups(options, rolldownOptions, classicBuild)

      const nameFn = (rolldownOptions.codeSplitting as CodeSplittingOptions)?.groups![0].name as CodeSplittingNameFunction

      expect(nameFn('src/some-module.js', {} as any)).toBeUndefined()
    })

    it('throws an Error if customChunks attempts to use reserved SW or Workbox names', () => {
      const options = {
        detectCircularDeps: true,
        swChunkName: 'my-sw',
        customChunks: (id: string) => id === 'x' ? 'my-sw' : 'workbox',
      } as unknown as RolldownOptions<'rolldown'>
      const rolldownOptions = {} as OutputOptions
      const classicBuild = { workboxName: 'workbox' } as ClassicBuild

      prepareCodeSplittingGroups(options, rolldownOptions, classicBuild)

      const nameFn = (rolldownOptions.codeSplitting as CodeSplittingOptions)?.groups![0].name as CodeSplittingNameFunction
      expect(() => nameFn('x', {} as any)).toThrow(/conflicts with the Service Worker/)
      expect(() => nameFn('y', {} as any)).toThrow(/conflicts with the Service Worker/)
    })
  })
})
