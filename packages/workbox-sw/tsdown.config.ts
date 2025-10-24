import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts', // <== barrel
    'src/types.ts', // <== all types
    'src/background-sync/index.ts',
    'src/background-sync/types.ts',
    'src/broadcast-update/index.ts',
    'src/broadcast-update/types.ts',
    'src/cacheable-response/index.ts',
    'src/cacheable-response/types.ts',
    'src/core/index.ts',
    'src/core/types.ts',
    'src/expiration/index.ts',
    'src/expiration/types.ts',
    'src/navigation-preload/index.ts',
    'src/precaching/index.ts',
    'src/precaching/types.ts',
    'src/range-requests/index.ts',
    'src/recipes/index.ts',
    'src/routing/index.ts',
    'src/routing/types.ts',
    'src/strategies/index.ts',
    'src/streams/index.ts',
    'src/streams/types.ts',
    'src/sw/index.ts',
  ],
  exports: true,
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
  noExternal: ['idb'],
  exports: {
    customExports(exp, { pkg }) {
      // **/types contains only types: just replace the entry
      const typesVersions: Record<string, string[]> = {}
      for (const [key, value] of Object.entries(exp)) {
        // add typesVersion entry
        if (key !== '.' && key !== './package.json') {
          typesVersions[key.slice(2)] = [value.replace(/\.js$/, '.d.ts')]
        }
        if (key.endsWith('/types')) {
          exp[key] = { types: value.replace(/\.js$/, '.d.ts') }
        }
      }

      pkg.typesVersions = { '*': typesVersions }

      return exp
    },
  },
})
