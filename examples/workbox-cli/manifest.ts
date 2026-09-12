import { getManifest } from '@vite-pwa/workbox-build'
import { globIgnores } from './globIgnores'

getManifest({
  globDirectory: './',
  globIgnores,
  globPatterns: ['**/*.{js,html}'],
// eslint-disable-next-line no-console
}).then(console.log)
