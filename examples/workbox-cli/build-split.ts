import { generateManifestEntries } from '@vite-pwa/workbox-build/utils/generate-manifest-entries'
import MagicString from 'magic-string'
import { rolldown } from 'rolldown'

const workboxRegex = [/^@vite-pwa\/workbox-swkit\//, /[\\/]workbox-swkit[\\/]/, /[\\/]workbox[\\/]swkit/]

async function build() {
  const manifestResult = await generateManifestEntries({
    globIgnores: ['**/{sw,workbox-*,sw-*}.js', '**/*.map'],
    globPatterns: ['**/*.{js,html}'],
  }, './build')
  const instance = await rolldown({
    input: 'build/sw.js',
    platform: 'browser',
    treeshake: true,
    plugins: [{
      name: 'virtual-sw-plugin',
      resolveId(id) {
        return id === 'virtual:sw-chunk' ? '\0virtual:sw-chunk' : undefined
      },
      load(id) {
        if (id === '\0virtual:sw-chunk') {
          return `export const message2 = 'Virtual SW Chunk';
export function sayHello2(msg) {
  return \`Hello \${message2} from virtual chunk! You said: \${msg}\`
}          
`
        }
      },
    }, {
      name: 'import-scripts-tranformer',
      // writeBundle({ file, name }, bundle) {
      //   console.log({ file, name }, Object.keys(bundle))
      // },
      generateBundle(_, bundle, isWrite) {
        // eslint-disable-next-line no-console
        console.log('generateBundle', isWrite)
        // Buscamos el chunk de workbox para saber su nombre final con hash
        const workboxChunk = Object.values(bundle).find(
          c => c.type === 'chunk' && c.name === 'workbox',
        ) as any

        if (!workboxChunk)
          return

        const workboxFileName = workboxChunk.fileName

        for (const [_key, chunk] of Object.entries(bundle)) {
          if (chunk.type !== 'chunk')
            continue

          const s = new MagicString(chunk.code)

          // --- CASO 1: EL CORE DE WORKBOX (Limpieza de exports) ---
          /* if (chunk.name === 'workbox') {
            const s = new MagicString(chunk.code)

            // 1. Envolvemos todo el código en un IIFE para proteger el scope
            s.prepend('(function() {\n')

            const exportRegex = /export\s*\{([^}]+)\};?/g
            let match
            while ((match = exportRegex.exec(chunk.code)) !== null) {
              const [fullMatch, content] = match

              const members = content.split(',').map(e => e.trim().split(/\s+as\s+/)[0].trim()).join(', ')

              // 2. Publicamos solo lo necesario al global
              const replacement = `\nself.workbox = self.workbox || {};\nself.workbox.swkit = { ${members} };`

              s.overwrite(match.index, match.index + fullMatch.length, replacement)
            }

            s.append('\n})();') // Cerramos el IIFE
            chunk.code = s.toString()
          } */
          if (chunk.name === 'workbox') {
            const s = new MagicString(chunk.code)

            // 1. Envolvemos el contenido, pero OJO: buscamos el sourcemap para dejarlo fuera
            const mapRegex = /\/\/# sourceMappingURL=.*/
            const mapMatch = chunk.code.match(mapRegex)
            let codeWithoutMap = chunk.code

            if (mapMatch) {
              codeWithoutMap = chunk.code.replace(mapRegex, '')
              s.remove(mapMatch.index!, chunk.code.length)
            }

            s.prepend('(function() {\n')

            const exportRegex = /export\s*\{([^}]+)\};?/g
            let match
            // eslint-disable-next-line no-cond-assign
            while ((match = exportRegex.exec(codeWithoutMap)) !== null) {
              const [fullMatch, content] = match
              const members = content.split(',').map(e => e.trim().split(/\s+as\s+/)[0].trim()).join(', ')

              // Sustituimos el export por la asignación
              const replacement = `\nself.workbox = self.workbox || {};\nself.workbox.swkit = { ${members} };`
              s.overwrite(match.index, match.index + fullMatch.length, replacement)
            }

            s.append('\n})();')

            // 2. Si había mapa, lo volvemos a poner al final de todo, fuera del IIFE
            if (mapMatch) {
              s.append(`\n${mapMatch[0]}`)
            }

            chunk.code = s.toString()
          }

          // --- CASO 2: EL SERVICE WORKER (Limpieza de imports) ---
          if (chunk.name === 'sw') {
            s.prepend(`importScripts("./${workboxFileName}");\n`)

            const importRegex = new RegExp(
              `import\\s+\\{([^}]+)\\}\\s+from\\s+['"]\\.\\/${workboxFileName}['"]`,
              'g',
            )

            let match
            // eslint-disable-next-line no-cond-assign
            while ((match = importRegex.exec(chunk.code)) !== null) {
              const [fullMatch, imports] = match

              // Aquí lo mismo: el 'as' no existe en desestructuración de objetos de la misma forma
              // Pero en un 'import { a as b }', 'b' es el identificador local que Rolldown ha dejado.
              const cleanImports = imports.split(',').map((i) => {
                const parts = i.trim().split(/\s+as\s+/)
                return parts.length > 1 ? parts[1].trim() : parts[0].trim()
              }).join(', ')

              const replacement = `const { ${cleanImports} } = self.workbox.swkit;`
              s.overwrite(match.index, match.index + fullMatch.length, replacement)
            }
          }

          // Si el mapa de símbolos está activado en la config de Rolldown,
          // actualizamos el chunk con el nuevo código y el mapa resultante
          if (s.hasChanged()) {
            chunk.code = s.toString()
            if (chunk.map) {
              /* chunk.map = s.generateMap({
                source: chunk.fileName,
                includeContent: true,
                hires: true,
              }) */
              const newMap = s.generateMap({
                source: chunk.fileName,
                includeContent: true,
                hires: true,
              })

              // Sincronizamos los nombres de los archivos en el mapa
              /* newMap.file = 'sw-split.js'
              newMap.sources = ['sw-split.js'] */

              // @xts-expect-error there is no map a all??
              chunk.map = {
                file: newMap.file,
                mappings: newMap.mappings,
                names: newMap.names,
                sources: ['sw-split.js'],
                sourcesContent: newMap.sourcesContent ? newMap.sourcesContent : [],
                version: newMap.version,
                debugId: chunk.map.debugId,
                x_google_ignoreList: chunk.map.x_google_ignoreList,
                toUrl: newMap.toUrl,
                toString: newMap.toString,
              }
            }
          }
        }
      },
    }],
    transform: {
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'self.__WB_MANIFEST': JSON.stringify(manifestResult.manifestEntries),
      },
    },
  })

  const result = await instance.write({
    sourcemap: true,
    // sourcemap: 'inline',
    // sourcemap: 'hidden',
    comments: {
      legal: true,
      jsdoc: false,
      annotation: false,
    },
    dir: 'build',
    // file: 'build/sw-split.js',
    format: 'esm',
    cleanDir: false,
    chunkFileNames: (chunk) => {
      switch (chunk.name) {
        case 'workbox':
          return 'workbox-[hash].js'
        case 'sw':
          return 'sw-split.js'
        default:
          return '[name]-[hash].[ext]'
      }
    },
    assetFileNames: '[name]-[hash].[ext]',
    entryFileNames: (chunk) => {
      switch (chunk.name) {
        case 'workbox':
          return 'workbox-[hash].js'
        case 'sw':
          return 'sw-split.js'
        default:
          return '[name]-[hash].js'
      }
    },
    codeSplitting: {
      groups: [{
        minSize: 0,
        name: (moduleId) => {
          return workboxRegex.some(r => r.test(moduleId)) ? 'workbox' : undefined
        },
      }],
    },
  })

  // eslint-disable-next-line no-console
  console.log(result.output.map(c => [c.name, c.fileName] as const))
}

build()
