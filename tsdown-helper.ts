export const workboxBanner = `/*!
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/`

export const pwaBanner = `/*!
  MIT License
  
  Copyright (c) 2020-PRESENT Anthony Fu <https://github.com/antfu>

  https://github.com/userquin/quini-pwa-monorepo/blob/main/LICENSE.
*/`

export const attw = {
  level: 'error',
  profile: 'esm-only',
} satisfies import('tsdown').AttwOptions

export const publint = true

export const nodeEnvDefine = {
  'process.env.NODE_ENV': 'process.env.NODE_ENV',
} satisfies import('tsdown').InlineConfig['define']

const regexp = {
  js: /\.js$/,
  mjs: /\.mjs$/,
} as const

export const fixTypesVersion = {
  customExports(exp, { pkg }) {
    // **/types contains only types: just replace the entry
    const typesVersions: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(exp)) {
      // add typesVersions entry
      if (key !== '.' && key !== './package.json') {
        const isMjs = value.endsWith('.mjs')
        const isCjs = value.endsWith('.cjs')
        if (isMjs) {
          typesVersions[key.slice(2)] = [value.replace(regexp.mjs, '.d.mts')]
        }
        else {
          typesVersions[key.slice(2)] = [value.replace(regexp.js, isCjs ? '.d.cts' : '.d.ts')]
        }
        if (key.endsWith('/types')) {
          if (isMjs) {
            exp[key] = { types: value.replace(regexp.mjs, '.d.mts') }
          }
          else {
            exp[key] = { types: value.replace(regexp.js, isCjs ? '.d.cts' : '.d.ts') }
          }
        }
      }
    }

    pkg.typesVersions = { '*': typesVersions }

    return exp
  },
} satisfies import('tsdown').ExportsOptions

export async function cleanupDistFiles(cwd: string, patterns: string | string[]) {
  const [fs, path] = await Promise.all([
    import('node:fs/promises'),
    import('node:path'),
  ])
  const dir = fs.glob(patterns, {
    withFileTypes: true,
    cwd: path.resolve(cwd, 'dist'),
  })

  for await (const file of dir) {
    await fs.rm(path.resolve(file.parentPath, file.name), { force: true })
  }
}

export async function cleanupJSTypes(cwd: string) {
  await cleanupDistFiles(cwd, ['**/types.{js,mjs}'])
}

export async function cleanupDualJSTypes(cwd: string) {
  await cleanupDistFiles(cwd, ['**/types.{js,mjs,cjs}'])
}

export async function cleanupCliFiles(cwd: string) {
  await cleanupDistFiles(cwd, ['**/cli.{cjs,d.cts,d.mts}'])
}
