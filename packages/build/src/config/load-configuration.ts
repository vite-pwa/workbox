import type { SWType } from '../types'
import type { Strategy, WorkboxBuildConfiguration } from './types'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { deepMergeObject } from '../utils/utils'

type ExternalModule<
  S extends Strategy,
  T extends SWType = 'classic',
>
  = | Partial<WorkboxBuildConfiguration<S, T>>
    | (() => Partial<WorkboxBuildConfiguration<S, T>>)
    | (() => Promise<Partial<WorkboxBuildConfiguration<S, T>>>)

export async function loadConfiguration<
  S extends Strategy,
  T extends SWType = 'classic',
>(
  options: Partial<WorkboxBuildConfiguration<S, T>>,
): Promise<Partial<WorkboxBuildConfiguration<S, T>>> {
  if (!options.path) {
    return options
  }

  const cwd = path.resolve(process.cwd(), options.cwd || '.')
  const configPath = path.isAbsolute(options.path)
    ? options.path
    : path.resolve(cwd, options.path)
  const configModule: ExternalModule<Strategy, T> = await import(
    pathToFileURL(configPath).href,
  ).then((m: any) => m.default ?? m.options ?? m.config ?? m)

  const config = typeof configModule === 'function'
    ? await configModule()
    : configModule

  const external = config as Partial<WorkboxBuildConfiguration<S, T>>
  if (options.mergeOptions) {
    deepMergeObject(external, options)
  }

  return external
}
