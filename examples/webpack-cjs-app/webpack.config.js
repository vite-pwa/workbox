const path = require('node:path')
const process = require('node:process')
const { WorkboxPlugin } = require('@vite-pwa/workbox-build/build/webpack')
const PWAConfig = require('./external-pwa.config.mjs').default

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

const root = __dirname

class HtmlPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('HtmlPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'HtmlPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          compilation.emitAsset(
            'index.html',
            new compiler.webpack.sources.RawSource(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webpack PWA</title>
  </head>
  <body>
    <main id="app"></main>
    <script src="./main.js"></script>
  </body>
</html>
`),
          )
        },
      )
    })
  }
}

module.exports = {
  mode: 'production',
  context: root,
  devtool: 'source-map',
  entry: './src/index.js',
  output: {
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].js',
    assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
    clean: true,
    path: path.resolve(root, 'dist'),
  },
  plugins: [
    new HtmlPlugin(),
    new WorkboxPlugin(
      'build-sw',
      config,
    ),
  ],
}
