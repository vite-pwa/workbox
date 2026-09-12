import { defineOptions } from '@vite-pwa/workbox-build/config'
import { runtimeCaching } from './cache'
import { globIgnores } from './globIgnores'

export default defineOptions('generate-sw', {
  generateSW: {
    globDirectory: './',
    globIgnores,
    globPatterns: ['**/*.{js,html}'],
    skipWaiting: true,
    navigateFallback: 'index.html',
    cleanupOutdatedCaches: true,
    swDest: 'sw.js',
    runtimeCaching,
    parallel: { enabled: true, concurrency: 5 },
  },
})
