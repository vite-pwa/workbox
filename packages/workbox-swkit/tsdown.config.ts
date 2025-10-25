import { createRequire } from 'node:module'
import { defineConfig } from 'tsdown'
import { banner, define, exports } from '../../helper.ts'

const require = createRequire(import.meta.url)
const packageJson = require('./package.json')

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
  platform: 'browser',
  banner,
  define,
  noExternal: ['idb'],
  exports,
})
