import type { BuildServiceWorkerOptions } from '../../src/build/rolldown'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { expect } from 'vitest'
import { buildSW } from '../../src/build/rolldown/build-sw'

export async function createBundlerFixture(prefix: string, packageJson: string, use: (paths: { root: string, dist: string }) => Promise<void>) {
  let root: string | undefined
  try {
    root = await fs.mkdtemp(path.resolve(process.cwd(), 'test', 'temp-fixtures', `${prefix}-pwa-`))
    const src = path.resolve(root, 'src')
    const dist = path.resolve(root, 'dist')

    await fs.mkdir(src)

    const indexContent = 'document.body.textContent = "PWA compiler smoke"\n'
    const swContent = `import { clientsClaim } from "@vite-pwa/workbox-swkit/core"
    import { precacheAndRoute } from "@vite-pwa/workbox-swkit/precaching"

    globalThis.skipWaiting()
    clientsClaim()
    precacheAndRoute(globalThis.__WB_MANIFEST)
    `

    await Promise.all([
      fs.writeFile(path.resolve(src, 'index.js'), indexContent, 'utf-8'),
      fs.writeFile(path.resolve(src, 'sw.js'), swContent, 'utf-8'),
      fs.writeFile(path.resolve(root, 'package.json'), packageJson, 'utf-8'),
    ])

    await use({ root, dist })
  }
  finally {
    if (root) {
      await fs.rm(root, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      }).catch((err) => {
        console.error(`Failed to cleanup sandbox at ${root}:`, err)
      })
    }
  }
}

// Shared helper: writes the fixture, runs a first build that excludes the chunk from the
// glob and returns the options plus the real (hashed) file name of the app-cache chunk.
export async function createBundlerChunkFixture(root: string, dist: string) {
  const src = path.resolve(root, 'src')
  await fs.mkdir(dist, { recursive: true })

  await fs.writeFile(
    path.resolve(src, 'app-cache.js'),
    'export function initCache() { console.log("cache initialized"); }\n',
    'utf-8',
  )
  await fs.writeFile(
    path.resolve(src, 'sw.js'),
    `import { precacheAndRoute } from '@vite-pwa/workbox-swkit/precaching';
import { initCache } from './app-cache.js';

precacheAndRoute(self.__WB_MANIFEST);
initCache();
`,
    'utf-8',
  )

  const options = {
    swSrc: path.resolve(src, 'sw.js'),
    swDest: path.resolve(dist, 'sw.js'),
    // disable globStrict to allow the build, since there is no .js files other
    // other than sw.js and the app-cache files
    globStrict: false,
    globDirectory: dist,
    globPatterns: ['**/*.js'],
    globIgnores: ['**/app-cache*.js'],
    minify: false,
    swType: 'classic',
    customChunks: (moduleId, ctx) => {
      const id = ctx.getModuleInfo(moduleId)?.id
      if (id?.includes('app-cache.js')) {
        return 'app-cache'
      }
    },
  } as BuildServiceWorkerOptions<'classic'>

  const firstBuild = await buildSW(options)
  // disable globStrict to allow the build, since there is no .js files other
  // other than sw.js and the app-cache files
  expect(firstBuild.warnings).toHaveLength(1)
  expect(firstBuild.warnings[0]).toMatch(/glob patterns? doesn't match any files/i)

  // Rolldown adds a hash to the chunk name, so read it from disk.
  // Normalize separators: readdir returns backslashes on Windows.
  const files = (await fs.readdir(dist, { recursive: true })).map(f => f.replace(/\\/g, '/'))
  const chunkFile = files.find(f => /(?:^|\/)app-cache[^/]*\.js$/.test(f))
  if (!chunkFile) {
    throw new Error(`app-cache chunk not found in dist. Files found: ${files.join(', ')}`)
  }

  return { options, chunkFile }
}
