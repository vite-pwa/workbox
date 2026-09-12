import type { ViteBuildOptions } from './internal-types'
import path from 'node:path'
import process from 'node:process'
import { build } from 'vite'
import { prepareCircularDependencies } from '../builder/prepare-circular-dependencies'
import { prepareManifestName } from '../builder/prepare-manifest-name'
import { prepareRolldownOutputOptions } from '../builder/prepare-rolldown-output-options'

export async function prepareViteBuild(
  options: ViteBuildOptions,
): ReturnType<typeof build> {
  const {
    swSrc,
    swDest,
    target,
    minify,
    sourcemap,
    envPrefix,
    envDir,
    logLevel,
    alias,
  } = options

  const manifest = prepareManifestName(options)

  const {
    plugins,
    define,
    rolldownOptions: output,
  } = await prepareRolldownOutputOptions('vite', options)

  const { checks, onLog } = prepareCircularDependencies<'vite'>(options)

  return await build({
    plugins,
    configFile: false,
    forceOptimizeDeps: false,
    envPrefix,
    envDir,
    logLevel,
    resolve: {
      alias,
    },
    build: {
      // write: true,
      // don't clear outDir folder
      emptyOutDir: false,
      // don't copy anything from public dir
      copyPublicDir: false,
      outDir: path.dirname(path.resolve(process.cwd(), swDest)),
      target,
      minify,
      sourcemap,
      manifest,
      rolldownOptions: {
        input: swSrc,
        platform: 'browser',
        treeshake: true,
        checks,
        onLog,
        output,
        transform: {
          define,
        },
      },
    },
  })
}
