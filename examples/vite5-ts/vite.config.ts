import type { ManifestEntry } from '@vite-pwa/workbox-build/types'
import type { Plugin, PluginOption } from 'vite'
import process from 'node:process'
import { ViteWorkboxPWAPlugin } from '@vite-pwa/workbox-build/build/vite/plugin'
import { defineConfig } from 'vite'

const swSrc = 'src/sw.ts'
const swDest = 'sw.js'

const enableSWKitLogs = 'ENABLE_SWKIT_LOGS' in process.env ? process.env.ENABLE_SWKIT_LOGS === 'true' : undefined

function virtualMessagePlugin(): Plugin {
  const virtual = 'virtual:message'
  const resolvedVirtual = `\0${virtual}`
  return {
    name: 'vite-plugin-test',
    resolveId(id) {
      return id === virtual ? resolvedVirtual : null
    },
    load(id) {
      if (id === resolvedVirtual)
        return `export const message = 'Message from Virtual Module Plugin'`
    },
  } satisfies Plugin
}

async function* additionalManifestEntriesGenerator(): AsyncGenerator<string | ManifestEntry, undefined, void> {
  const [{ hash }, { readFile }] = await Promise.all([
    import('node:crypto'),
    import('node:fs/promises'),
  ])
  yield {
    url: 'favicon.svg',
    revision: hash('md5', await readFile('public/favicon.svg', 'utf-8'), 'hex'),
  }
}

export default defineConfig({
  plugins: [
    virtualMessagePlugin(),
    ViteWorkboxPWAPlugin({
      strategy: 'build-sw',
      buildSW: {
        minify: false,
        sourcemap: true,
        enableSWKitLogs,
        inlineWorkboxRuntime: false,
        swType: 'classic-and-module',
        swSrc,
        swDest,
        customChunks: (moduleId, ctx) => {
          if (ctx.getModuleInfo(moduleId)?.id.includes('sw-helper')) {
            return 'sw-helper'
          }
        },
        plugins: () => [virtualMessagePlugin()],
        additionalManifestEntriesGenerator,
      },
    }) as PluginOption,
  ],
})
