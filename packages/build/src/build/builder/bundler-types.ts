import type { ManifestEntry, SWTargets, SWType } from '../../types'
import type { EnvironmentData } from '../types'

export interface OriginalEnvironmentData extends EnvironmentData {
  injectionPoint?: string | false
}
export interface ResolvedSWTargets {
  classic: SWTargets
  module: SWTargets
}
export type Bundler = 'vite' | 'rolldown'
export interface BundlerOptions {
  bundler?: Bundler
  filePaths: string[]
  workboxRuntimeCompatible: boolean
  mode?: string
  swSrc: string
  swChunkName: string
  swDest: string
  originalSWType: SWType
  swType: WorkerType
  target: SWTargets
  minify: boolean
  inlineWorkboxRuntime: true | {
    workboxChunkName?: string
  }
  manifestEntries: ManifestEntry[]
  generateSW: boolean
  generateSWCode: string
  detectCircularDeps?: true
  originalEnvironmentData: OriginalEnvironmentData
  circularDependencies: string[]
  chunkNames?: 'dash' | 'dot'
  manifest?: boolean
  sources: string[]
}

export interface PrepareBundlerOptions {
  mode: string
  swType: SWType
  target: ResolvedSWTargets
  swSrc: string
  swChunkName: string
  swDest: string
  classicSWDest: string
  moduleSWDest: string
  classicSWSrc: string
  classicSWChunkName: string
  moduleSWSrc: string
  moduleSWChunkName: string
  workboxRuntimeCompatible: boolean
  minify: boolean
  manifestEntries: ManifestEntry[]
  inlineWorkboxRuntime?: boolean
  generateSW?: {
    swCode: string
  }
  originalEnvironmentData: OriginalEnvironmentData
  chunkNames?: 'dash' | 'dot'
  manifest?: boolean
}

export interface ClassicBuild {
  swType: 'classic' | 'module'
  swChunkName: string
  filePaths: string[]
  generateSW: boolean
  generateSWCode: string
  workboxName?: string
  manifestEntries: ManifestEntry[]
  addChunksSuffixes: boolean
}

export type DetectorMode = 'generate-sw' | 'build-sw'
export type DetectionData<M extends DetectorMode> = M extends 'generate-sw'
  ? import('./detector-types').GenerateSWDependenciesResult
  : import('./detector-types').BuildSWResult
export interface LoadDetectorReturn<M extends DetectorMode> {
  detection: DetectionData<M>
  bundler: Bundler
  warned: boolean
}

export type BundlerPluginType<T extends Bundler> = T extends 'rolldown'
  ? import('rolldown').Plugin
  : import('vite').Plugin

export type RolldownOptions<T extends Bundler> = T extends 'rolldown'
  ? import('../rolldown/internal-types').RolldownBuildOptions
  : import('../vite/internal-types').ViteBuildOptions

export type OnLogType<T extends Bundler> = T extends 'rolldown'
  ? import('rolldown').RolldownOptions['onLog']
  : import('vite').Rolldown.RolldownOptions['onLog']
export type ChecksType<T extends Bundler> = T extends 'rolldown'
  ? import('rolldown').RolldownOptions['checks']
  : import('vite').Rolldown.RolldownOptions['checks']
export interface CircularDependenciesOptions<T extends Bundler> {
  onLog?: OnLogType<T>
  checks?: ChecksType<T>
}
export interface PrepareBundlerBuilder<T extends Bundler> {
  plugins: BundlerPluginType<T>[]
  define: import('rolldown').TransformOptions['define']
  rolldownOptions: import('rolldown').OutputOptions
}

export interface CustomChunksInfo {
  // original custom chunk name or suffixed with -classic or -module on dual SW builds
  customChunkNames: Map<string, string>
  // transformed custom chunk names and the filename
  mappedChunkFiles: Map<string, string>
  // transformed custom chunk names and the imports
  mappedChunkImports: Map<string, string[]>
  // custom chunk file name and the chunks importing it
  // we collect chunks imports, that's, where the chunk is imported
  // for example: custom-chunk-b-<hask>.js: 'custom-chunk-a'
  importedFileChunks: Map<string, string>
}
