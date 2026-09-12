import type { SWType } from '../../types'
import type { BuildGenerateSWOptions, BuildSWOptions } from '../types'
import type { Bundler, BundlerOptions, ClassicBuild, OriginalEnvironmentData, ResolvedSWTargets } from './bundler-types'

export interface GeneratedAsset {
  name: string
  size: string
}

export interface BaseContext<
  B extends Bundler,
  BO extends BundlerOptions,
> {
  bundler: B
  start: ReturnType<typeof performance.now>
  end: ReturnType<typeof performance.now>
  filePaths: GeneratedAsset[]
  tempFiles: string[]
  tempFileWrites: Promise<void>[]
  builds: BundlerOptions[]
  originalEnvironmentData: OriginalEnvironmentData
  resolvedSWTargets: ResolvedSWTargets
  classicBuild: ClassicBuild
  bundlerOptions: BO[]
  warnings: {
    manifest: string[]
    circular: string[]
    customChunks: string[]
  }
}

export interface GenerateContext<
  T extends SWType,
  B extends Bundler,
> extends BaseContext<B, BundlerOptions> {
  options: BuildGenerateSWOptions<T>
}

export interface BuildContext<
  T extends SWType,
  B extends Bundler,
  BO extends BundlerOptions,
> extends BaseContext<B, BO> {
  options: BuildSWOptions<T, B>
}

function createBaseContext<
  B extends Bundler,
  BO extends BundlerOptions,
>(
  start: ReturnType<typeof performance.now>,
  bundler: B,
): BaseContext<B, BO> {
  return {
    bundler,
    start,
    end: start,
    filePaths: [],
    tempFiles: [],
    tempFileWrites: [],
    builds: undefined!,
    originalEnvironmentData: undefined!,
    bundlerOptions: undefined!,
    classicBuild: undefined!,
    resolvedSWTargets: undefined!,
    warnings: {
      manifest: [],
      circular: [],
      customChunks: [],
    },
  }
}

export function createGenerateSWContext<
  T extends SWType,
  B extends Bundler,
>(
  buildStart: ReturnType<typeof performance.now>,
  bundler: B,
  options: BuildGenerateSWOptions<T>,
): GenerateContext<T, B> {
  return Object.assign(createBaseContext(buildStart, bundler), {
    options,
  })
}

export function createBuildSWContext<
  T extends SWType,
  B extends Bundler,
  BO extends BundlerOptions,
>(
  buildStart: ReturnType<typeof performance.now>,
  bundler: B,
  options: BuildSWOptions<T, B>,
): BuildContext<T, B, BO> {
  return Object.assign(createBaseContext(buildStart, bundler), {
    options,
    bundlerOptions: undefined!,
  })
}
