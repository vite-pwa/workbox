import path from 'node:path'
import process from 'node:process'

export const normalizePathRegexp = /\\/g
export const anyJsRegexp = /\.([mc])?[jt]sx?$/
export const jsRegexp = /\.js$/

export function normalizePath(path: string): string {
  return path.replace(normalizePathRegexp, '/')
}

export function extractSwDestNameFromSource(
  swSrc: string,
): string {
  return path.basename(swSrc.replace(anyJsRegexp, '.js'))
}

/**
 * This method resolves the names for the SW source and destination files, as well as the globIgnores to exclude the
 * relevant files from the precache manifest.
 * @param swDest The service worker destination.
 * @param swSrc The service worker source file path.
 * @param generateSW if using generateSW strategy (or buildSW)
 */
export function resolveSWNames(
  swDest: string,
  swSrc: string,
  generateSW: boolean,
) {
  // generateSW: we need a temp sw to generate the content from the options
  // - swSrc requires a new temp file, we need to "compile" it for three-shaking/dce
  // - swDest must be the <swName>-classic.js or <swName>-module.js extracted from swDest when required
  // buildSW:
  // - swSrc is in the codebase
  // - we need to provide classic and module extracted from swDest when required

  // path normalization
  const rootSWDest = path.resolve(process.cwd(), swDest)
  const swDestChunkName = path.basename(rootSWDest, '.js')
  const destDist = normalizePath(path.relative(process.cwd(), path.dirname(rootSWDest)))

  const prefix = destDist && destDist !== '.' ? `${destDist}/` : ''

  let newSWSrc: string
  let swChunkName: string
  let classicSWSrc: string
  let classicSWChunkName: string
  let classicSWDest: string
  let moduleSWSrc: string
  let moduleSWChunkName: string
  let moduleSWDest: string

  // swChunkName comes from the swSrc: it is the chunk name at generateBundle hook
  // dest files are the filename from options.swDest

  if (generateSW) {
    newSWSrc = swDest.replace(jsRegexp, '.js')
    // newSWSrc = swDest.replace(jsRegexp, '-temp.js')
    swChunkName = path.basename(newSWSrc, '.js')
    classicSWSrc = `${prefix}${swChunkName}-classic.js`
    classicSWChunkName = `${swChunkName}-classic`
    classicSWDest = `${prefix}${swDestChunkName}-classic.js`
    moduleSWSrc = `${prefix}${swChunkName}-module.js`
    moduleSWChunkName = `${swChunkName}-module`
    moduleSWDest = `${prefix}${swDestChunkName}-module.js`
  }
  else {
    newSWSrc = swSrc
    swChunkName = path.basename(swSrc.replace(anyJsRegexp, '.js'), '.js')
    classicSWSrc = swSrc
    classicSWChunkName = swChunkName
    classicSWDest = `${prefix}${swDestChunkName}-classic.js`
    moduleSWSrc = swSrc
    moduleSWChunkName = swChunkName
    moduleSWDest = `${prefix}${swDestChunkName}-module.js`
  }

  return {
    newSWSrc,
    swChunkName,
    swDest,
    classicSWSrc,
    classicSWChunkName,
    classicSWDest,
    moduleSWSrc,
    moduleSWChunkName,
    moduleSWDest,
    swDestPath: path.relative(destDist, rootSWDest),
    classicSWDestPath: path.relative(destDist, classicSWDest),
    moduleSWDestPath: path.relative(destDist, moduleSWDest),
    prefix,
  }
}
