import type { BuildServiceWorkerOptions, SWType } from '../src/build/rolldown'
import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildSW } from '../src/build/rolldown/build-sw'
import { createBundlerChunkFixture } from './utils/bundler-fixture-utils'
import { runCustomChunksScenario } from './utils/custom-chunks-utils'
import { createFixture } from './utils/fixture-utils'

const dummySWCode = `
import { precacheAndRoute } from '@vite-pwa/workbox-swkit/precaching';
import './app-cache.js';
precacheAndRoute(self.__WB_MANIFEST);
`

// Prepares the options for the "second build" of a scenario: the first build
// (done by createBundlerChunkFixture) already generated the chunks, now we
// target some of them from the manifest to check the validation.
function configureSecondBuild(
  options: BuildServiceWorkerOptions<'classic'>,
  baseUrl: string | undefined,
  entries: string[],
) {
  options.globPatterns = []
  if (baseUrl !== undefined) {
    options.baseUrl = baseUrl
  }
  options.additionalManifestEntries = entries
}

// Runs the build and returns the error (if any) instead of throwing, so the
// message can be checked with several assertions on the very same error.
function buildAndCatch(options: BuildServiceWorkerOptions<SWType>) {
  return buildSW(options).then(() => undefined, (e: Error) => e)
}

interface ReservedNameRow {
  reservedName: string
  swType: SWType
  inlineWorkboxRuntime: boolean
  workboxRuntimeCompatible: boolean
}

// Writes the minimal fixture and returns build options whose customChunks callback
// assigns the given name to the app-cache module.
async function createReservedNameOptions(
  root: string,
  dist: string,
  { reservedName, ...rest }: ReservedNameRow,
) {
  const src = path.resolve(root, 'src')
  await fs.mkdir(dist, { recursive: true })
  await fs.writeFile(path.resolve(src, 'app-cache.js'), 'console.log("cache");', 'utf-8')
  await fs.writeFile(path.resolve(src, 'sw.js'), dummySWCode, 'utf-8')

  return {
    swSrc: path.resolve(src, 'sw.js'),
    swDest: path.resolve(dist, 'sw.js'),
    globDirectory: dist,
    globPatterns: [],
    ...rest,
    customChunks: (moduleId: string) => {
      if (moduleId.endsWith('app-cache.js')) {
        return reservedName
      }
    },
  } as BuildServiceWorkerOptions<SWType>
}

describe('rolldown custom chunks', () => {
  describe('successful builds', () => {
    it('supports custom chunks for classic service workers', async () => {
      await runCustomChunksScenario(buildSW, 'classic')
    })

    it('supports custom chunks for module service workers', async () => {
      await runCustomChunksScenario(buildSW, 'module')
    })
  })

  describe('error handling and rejections', () => {
    it.each([
      ['the SW chunk name', 'sw', 'classic'],
      ['the SW chunk name', 'sw', 'module'],
      ['the SW chunk name', 'sw', 'classic-and-module'],
      ['the active Workbox runtime name', 'workbox', 'classic'],
      ['the active Workbox runtime name', 'workbox', 'module'],
      ['the active Workbox runtime name', 'workbox-classic', 'classic-and-module'],
      ['the active Workbox runtime name', 'workbox-module', 'classic-and-module'],
    ])('rejects if customChunks callback returns $0 ("$1") for "$2" build', async (_desc, reservedName, swType) => {
      await createFixture(dummySWCode, async ({ root, dist }) => {
        const src = path.resolve(root, 'src')
        await fs.mkdir(dist, { recursive: true })
        await fs.writeFile(path.resolve(src, 'app-cache.js'), 'console.log("cache");', 'utf-8')
        await fs.writeFile(path.resolve(src, 'sw.js'), dummySWCode, 'utf-8')

        const error = await buildAndCatch({
          swSrc: path.resolve(src, 'sw.js'),
          swDest: path.resolve(dist, 'sw.js'),
          globDirectory: dist,
          globPatterns: [],
          swType,
          customChunks: (moduleId) => {
            if (moduleId.endsWith('app-cache.js')) {
              return reservedName
            }
          },
        } as BuildServiceWorkerOptions<SWType>)

        expect(error).toBeDefined()
        // the quotes may arrive escaped (\") because Rolldown serializes the binding error,
        // so the regex accepts an optional backslash before each quote
        expect(error!.message).toMatch(
          new RegExp(`Custom chunk name \\\\?"${reservedName}\\\\?" conflicts with the Service Worker or Workbox runtime chunk names!`),
        )
        const expectedBanner = swType === 'classic-and-module'
          ? 'Compilation failed during dual Service Worker build:'
          : 'Compilation failed during Service Worker build:'
        expect(error!.message).toContain(expectedBanner)
      })
    })

    it.each([
      // default base: bare, root-relative and relative entries all resolve to the SW file name
      ['baseUrl undefined (default "/")', undefined, ['sw.js']],
      ['baseUrl undefined (default "/")', undefined, ['/sw.js']],
      ['baseUrl undefined (default "/")', undefined, ['./sw.js']],
      ['baseUrl undefined (default "/")', undefined, ['../sw.js']],
      // base with trailing slash: inside the base the prefix is stripped, outside it the entry
      // is compared as is, and in both cases it still collides with the SW
      ['base url "/base/"', '/base/', ['sw.js']],
      ['base url "/base/"', '/base/', ['/sw.js']],
      ['base url "/base/"', '/base/', ['./sw.js']],
      ['base url "/base/"', '/base/', ['../sw.js']],
      ['base url "/base/"', '/base/', ['base/sw.js']],
      ['base url "/base/"', '/base/', ['/base/sw.js']],
      ['base url "/base/"', '/base/', ['./base/sw.js']],
      ['base url "/base/"', '/base/', ['../base/sw.js']],
      // slashless base: it is normalized with a trailing slash, so it behaves like "/base/"
      ['baseUrl "/base" (slashless)', '/base', ['sw.js']],
      ['baseUrl "/base" (slashless)', '/base', ['/sw.js']],
      ['baseUrl "/base" (slashless)', '/base', ['./sw.js']],
      ['baseUrl "/base" (slashless)', '/base', ['/base/sw.js']],
      ['baseUrl "/base" (slashless)', '/base', ['base/sw.js']],
      ['baseUrl "/base" (slashless)', '/base', ['./base/sw.js']],
      // relative base "./": normalized to "/", so every entry form collides with the SW
      ['base url "./"', './', ['sw.js']],
      ['base url "./"', './', ['/sw.js']],
      ['base url "./"', './', ['./sw.js']],
      ['base url "./"', './', ['../sw.js']],
    ])('rejects with "Critical precache configuration conflict detected!" for $0 with entry $2', async (_desc, baseUrl, entries) => {
      await createFixture(dummySWCode, async ({ root, dist }) => {
        const { options } = await createBundlerChunkFixture(root, dist)

        // second build: the SW file is now targeted for precaching and must be rejected
        configureSecondBuild(options, baseUrl, entries)

        const error = await buildAndCatch(options)

        expect(error).toBeDefined()
        expect(error!.message).toMatch(/Critical precache configuration conflict detected!/)
        expect(error!.message).toMatch(/sw\.js/)
      })
    })
  })

  describe('no false positives (entries that must NOT conflict with the SW)', () => {
    it.each([
      // the base is only stripped on a path boundary: "/base" must not eat "/basement" or "/basesw.js"
      ['baseUrl "/base" (slashless)', '/base', ['/basesw.js']],
      ['baseUrl "/base" (slashless)', '/base', ['/basement/sw.js']],
      ['baseUrl "/base" (slashless)', '/base', ['./basement/sw.js']],
      ['baseUrl "/base" (slashless)', '/base', ['basement/sw.js']],
      ['baseUrl "/base/"', '/base/', ['/basesw.js']],
      ['baseUrl "/base/"', '/base/', ['/basement/sw.js']],
      // same file name in a nested folder is a different file, not the SW
      ['baseUrl undefined (default "/")', undefined, ['nested/sw.js']],
      ['baseUrl undefined (default "/")', undefined, ['/nested/sw.js']],
      ['baseUrl "/base/"', '/base/', ['/base/nested/sw.js']],
      // dotfile names must keep their leading dot (only "./" and "../" are relative prefixes)
      ['baseUrl undefined (default "/")', undefined, ['.sw.js']],
      ['baseUrl undefined (default "/")', undefined, ['/.sw.js']],
      ['baseUrl undefined (default "/")', undefined, ['.well-known/sw.js']],
      // entries that merely look similar to the SW file name
      ['baseUrl undefined (default "/")', undefined, ['sw.json']],
      ['baseUrl undefined (default "/")', undefined, ['my-sw.js']],
      // unrelated entries, including several at once
      ['baseUrl "/base/"', '/base/', ['/base/other.js']],
      ['baseUrl "/base/"', '/base/', ['/base/other.js', '/base/index.html']],
    ])('does not report a conflict for $0 with entry $2', async (_desc, baseUrl, entries) => {
      await createFixture(dummySWCode, async ({ root, dist }) => {
        const { options } = await createBundlerChunkFixture(root, dist)

        configureSecondBuild(options, baseUrl, entries)

        await expect(buildSW(options)).resolves.toBeTruthy()
      })
    })
  })

  describe('imported chunk conflicts', () => {
    // "{chunk}" is replaced with the real hashed file name of the app-cache chunk
    it.each([
      ['baseUrl undefined (default "/")', undefined, '{chunk}'],
      ['baseUrl undefined (default "/")', undefined, '/{chunk}'],
      ['baseUrl undefined (default "/")', undefined, './{chunk}'],
      ['baseUrl undefined (default "/")', undefined, '../{chunk}'],
      ['base url "/base/"', '/base/', '{chunk}'],
      ['base url "/base/"', '/base/', '/{chunk}'],
      ['base url "/base/"', '/base/', 'base/{chunk}'],
      ['base url "/base/"', '/base/', '/base/{chunk}'],
      ['base url "/base/"', '/base/', './base/{chunk}'],
      ['baseUrl "/base" (slashless)', '/base', '/{chunk}'],
      ['baseUrl "/base" (slashless)', '/base', '/base/{chunk}'],
      ['baseUrl "/base" (slashless)', '/base', './base/{chunk}'],
      ['base url "./"', './', '{chunk}'],
      ['base url "./"', './', './{chunk}'],
    ])('rejects for $0 with entry $2', async (_desc, baseUrl, template) => {
      await createFixture(dummySWCode, async ({ root, dist }) => {
        const { options, chunkFile } = await createBundlerChunkFixture(root, dist)

        // second build: the chunk imported by the SW is targeted for precaching
        configureSecondBuild(options, baseUrl, [template.replace('{chunk}', chunkFile)])

        const error = await buildAndCatch(options)

        expect(error).toBeDefined()
        expect(error!.message).toMatch(/Critical precache configuration conflict detected!/)
        expect(error!.message).toContain(chunkFile)
      })
    })
  })

  describe('imported chunk false positives', () => {
    it.each([
      // the base is only stripped on a path boundary
      ['baseUrl "/base" (slashless)', '/base', '/base{chunk}'],
      ['baseUrl "/base" (slashless)', '/base', '/basement/{chunk}'],
      ['baseUrl "/base/"', '/base/', '/base{chunk}'],
      // same file name in another folder is a different file
      ['baseUrl undefined (default "/")', undefined, 'nested/{chunk}'],
      ['baseUrl undefined (default "/")', undefined, '/nested/{chunk}'],
      ['baseUrl "/base/"', '/base/', '/base/nested/{chunk}'],
      // dotfile-like and suffixed names are not the chunk
      ['baseUrl undefined (default "/")', undefined, '.{chunk}'],
      ['baseUrl undefined (default "/")', undefined, '{chunk}.bak'],
      ['baseUrl undefined (default "/")', undefined, 'my-{chunk}'],
    ])('does not report a conflict for $0 with entry $2', async (_desc, baseUrl, template) => {
      await createFixture(dummySWCode, async ({ root, dist }) => {
        const { options, chunkFile } = await createBundlerChunkFixture(root, dist)

        configureSecondBuild(options, baseUrl, [template.replace('{chunk}', chunkFile)])

        await expect(buildSW(options)).resolves.toBeTruthy()
      })
    })
  })

  describe('workbox runtime reserved names depend on swType and workboxRuntimeCompatible', () => {
    describe('names that are NOT reserved (must not conflict)', () => {
      it.each<ReservedNameRow>([
        { reservedName: 'workbox', swType: 'classic', inlineWorkboxRuntime: false, workboxRuntimeCompatible: false },
        { reservedName: 'workbox', swType: 'module', inlineWorkboxRuntime: false, workboxRuntimeCompatible: false },
        { reservedName: 'workbox-classic', swType: 'classic', inlineWorkboxRuntime: false, workboxRuntimeCompatible: true },
        { reservedName: 'workbox-module', swType: 'module', inlineWorkboxRuntime: false, workboxRuntimeCompatible: true },
        { reservedName: 'workbox', swType: 'classic-and-module', inlineWorkboxRuntime: false, workboxRuntimeCompatible: true },
        { reservedName: 'workbox', swType: 'classic', inlineWorkboxRuntime: true, workboxRuntimeCompatible: false },
        { reservedName: 'workbox', swType: 'classic', inlineWorkboxRuntime: true, workboxRuntimeCompatible: true },
        { reservedName: 'workbox', swType: 'module', inlineWorkboxRuntime: true, workboxRuntimeCompatible: false },
        { reservedName: 'workbox', swType: 'module', inlineWorkboxRuntime: true, workboxRuntimeCompatible: true },
        { reservedName: 'workbox', swType: 'classic-and-module', inlineWorkboxRuntime: true, workboxRuntimeCompatible: true },
        { reservedName: 'workbox', swType: 'classic-and-module', inlineWorkboxRuntime: true, workboxRuntimeCompatible: false },
        // each build only reserves its own runtime name, so the other one is free
        { reservedName: 'workbox-classic', swType: 'module', inlineWorkboxRuntime: false, workboxRuntimeCompatible: false },
        { reservedName: 'workbox-module', swType: 'classic', inlineWorkboxRuntime: false, workboxRuntimeCompatible: false },
      ])('does not reject "$reservedName" for "$swType" build (inlineWorkboxRuntime: $inlineWorkboxRuntime, workboxRuntimeCompatible: $workboxRuntimeCompatible)', async (
        row,
      ) => {
        await createFixture(dummySWCode, async ({ root, dist }) => {
          const options = await createReservedNameOptions(root, dist, row)

          await expect(buildSW(options)).resolves.toBeTruthy()
        })
      })
    })

    describe('names that ARE the real Workbox runtime chunk (must conflict)', () => {
      it.each<ReservedNameRow>([
        // legacy name: single builds with the compatible runtime
        { reservedName: 'workbox', swType: 'classic', inlineWorkboxRuntime: false, workboxRuntimeCompatible: true },
        { reservedName: 'workbox', swType: 'module', inlineWorkboxRuntime: false, workboxRuntimeCompatible: true },
        // modern names: single builds with the non compatible runtime
        { reservedName: 'workbox-classic', swType: 'classic', inlineWorkboxRuntime: false, workboxRuntimeCompatible: false },
        { reservedName: 'workbox-module', swType: 'module', inlineWorkboxRuntime: false, workboxRuntimeCompatible: false },
        // dual build always uses the modern names, whatever workboxRuntimeCompatible says
        { reservedName: 'workbox-classic', swType: 'classic-and-module', inlineWorkboxRuntime: false, workboxRuntimeCompatible: true },
        { reservedName: 'workbox-module', swType: 'classic-and-module', inlineWorkboxRuntime: false, workboxRuntimeCompatible: true },
        { reservedName: 'workbox-classic', swType: 'classic-and-module', inlineWorkboxRuntime: false, workboxRuntimeCompatible: false },
        { reservedName: 'workbox-module', swType: 'classic-and-module', inlineWorkboxRuntime: false, workboxRuntimeCompatible: false },
      ])('rejects "$reservedName" for "$swType" build (workboxRuntimeCompatible: $workboxRuntimeCompatible)', async (row) => {
        await createFixture(dummySWCode, async ({ root, dist }) => {
          const options = await createReservedNameOptions(root, dist, row)

          const error = await buildAndCatch(options)

          expect(error).toBeDefined()
          expect(error!.message).toMatch(
            new RegExp(`Custom chunk name \\\\?"${row.reservedName}\\\\?" conflicts with the Service Worker or Workbox runtime chunk names!`),
          )
        })
      })
    })
  })
})
