import type { Bundler, ClassicBuild, CustomChunksInfo, RolldownOptions } from './bundler-types'
import pc from 'picocolors'
import { camelize, workboxRegex } from './utils'

export function prepareCodeSplittingGroups<B extends Bundler>(
  options: RolldownOptions<B>,
  rolldownOptions: import('rolldown').OutputOptions,
  classicBuild: ClassicBuild,
  workboxName?: string,
): CustomChunksInfo {
  const customChunksInfo: CustomChunksInfo = {
    customChunkNames: new Map<string, string>(),
    mappedChunkFiles: new Map<string, string>(),
    mappedChunkImports: new Map<string, string[]>(),
    importedFileChunks: new Map<string, string>(),
  }

  if (options.detectCircularDeps || workboxName) {
    const { customChunks, swChunkName, swType } = options
    const workboxName = classicBuild.workboxName
    const addChunksSuffixes = classicBuild.addChunksSuffixes
    rolldownOptions.codeSplitting = {
      groups: [{
        name: (moduleId, ctx) => {
          if (!workboxName && !customChunks) {
            return undefined
          }
          if (workboxName) {
            const chunk = workboxRegex.some(r => r.test(moduleId)) ? workboxName : undefined
            if (chunk) {
              // handle workbox as a custom chunk: !inlineWorkboxRuntime is just a shortcut
              customChunksInfo.customChunkNames.set(chunk, camelize(chunk))
              customChunksInfo.mappedChunkFiles.set(chunk, chunk)
              return chunk
            }
          }

          if (!customChunks) {
            return undefined
          }

          const customChunkName = customChunks(moduleId, ctx)
          if (!customChunkName) {
            return undefined
          }

          // Check customChunkName against swChunkName and workboxName to avoid conflicts.
          // If it matches any of them, we throw an error because the consumer can achieve
          // the exact same behavior by simply returning undefined or false from this callback,
          // which safely routes the module into the main Service Worker chunk (if imported there).
          // Or just lets Rolldown handle it if not being imported by the Service Worker.
          if (customChunkName === swChunkName || customChunkName === workboxName) {
            throw new Error([
              `\n${pc.red(pc.bold('[Vite PWA]'))} ${pc.red(`Custom chunk name "${pc.yellow(customChunkName)}" conflicts with the Service Worker or Workbox runtime chunk names!`)}\n`,
              `  - To include "${pc.yellow(customChunkName)}" inside the SW chunk, simply return undefined or false from the customChunks callback.`,
              `  - If the "${pc.yellow(customChunkName)}" module is not being imported by the SW chunk, let Rolldown handle its optimization.`,
            ].join('\n'))
          }

          if (addChunksSuffixes) {
            const mappedChunkName = `${customChunkName}-${swType}`
            customChunksInfo.customChunkNames.set(mappedChunkName, camelize(mappedChunkName))
            customChunksInfo.mappedChunkFiles.set(mappedChunkName, mappedChunkName)
            return mappedChunkName
          }
          else {
            customChunksInfo.customChunkNames.set(customChunkName, camelize(customChunkName))
            customChunksInfo.mappedChunkFiles.set(customChunkName, customChunkName)
            return customChunkName
          }
        },
      }],
    }
  }
  else {
    rolldownOptions.codeSplitting = {
      groups: [{
        name: (moduleId) => {
          return workboxRegex.some(r => r.test(moduleId)) ? workboxName : undefined
        },
      }],
    }
  }

  return customChunksInfo
}
