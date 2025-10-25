export const banner = `/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/`

export const define = {
  'process.env.NODE_ENV': 'process.env.NODE_ENV',
} satisfies import('tsdown').Options['define']

export const exports = {
  customExports(exp, { pkg }) {
    // **/types contains only types: just replace the entry
    const typesVersions: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(exp)) {
      // add typesVersions entry
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
} satisfies import('tsdown').ExportsOptions
