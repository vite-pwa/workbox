import type { OutputOptions, RolldownBuild, RolldownOutput } from 'rolldown'
import type { RolldownBuildOptions } from './internal-types'
import { rolldown } from 'rolldown'
import { prepareCircularDependencies } from '../builder/prepare-circular-dependencies'
import { prepareManifestName } from '../builder/prepare-manifest-name'
import { prepareRolldownOutputOptions } from '../builder/prepare-rolldown-output-options'
import { generateManifest } from './generate-manifest'

async function writeServiceWorker(
  instance: RolldownBuild,
  options: OutputOptions,
): Promise<RolldownOutput> {
  try {
    return await instance.write(options)
  }
  finally {
    await instance.close()
  }
}

export async function prepareRolldownBuild(
  options: RolldownBuildOptions,
): Promise<import('rolldown').RolldownOutput> {
  const {
    swSrc,
    target,
    minify,
    alias,
    sourcemap,
    logLevel,
  } = options

  const {
    plugins,
    define,
    rolldownOptions,
  } = await prepareRolldownOutputOptions('rolldown', options)

  const { checks, onLog } = prepareCircularDependencies<'rolldown'>(options)

  const instance = await rolldown({
    input: swSrc,
    resolve: {
      alias,
    },
    platform: 'browser',
    treeshake: true,
    plugins,
    logLevel,
    checks,
    onLog,
    transform: {
      define,
      target,
    },
  })

  const output = await writeServiceWorker(
    instance,
    Object.assign(
      rolldownOptions,
      {
        sourcemap,
        minify,
      },
    ),
  )

  const manifestName = prepareManifestName(options)
  if (manifestName) {
    await generateManifest(manifestName, options, output)
  }

  return output
}
