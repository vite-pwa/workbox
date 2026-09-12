import type { InjectManifestOptions } from '../types'

export function prepareInjectManifestGlobIgnores(
  options: InjectManifestOptions,
  sourcemap: boolean,
) {
  options.globIgnores ??= []
  options.globIgnores.push(options.swDest)
  options.globIgnores.push('**/workbox-*.js')
  if (sourcemap) {
    options.globIgnores.push(`${options.swDest}.map`)
    options.globIgnores.push('**/workbox-*.js.map')
  }
}

export function deepMergeObject(magicast: any, object: any) {
  if (typeof object === 'object' && object !== null) {
    for (const key in object) {
      const magicastValue = magicast[key]
      const objectValue = object[key]

      // Check for identity to prevent infinite recursion
      if (magicastValue === objectValue) {
        continue
      }

      if (
        typeof magicastValue === 'object'
        && magicastValue !== null
        && typeof objectValue === 'object'
        && objectValue !== null
      ) {
        deepMergeObject(magicastValue, objectValue)
      }
      else {
        magicast[key] = objectValue
      }
    }
  }
}
