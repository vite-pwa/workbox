/** @type {Partial<import('@vite-pwa/workbox-build/config/types').WorkboxBuildConfiguration>} */
const config = {
  buildSW: {
    swSrc: 'src/sw.js',
    swDest: 'sw.js',
    globPatterns: ['**/*.{html,js,css,svg,png}'],
    // injectionPoint: 'globalThis.__WB_MANIFEST',
    inlineWorkboxRuntime: false,
    sourcemap: true,
    minify: false,
    mode: 'production',
    manifest: true,
  },
}

export default config
