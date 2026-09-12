import { defineOptions } from '@vite-pwa/workbox-build/config'

export default defineOptions('inject-manifest', {
  injectManifest: {
    swSrc: 'custom-sw.js',
    swDest: 'custom-build/sw-cli-generated.js',
    injectionPoint: 'self.__WB_MANIFEST',
    globDirectory: './custom-build',
    globPatterns: ['**/*.{js,html}'],
  },
})
