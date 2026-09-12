import type {
  CustomChunksInfo,
} from './bundler-types'
import MagicString from 'magic-string'

const asRegexp = /\s+as\s+/

/**
 * Replace `import {} from '<chunk-name>-<hash>.js'` with the corresponding `self.workbox.<chunk-name>`
 */
function replaceImportsWithGlobalVars(
  magicString: MagicString,
  code: string,
  importName: string,
  customChunksInfo: CustomChunksInfo,
) {
  let match: RegExpExecArray | null = null
  let varDeclaration: string

  const importRegex = new RegExp(
    `import\\s?\\{([^}]+)\\}\\s?from\\s?['"]\\.\\/${importName}['"]`,
    'g',
  )

  // eslint-disable-next-line no-cond-assign
  while ((match = importRegex.exec(code)) !== null) {
    const [fullMatch, imports] = match

    const cleanImports = imports.split(',')
      .map(part => part.trim().replace(asRegexp, ': '))
      .join(', ')

    let chunkName = customChunksInfo.importedFileChunks.get(importName)
    if (!chunkName) {
      throw new Error(`Import ${importName} not found.`)
    }
    chunkName = customChunksInfo.customChunkNames.get(chunkName)
    if (!chunkName) {
      throw new Error(`Import ${importName} not found.`)
    }
    varDeclaration = `self.workbox.${chunkName}`

    magicString.overwrite(
      match.index,
      match.index + fullMatch.length,
      `var { ${cleanImports} } = ${varDeclaration}`,
    )
  }
}

type ChunkNameType = 'sw' | string

export async function transformClassicChunk(
  name: ChunkNameType,
  code: string,
  customChunksInfo: CustomChunksInfo,
) {
  const magicString = new MagicString(code)
  if (name === 'sw') {
    const importsScripts = customChunksInfo.mappedChunkImports.get('sw')
    if (importsScripts) {
      magicString.prepend(`importScripts(${importsScripts.map(n => `"./${n}"`).join(',')});\n`)
      for (const importName of importsScripts) {
        replaceImportsWithGlobalVars(
          magicString,
          code,
          importName,
          customChunksInfo,
        )
      }
    }

    return magicString
  }

  // 1. wrap content, beware: search for sourcemap to keep it outside the iife wrapper
  const mapRegex = /\/\/# sourceMappingURL=.*/
  const mapMatch = code.match(mapRegex)
  let codeWithoutMap = code

  if (mapMatch) {
    codeWithoutMap = code.replace(mapRegex, '')
    magicString.remove(mapMatch.index!, code.length)
  }

  magicString.prepend('(function() {\n')

  // should have only 1 export => we're inlining everything on each chunk, doesn't matter if using barrel or custom chunks
  const exportRegex = /export\s*\{([^}]+)\};?/g
  let match: RegExpExecArray | null = null
  const useName = customChunksInfo.customChunkNames.get(name)
  if (!useName) {
    throw new Error(`${name} chunk not found.`)
  }
  let i = 0
  // eslint-disable-next-line no-cond-assign
  while ((match = exportRegex.exec(codeWithoutMap)) !== null) {
    if (i > 0) {
      throw new Error(`${name} chunk has more than 1 export, which is not supported in classic mode.`)
    }
    const [fullMatch, content] = match
    const members = content.split(',')
      .map((part) => {
        const tokens = part.trim().split(asRegexp)
        if (tokens.length === 2) {
          return `${tokens[1]}: ${tokens[0]}`
        }
        return part
      })
      .join(', ')

    // replace the export with the assigment
    const replacement = `\nself.workbox = self.workbox || {};\nself.workbox.${useName} = { ${members} };`
    magicString.overwrite(
      match.index,
      match.index + fullMatch.length,
      replacement,
    )
    i++
  }

  const imports = customChunksInfo.mappedChunkImports.get(name)
  if (imports) {
    for (const importName of imports) {
      replaceImportsWithGlobalVars(
        magicString,
        code,
        importName,
        customChunksInfo,
      )
    }
  }

  magicString.append('\n})();')

  // 2. there is a sourcemap, add it back outside the IIFE scope
  if (mapMatch) {
    magicString.append(`\n${mapMatch[0]}`)
  }

  return magicString
}
