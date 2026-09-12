import { defineOptions } from '@vite-pwa/workbox-build/config'

export default defineOptions('build-sw', {
  buildSW: {
    swSrc: 'custom-sw.js',
    swDest: 'custom-build/sw-cli-generated.js',
    globDirectory: './custom-build',
    globPatterns: ['**/*.{js,html}'],
  },
})
