import type { TSConfig } from 'pkg-types'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { resolve } from 'pathe'

const require = createRequire(import.meta.url)

const compilerOptions: TSConfig['compilerOptions'] = require('./tsconfig.json').compilerOptions

function r(p: string) {
  return resolve(fileURLToPath(new URL('.', import.meta.url)), p)
}

export const alias = Array.from(Object.entries(compilerOptions!.paths)).reduce((acc, [name, paths]) => {
  acc[name] = r((paths as string[])[0])
  return acc
}, {} as Record<string, string>)
