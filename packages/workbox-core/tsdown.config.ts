import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/{index,internals}.ts',
  platform: 'browser',
  banner: `/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/`,
  define: {
    'process.env.NODE_ENV': 'process.env.NODE_ENV',
  },
})
