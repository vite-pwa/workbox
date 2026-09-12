import type { BundlerLogLevel } from '../../src/build/types'
import type { Strategy } from '../../src/config/types'
import path from 'node:path'
import { ViteWorkboxPWAPlugin } from '../../src/build/vite/plugin'
import { normalizePath } from '../../src/utils/resolve-sw-names'

export function createBuildSWPlugin(
  root: string,
  dist: string,
  strategy: Strategy,
  bundlerLogLevel: BundlerLogLevel,
) {
  const swSrc = normalizePath(path.resolve(root, 'src/sw.js'))
  const swDest = normalizePath(path.resolve(dist, 'sw.js'))
  const globDirectory = normalizePath(dist)

  return ViteWorkboxPWAPlugin({
    strategy,
    buildSW: {
      swSrc,
      swDest,
      globDirectory,
      globPatterns: ['**/*.js'],
      injectionPoint: 'self.__WB_MANIFEST',
      inlineWorkboxRuntime: true,
      sourcemap: false,
      mode: 'production',
      logLevel: 'silent',
      bundlerLogLevel,
    },
    generateSW: {
      swDest,
      globDirectory,
      globPatterns: ['**/*.js'],
      inlineWorkboxRuntime: true,
      sourcemap: false,
      mode: 'production',
      logLevel: 'silent',
      bundlerLogLevel,
    },
    injectManifest: {
      swSrc,
      swDest,
      globDirectory,
      globPatterns: ['**/*.js'],
      injectionPoint: 'self.__WB_MANIFEST',
      logLevel: 'silent',
    },
  })
}
