import type { Bundler, BundlerPluginType } from '../../src/build/builder/bundler-types'
import type { generateSW as rolldownGenerateSW } from '../../src/build/rolldown/generate-sw'
import type { BundlerLogLevel } from '../../src/build/types'
import type { buildSW as viteBuildSW } from '../../src/build/vite/build-sw'
import type { generateSW as viteGenerateSW } from '../../src/build/vite/generate-sw'
import type { buildSWLegacy } from '../../src/build/vite/legacy-build-sw'
import type { generateSWLegacy } from '../../src/build/vite/legacy-generate-sw'
import path from 'node:path'
import { normalizePath } from '../../src/utils/resolve-sw-names'

type BuildSWFunction = typeof viteBuildSW | typeof buildSWLegacy
type GenerateSWFunction = typeof viteGenerateSW | typeof generateSWLegacy | typeof rolldownGenerateSW

export function createBuildSWPlugin<B extends Bundler>(
  root: string,
  dist: string,
  buildSWFn: BuildSWFunction,
  bundlerLogLevel: BundlerLogLevel,
): BundlerPluginType<B> {
  return {
    name: 'vite-pwa-test-plugin',
    closeBundle: {
      sequential: true,
      order: 'post',
      async handler() {
        const swSrc = normalizePath(path.resolve(root, 'src/sw.js'))
        const swDest = normalizePath(path.resolve(dist, 'sw.js'))
        const globDirectory = normalizePath(dist)
        await buildSWFn({
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
        })
      },
    },
  } as BundlerPluginType<B>
}

export function createGenerateSWPlugin<B extends Bundler>(
  dist: string,
  generateSWFn: GenerateSWFunction,
  bundlerLogLevel: BundlerLogLevel,
): BundlerPluginType<B> {
  return {
    name: 'vite-pwa-test-generate-sw-plugin',
    closeBundle: {
      sequential: true,
      order: 'post',
      async handler() {
        const swDest = normalizePath(path.resolve(dist, 'sw.js'))
        const globDirectory = normalizePath(dist)
        await generateSWFn({
          swDest,
          globDirectory,
          globPatterns: ['**/*.js'],
          inlineWorkboxRuntime: true,
          sourcemap: false,
          mode: 'production',
          logLevel: 'silent',
          bundlerLogLevel,
        })
      },
    },
  } as BundlerPluginType<B>
}
