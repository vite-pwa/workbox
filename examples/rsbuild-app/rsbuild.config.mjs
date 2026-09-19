import process from 'node:process'
import { defineConfig } from '@rsbuild/core'
import { RspackWorkboxPWAPlugin } from '@vite-pwa/workbox-build/build/rspack'
import PWAConfig from './external-pwa.config.mjs'

/** @type {'inline' | 'external' | 'override'} */
const confType = process.env.PWA_CONFIG || 'inline'

/** @type {Partial<import('@vite-pwa/workbox-build/config/types').WorkboxBuildConfiguration>} */
const config = confType === 'external'
  ? { path: 'external-pwa.config.mjs' }
  : confType === 'inline'
    ? PWAConfig
    : Object.assign(
        {},
        PWAConfig,
        {
          buildSW: {
            // merging should disable runtime split
            inlineWorkboxRuntime: true,
          },
        },
        {
          mergeOptions: true,
          path: 'external-pwa.config.mjs',
        },
      )

export default defineConfig({
  source: {
    entry: {
      index: './src/index.js',
    },
  },
  html: {
    title: 'Rsbuild PWA',
  },
  output: {
    cleanDistPath: true,
    distPath: {
      root: 'dist',
      js: 'assets',
      css: 'assets',
    },
    sourceMap: {
      js: 'source-map',
    },
  },
  tools: {
    rspack: {
      plugins: [
        new RspackWorkboxPWAPlugin(
          'build-sw',
          config,
        ),
      ],
    },
  },
})
