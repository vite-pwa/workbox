import type {
  BundlerOptions,
  PrepareBundlerOptions,
} from './bundler-types'

interface PrepareBundlerOptionsType {
  builds: BundlerOptions[]
  filePathsMap: Map<'classic' | 'module', string[]>
  classicCircularDependencies: string[]
  moduleCircularDependencies: string[]
  classicSources: string[]
  moduleSources: string[]
}

export function prepareBundlerOptions(
  options: PrepareBundlerOptions,
): PrepareBundlerOptionsType {
  let {
    mode,
    swSrc,
    swChunkName,
    swDest,
    classicSWSrc,
    classicSWChunkName,
    classicSWDest,
    moduleSWSrc,
    moduleSWChunkName,
    moduleSWDest,
    target,
    inlineWorkboxRuntime,
    workboxRuntimeCompatible,
    minify,
    generateSW,
    manifestEntries,
    chunkNames,
    manifest,
  } = options

  const builds: BundlerOptions[] = []
  const filePathsMap = new Map<'classic' | 'module', string[]>([['classic', []], ['module', []]])
  const swType = options.swType!
  const classicCircularDependencies: string[] = []
  const moduleCircularDependencies: string[] = []
  const classicSources: string[] = []
  const moduleSources: string[] = []

  if (swType === 'classic-and-module' || swType === 'classic') {
    if (generateSW) {
      swSrc = classicSWSrc
      swChunkName = classicSWChunkName
      swDest = swType === 'classic-and-module' || !workboxRuntimeCompatible ? classicSWDest : swDest
    }
    else {
      swDest = swType === 'classic-and-module' || !workboxRuntimeCompatible ? classicSWDest : swDest
    }
    builds.push({
      mode,
      manifestEntries,
      filePaths: filePathsMap.get('classic')!,
      swSrc,
      swChunkName,
      swDest,
      target: target.classic,
      minify,
      inlineWorkboxRuntime: inlineWorkboxRuntime
        ? true
        : {
            workboxChunkName: swType === 'classic-and-module' || !workboxRuntimeCompatible ? 'workbox-classic' : 'workbox',
          },
      workboxRuntimeCompatible: swType === 'classic' ? workboxRuntimeCompatible : false,
      originalSWType: swType,
      swType: 'classic',
      generateSW: !!generateSW,
      generateSWCode: generateSW?.swCode || '',
      originalEnvironmentData: options.originalEnvironmentData,
      circularDependencies: classicCircularDependencies,
      chunkNames,
      manifest,
      sources: classicSources,
    })
  }

  if (swType === 'classic-and-module' || swType === 'module') {
    if (generateSW) {
      swSrc = moduleSWSrc
      swChunkName = moduleSWChunkName
      swDest = swType === 'classic-and-module' || !workboxRuntimeCompatible ? moduleSWDest : swDest
    }
    else {
      swDest = swType === 'classic-and-module' || !workboxRuntimeCompatible ? moduleSWDest : swDest
    }
    builds.push({
      mode,
      manifestEntries,
      filePaths: filePathsMap.get('module')!,
      swSrc,
      swChunkName,
      swDest,
      target: target.module,
      minify,
      inlineWorkboxRuntime: inlineWorkboxRuntime
        ? true
        : {
            workboxChunkName: swType === 'classic-and-module' || !workboxRuntimeCompatible ? 'workbox-module' : 'workbox',
          },
      workboxRuntimeCompatible: swType === 'module' ? workboxRuntimeCompatible : false,
      originalSWType: swType,
      swType: 'module',
      generateSW: !!generateSW,
      generateSWCode: generateSW?.swCode || '',
      originalEnvironmentData: options.originalEnvironmentData,
      circularDependencies: moduleCircularDependencies,
      chunkNames,
      manifest,
      sources: moduleSources,
    })
  }

  return {
    builds,
    filePathsMap,
    classicCircularDependencies,
    moduleCircularDependencies,
    classicSources,
    moduleSources,
  }
}
