import type { BuildResult, GenerateSWOptions, SWType } from '../types'
import { detectGenerateSWDependencies } from './builder/detector'
import { checkGenerateSWDependencies } from './builder/log'

export async function generateSW<T extends SWType>(
  options: GenerateSWOptions<T>,
): Promise<BuildResult> {
  const detection = await detectGenerateSWDependencies()

  const message = checkGenerateSWDependencies(detection)
  if (message) {
    throw new Error(message)
  }

  return detection.vite
    ? await import('./vite/generate-sw').then(({ generateSW }) => generateSW(
        options,
      ))
    : await import('./rolldown/generate-sw').then(({ generateSW }) => generateSW(
        options,
      ))
}
