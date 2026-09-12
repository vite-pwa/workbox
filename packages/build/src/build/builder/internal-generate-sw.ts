import type { BuildResult, SWType } from '../../types'
import type { GenerateContext } from './build-context'
import type { Bundler } from './bundler-types'
import { deepMergeObject } from '../../utils/utils'
import { validateGenerateSW } from '../../validation/validation-helper'
import { logPWAWorkboxResult } from './log-result'
import { prepareBundlerOptions } from './prepare-bundler-options'
import { prepareSWCode } from './prepare-sw-code'
import { runBundlerBuild } from './run-bundler-build'
import {
  extractOriginalEnvironmentData,
  prepareSWTargets,
  resolveSWNamesAndGlobIgnores,
} from './utils'

export async function internalGenerateSW<
  T extends SWType,
  B extends Bundler,
>(
  context: GenerateContext<T, B>,
  prepareBuilds: (context: GenerateContext<T, B>) => Promise<any>[],
): Promise<BuildResult> {
  const optionsWithDefaults = await validateGenerateSW(
    context.options,
  )

  // clone mode, baseUrl, envDir, envPrefix and define (GenerateSW doesn't have injectionOptions)
  context.originalEnvironmentData = extractOriginalEnvironmentData(
    context.options,
  )

  deepMergeObject(
    context.options,
    optionsWithDefaults,
  )

  const {
    classicSWSrc,
    classicSWChunkName,
    moduleSWSrc,
    moduleSWChunkName,
    swDest,
    classicSWDest,
    moduleSWDest,
  } = resolveSWNamesAndGlobIgnores(
    context.options,
    '',
    true,
  )

  const {
    target,
    chunkNames,
    manifest,
  } = context.options

  context.resolvedSWTargets = prepareSWTargets(
    target!,
  )

  const {
    count,
    size,
    warnings,
    swCode,
  } = await prepareSWCode(
    context.options,
    context.options.globDirectory,
  )

  const {
    builds,
    filePathsMap,
    classicCircularDependencies,
    moduleCircularDependencies,
  } = prepareBundlerOptions({
    mode: context.options.mode || 'production',
    swType: context.options.swType!,
    swSrc: '',
    swChunkName: '',
    swDest,
    classicSWDest,
    moduleSWDest,
    classicSWSrc: classicSWSrc!,
    classicSWChunkName: classicSWChunkName!,
    moduleSWSrc: moduleSWSrc!,
    moduleSWChunkName: moduleSWChunkName!,
    inlineWorkboxRuntime: context.options.inlineWorkboxRuntime,
    minify: context.options.minify!,
    manifestEntries: [],
    target: context.resolvedSWTargets,
    workboxRuntimeCompatible: context.options.workboxRuntimeCompatible!,
    generateSW: { swCode },
    originalEnvironmentData: context.originalEnvironmentData,
    chunkNames,
    manifest,
  })

  context.builds = builds

  const buildResult = await runBundlerBuild(
    count,
    size,
    warnings,
    builds,
    filePathsMap,
    () => prepareBuilds(context),
  )

  // since the source code is the same, on dual build we pick classic ones
  const circularDependencies = classicCircularDependencies.length > 0
    ? classicCircularDependencies
    : moduleCircularDependencies

  logPWAWorkboxResult(
    context.bundler,
    'generateSW',
    buildResult,
    performance.now() - context.start,
    context.options.logLevel!,
    context.options.bundlerLogLevel!,
    circularDependencies,
  )

  return buildResult
}
