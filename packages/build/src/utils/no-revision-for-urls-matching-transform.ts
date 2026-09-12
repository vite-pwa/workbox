import type { ManifestTransform } from '../types'
import { errors } from '../validation/errors'

export function noRevisionForURLsMatchingTransform(
  regexp: RegExp,
): ManifestTransform {
  if (!(regexp instanceof RegExp)) {
    throw new TypeError(errors['invalid-dont-cache-bust'])
  }

  return (originalManifest) => {
    const manifest = originalManifest.map((entry) => {
      if (typeof entry.url !== 'string') {
        throw new TypeError(errors['manifest-entry-bad-url'])
      }

      if (entry.url.match(regexp)) {
        entry.revision = null
      }

      return entry
    })

    return { manifest }
  }
}
