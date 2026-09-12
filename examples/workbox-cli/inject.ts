import fs from 'node:fs/promises'
import { injectManifest } from '@vite-pwa/workbox-build/inject-manifest'
import { rolldown } from 'rolldown'
import { globIgnores } from './globIgnores'

rolldown({
  input: 'custom-sw.js',
  platform: 'browser',
}).then((instance) => {
  return instance.write({
    sourcemap: true,
    // sourcemap: 'inline',
    // sourcemap: 'hidden',
    dir: 'dist',
    format: 'iife',
    cleanDir: false,
    entryFileNames: 'custom-sw.js',
    codeSplitting: false,
  })
}).then(() => {
  return fs.readFile('dist/custom-sw.js.map', 'utf8').then((code) => {
    // eslint-disable-next-line no-console
    console.log('Original sourcemap file', code)
    return injectManifest({
      swSrc: 'dist/custom-sw.js',
      swDest: 'dist/custom-sw.js',
      // injectionPoint: false,
      globDirectory: './',
      globIgnores,
      globPatterns: ['**/*.{js,html}'],
    })
  })
}).then((result) => {
  // eslint-disable-next-line no-console
  console.log(result)
  return Promise.all([
    fs.cp('./index.html', 'dist/index.html'),
    fs.cp('./index.js', 'dist/index.js'),
  ])
}).then(() => {
  // eslint-disable-next-line no-console
  console.log('build done, now run => pnpx server ./dist')
})
