import type { BuildServiceWorkerOptions } from '../../src/build/rolldown/types'
import type { SWType } from '../../src/types'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { expect } from 'vitest'
import { normalizePath } from '../../src/utils/resolve-sw-names'
import { createFixture } from './fixture-utils'

const swCode = `
import { precacheAndRoute } from '@vite-pwa/workbox-swkit/precaching';
import { initCache } from './app-cache.js';
import { initMessages } from './app-messages.js';

precacheAndRoute(self.__WB_MANIFEST);
initCache();
initMessages();
`

// Define a generic type for the injected function (based on plugin-utils)
type BuildSWFunction = (options: any) => Promise<any>

export async function runCustomChunksScenario<
  T extends SWType,
>(
  buildSWFn: BuildSWFunction,
  swType: T,
  optionsOverride: Partial<BuildServiceWorkerOptions<T>> = {},
) {
  await createFixture(swCode, async ({ root, dist }) => {
    const relativeDist = normalizePath(path.relative(process.cwd(), dist))
    const src = path.resolve(root, 'src')
    await fs.mkdir(dist, { recursive: true })

    // 1. write independent modules with side effects
    await fs.writeFile(
      path.resolve(src, 'app-cache.js'),
      'export function initCache() { console.log("cache initialized"); }\n',
      'utf-8',
    )
    await fs.writeFile(
      path.resolve(src, 'app-messages.js'),
      'export function initMessages() { console.log("messages initialized"); }\n',
      'utf-8',
    )
    await fs.writeFile(
      path.resolve(dist, 'index.js'),
      'export function main() { console.log("main initialized"); }\n',
      'utf-8',
    )

    // 2. set up the default options for the scenario
    const defaultOptions: BuildServiceWorkerOptions<T> = {
      swSrc: path.resolve(src, 'sw.js'),
      swDest: path.resolve(dist, 'sw.js'),
      globDirectory: dist,
      globPatterns: ['**/*.js'],
      swType,
      inlineWorkboxRuntime: false,
      workboxRuntimeCompatible: true,
      minify: false,
      sourcemap: false,
      globIgnores: [
        '**/app-cache*.js',
        '**/app-cache*.map',
        '**/app-messages*.js',
        '**/app-messages*.map',
      ],
      customChunks: (moduleId, ctx) => {
        const id = ctx.getModuleInfo(moduleId)?.id
        if (id?.includes('app-cache.js')) {
          return 'app-cache'
        }
        if (id?.includes('app-messages.js')) {
          return 'app-messages'
        }
      },
    }

    const inlineWorkboxRuntime = optionsOverride.inlineWorkboxRuntime ?? defaultOptions.inlineWorkboxRuntime

    // 3. run the injected build
    await buildSWFn({
      ...defaultOptions,
      ...optionsOverride,
      globIgnores: [
        ...defaultOptions.globIgnores!,
        ...(optionsOverride.globIgnores || []),
      ],
    })

    // 4. hash-independent assertions
    const files = await fs.readdir(dist).then(fArray => fArray.map(f => normalizePath(f).replace(relativeDist, '')))
    const swContent = await fs.readFile(path.resolve(dist, 'sw.js'), 'utf-8')

    // Locate the files by their logical prefix
    const appCacheChunk = files.find(f => f.startsWith('app-cache-') && f.endsWith('.js'))
    const appMessagesChunk = files.find(f => f.startsWith('app-messages-') && f.endsWith('.js'))
    const workboxChunk = inlineWorkboxRuntime ? undefined : files.find(f => f.startsWith('workbox-') && f.endsWith('.js'))

    expect(appCacheChunk, 'app-cache chunk is missing').toBeDefined()
    expect(appMessagesChunk, 'app-messages chunk is missing').toBeDefined()
    if (inlineWorkboxRuntime) {
      expect(workboxChunk, 'workbox runtime chunk is emitted').toBeUndefined()
    }
    else {
      expect(workboxChunk, 'workbox runtime chunk is missing').toBeDefined()
    }

    // Verify that the manifest was injected (self.__WB_MANIFEST is no longer present)
    expect(swContent).not.toContain('self.__WB_MANIFEST')

    if (swType === 'classic') {
      // Classic: Verify that importScripts includes all emitted files
      // We don't check the exact order to avoid flakiness
      expect(swContent).toMatch(/importScripts\(/)
      expect(swContent).toContain(appCacheChunk)
      expect(swContent).toContain(appMessagesChunk)
      expect(swContent).toContain(workboxChunk)

      // Classic: Verify the magic of transform-classic-chunk
      // Named imports should have been mutated to properties of self.workbox
      expect(swContent).toContain('self.workbox.appCache')
      expect(swContent).toContain('self.workbox.appMessages')
    }
    else {
      // Module: Maintain the native ESM syntax and the relative references to the emitted chunks
      expect(swContent).toMatch(new RegExp(`import.*from\\s*['"./]+${appCacheChunk}['"]`))
      expect(swContent).toMatch(new RegExp(`import.*from\\s*['"./]+${appMessagesChunk}['"]`))
    }
  })
}
