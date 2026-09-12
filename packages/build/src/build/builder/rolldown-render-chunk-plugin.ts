import { transformSync } from 'rolldown/utils'

const escapedDotRE = /(?<!\\)\\./g

function escapeRegex(str: string): string {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

/*
 * This plugin fixes this issue at OXC: https://github.com/oxc-project/oxc/issues/23224
 */
export function RolldownRenderChunkPlugin(
  define: Record<string, string>,
  sourcemap?: boolean | 'inline' | 'hidden',
): import('rolldown').Plugin<any> {
  const pattern = new RegExp(
    Object.keys(define)
    // replace `\.` (ignore `\\.`) with `\??\.` to match with `?.` as well
      .map(key => escapeRegex(key).replaceAll(escapedDotRE, '\\??\\.'))
      .join('|'),
  )
  return {
    name: 'vite-pwa:workbox-build:render-chunk-build-plugin',
    renderChunk(code, chunk) {
      pattern.lastIndex = 0
      if (!pattern.test(code))
        return

      const result = transformSync(chunk.fileName, code, {
        lang: 'js',
        sourceType: 'module',
        define,
        sourcemap: !!sourcemap,
        tsconfig: false,
      })

      if (result.errors.length > 0) {
        throw new AggregateError(result.errors, 'oxc transform error')
      }

      return {
        code: result.code,
        map: result.map || null,
      }
    },
  }
}
