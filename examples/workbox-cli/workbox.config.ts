import { defineCliOptions } from '@vite-pwa/workbox-cli'
import { runtimeCaching } from './cache.ts'
import { globIgnores } from './globIgnores.ts'

export default defineCliOptions('generate-sw', {
  selfDestroying: {
    selfDestroying: true,
    swDest: 'sw-destroy.js',
  },

  generateSW: {
    globDirectory: './',
    globIgnores,
    globPatterns: ['**/*.{js,html}'],
    skipWaiting: true,
    navigateFallback: 'index.html',
    cleanupOutdatedCaches: true,
    swDest: 'sw.js',
    runtimeCaching,
    parallel: { enabled: true, concurrency: 11 },
    minify: false,
  },

  buildSW: {
    swSrc: 'src/sw.ts',
    swDest: 'dist/sw.js',
    globDirectory: './dist',
    globPatterns: ['**/*.{js,html}'],
    globIgnores,
    globStrict: false, // <== allows empty dist
  },

  injectManifest: {
    swSrc: 'custom-sw.js',
    swDest: 'custom-build/sw-cli-generated.js',
    injectionPoint: 'self.__WB_MANIFEST',
    globDirectory: './custom-build',
    globPatterns: ['**/*.{js,html}'],
    globIgnores,
  },

  getManifest: {
    globDirectory: './',
    globIgnores,
    globPatterns: ['**/*.{js,html}'],
  },
})
