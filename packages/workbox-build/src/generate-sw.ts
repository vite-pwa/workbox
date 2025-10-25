import type { ArrayExpression, Identifier, ObjectExpression, Program } from '@babel/types'
import type { ProxifiedModule, ProxifiedObject } from 'magicast'
import type { GenerateSWOptions } from './types'
import { builders, generateCode, parseModule } from 'magicast'
import { deepMergeObject, getDefaultExportOptions } from 'magicast/helpers'
import { AsyncGenerateSWOptionsSchema } from './validation/async-generate-sw'
import { validateAsync } from './validation/validation-helper'

// Helper para capitalizar: NetworkFirst -> NetworkFirst
function capitalize(s: string, sanitize = false) {
  const value = s.charAt(0).toUpperCase() + s.slice(1)
  return sanitize ? value.replace(/['"]/g, '') : value
}

export async function generateSW(
  options: ProxifiedModule<GenerateSWOptions>,
): Promise<void> {
  const proxifiedOptions = getDefaultExportOptions(options) as ProxifiedObject<GenerateSWOptions>
  /* const optionsWithDefaults = validate(
    GenerateSWOptionsSchema,
    proxifiedOptions,
    'generateSW',
  ) */
  const optionsWithDefaults = await validateAsync(
    AsyncGenerateSWOptionsSchema,
    proxifiedOptions,
    'generateSW',
  )
  // inject defaults added by valibot
  deepMergeObject(proxifiedOptions, optionsWithDefaults)
  console.log(generateCode(proxifiedOptions).code)
  // if (true) {
  //   return
  // }

  const swModule = parseModule('')

  const strategyImports = new Set<string>()
  if (proxifiedOptions.runtimeCaching) {
    for (const entry of proxifiedOptions.runtimeCaching) {
      if (typeof entry.handler === 'string') {
        strategyImports.add(capitalize(entry.handler))
      }
    }
  }

  if (proxifiedOptions.skipWaiting) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/core', imported: 'skipWaiting' })
  }
  if (proxifiedOptions.clientsClaim) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/core', imported: 'clientsClaim' })
  }
  if (proxifiedOptions.runtimeCaching?.length) {
    swModule.imports.$append({ from: '@vite-pwa/workbox-swkit/routing', imported: 'registerRoute' })
    if (strategyImports.size > 0) {
      for (const strategyImport of strategyImports) {
        swModule.imports.$append({
          from: '@vite-pwa/workbox-swkit/strategies',
          imported: strategyImport,
        })
      }
    }
  }

  // --- CONSTRUCCIÓN DEL CÓDIGO ---
  const swCode: string[] = []

  if (proxifiedOptions.skipWaiting) {
    swCode.push('skipWaiting();')
  }
  if (proxifiedOptions.clientsClaim) {
    swCode.push('clientsClaim();')
  }

  if (proxifiedOptions.runtimeCaching) {
    swCode.push(...getRuntimeCachingEntries(proxifiedOptions, strategyImports))
  }

  const importsCode = generateCode(swModule.imports).code
  const finalCode = `${importsCode}\n\n${swCode.join('\n')}`

  console.log('--- GENERATED SERVICE WORKER ---')
  console.log(finalCode)
}

function getRuntimeCachingEntries(
  proxifiedOptions: ProxifiedObject<GenerateSWOptions>,
  strategyImports: Set<string>,
): string[] {
  const entries: string[] = []
  if (!proxifiedOptions.runtimeCaching) {
    return entries
  }

  for (const entry of proxifiedOptions.runtimeCaching) {
    let handlerNode: any

    if (typeof entry.handler === 'string') {
      const strategyName = capitalize(entry.handler, true)
      strategyImports.add(capitalize(strategyName, true))
      // const callee = builders.identifier(strategyName)
      const args = entry.options?.$ast ? [entry.options] : undefined
      handlerNode = args && args.length > 0
        ? builders.newExpression(strategyName, ...args)
        : builders.newExpression(strategyName)
    }
    else {
      handlerNode = entry.handler
    }

    const routeCallNode = builders.functionCall(
      'registerRoute',
      entry.urlPattern,
      handlerNode,
    )

    entries.push(generateCode(routeCallNode).code)
  }

  return entries
}

function __getRuntimeCachingEntries(
  proxifiedOptions: ProxifiedObject<GenerateSWOptions>,
  strategyImports: Set<string>,
): string[] {
  const entries: string[] = []
  if (!proxifiedOptions.runtimeCaching) {
    return entries
  }

  // ¡Ahora podemos iterar directamente sobre el proxy!
  for (const entry of proxifiedOptions.runtimeCaching) {
    // 1. Generar el código para urlPattern de forma segura
    let patternCode: string
    if (typeof entry.urlPattern === 'string') {
      // Es un string, lo convertimos a un literal de string
      patternCode = JSON.stringify(entry.urlPattern)
    }
    else if (entry.urlPattern instanceof RegExp) {
      // Es un RegExp nativo, usamos .toString()
      patternCode = entry.urlPattern.toString()
    }
    else {
      // Es un Proxy de función, usamos generateCode
      patternCode = generateCode(entry.urlPattern).code
    }

    // 2. Generar el código para handler
    let handlerCode: string
    if (typeof entry.handler === 'string') {
      strategyImports.add(capitalize(entry.handler))
      const optionsCode = entry.options ? generateCode(entry.options).code : ''
      // Usamos generateCode en el string para obtener el literal correcto (e.g. 'CacheFirst')
      // y luego lo sanitizamos para quitar las comillas.
      handlerCode = `new ${capitalize(entry.handler, true)}(${optionsCode})`
    }
    else {
      handlerCode = generateCode(entry.handler).code
    }

    // 3. Sanitizar el código generado para las funciones (eliminar paréntesis/punto y coma extra)
    const sanitize = (code: string) => {
      if (code.startsWith('(') && code.endsWith(');')) {
        return code.slice(1, -2) // (function() {}); => function() {}
      }
      if (code.endsWith(';')) {
        return code.slice(0, -1) // () => {}; => () => {}
      }
      return code
    }

    const registerRoute = builders.functionCall('registerRoute', entry.urlPattern, entry.handler)
    console.log(generateCode(registerRoute).code)

    // 4. Construir la llamada final
    entries.push(`registerRoute(${sanitize(patternCode)}, ${sanitize(handlerCode)});`)
  }

  return entries
}

function _getRuntimeCachingEntries(
  proxifiedOptions: ProxifiedObject<GenerateSWOptions>,
  strategyImports: Set<string>,
): string[] {
  if (!proxifiedOptions.runtimeCaching)
    return []

  // Tu genialidad: aislar el array en un módulo temporal para obtener un AST "limpio".
  const runtimeCachingModule = parseModule(`const runtimeCaching = ${generateCode(proxifiedOptions.runtimeCaching).code};\nexport default runtimeCaching;`)
  const runtimeCachingDeclarationId = runtimeCachingModule.exports.default!.$name

  const entries: string[] = []

  for (const node of (runtimeCachingModule.$ast as Program).body) {
    if (node.type === 'VariableDeclaration') {
      for (const declaration of node.declarations) {
        if (
          declaration.id.type === 'Identifier'
          && declaration.id.name === runtimeCachingDeclarationId
          && declaration.init
        ) {
          const handlers = declaration.init as ArrayExpression
          for (const rCaching of handlers.elements) {
            if (!rCaching)
              continue

            const data = rCaching as ObjectExpression
            let patternCode: string | undefined
            let handlerCode: string | undefined

            for (const prop of data.properties) {
              if (prop.type === 'ObjectMethod') {
                const id = prop.key as Identifier
                // El replace para convertir `method() {}` en `function () {}`
                const code = generateCode(prop).code.replace(new RegExp(`^${id.name}`), 'function ')
                if (id.name === 'handler') {
                  handlerCode = code
                }
                else if (id.name === 'urlPattern') {
                  patternCode = code
                }
              }
              else if (prop.type === 'ObjectProperty') {
                const id = prop.key as Identifier
                const value = prop.value
                if (id.name === 'handler') {
                  if (value.type === 'StringLiteral') {
                    strategyImports.add(value.value)
                    // La sanitización correcta para `new Strategy()`
                    handlerCode = `new ${capitalize(generateCode(value).code, true)}()`
                  }
                  else {
                    // Para funciones y objetos, simplemente generamos el código
                    handlerCode = generateCode(value).code
                  }
                }
                else if (id.name === 'urlPattern') {
                  patternCode = generateCode(value).code
                }
              }
            }
            if (patternCode && handlerCode) {
              if (patternCode.startsWith('(') && patternCode.endsWith(');')) {
                patternCode = patternCode.slice(1, -2) // Elimina ( y );
              }
              else if (patternCode.endsWith(';')) {
                patternCode = patternCode.slice(0, -1) // Elimina ;
              }

              if (handlerCode.startsWith('(') && handlerCode.endsWith(');')) {
                handlerCode = handlerCode.slice(1, -2) // Elimina ( y );
              }
              else if (handlerCode.endsWith(';')) {
                handlerCode = handlerCode.slice(0, -1) // Elimina ;
              }

              entries.push(`registerRoute(${patternCode}, ${handlerCode});`)
            }
          }
        }
      }
    }
  }

  return entries
}

function getRuntimeCachingEntries2(
  proxifiedOptions: ProxifiedObject<GenerateSWOptions>,
  strategyImports: Set<string>,
): string[] {
  if (!proxifiedOptions.runtimeCaching)
    return []

  const runtimeCachingModule = parseModule(`const runtimeCaching = ${generateCode(proxifiedOptions.runtimeCaching).code};\nexport default runtimeCaching;`)
  const runtimeCachingDeclarationId = runtimeCachingModule.exports.default!.$name

  const entries: string[] = []

  for (const node of (runtimeCachingModule.$ast as Program).body) {
    if (node.type === 'VariableDeclaration') {
      for (const declaration of node.declarations) {
        if (
          declaration.id.type === 'Identifier'
          && declaration.id.name === runtimeCachingDeclarationId
          && declaration.init
        ) {
          const handlers = declaration.init as ArrayExpression
          for (const rCaching of handlers.elements) {
            if (!rCaching)
              continue

            const data = rCaching as ObjectExpression
            let patternCode: string | undefined
            let handlerCode: string | undefined

            for (const prop of data.properties) {
              if (prop.type === 'ObjectMethod') {
                const id = prop.key as Identifier
                if (id.name === 'handler') {
                  handlerCode = generateCode(prop).code.replace(new RegExp(`^${id.name}`), 'function ')
                }
                else if (id.name === 'urlPattern') {
                  patternCode = generateCode(prop).code.replace(new RegExp(`^${id.name}`), 'function ')
                }
              }
              else if (prop.type === 'ObjectProperty') {
                const id = prop.key as Identifier
                const value = prop.value
                if (id.name === 'handler') {
                  if (value.type === 'StringLiteral') {
                    strategyImports.add(value.value)
                    handlerCode = `new ${capitalize(value.value, true)}()`
                  }
                  else {
                    handlerCode = generateCode(value).code
                  }
                }
                else if (id.name === 'urlPattern') {
                  patternCode = generateCode(value).code
                }
              }
            }
            if (patternCode && handlerCode) {
              entries.push(`registerRoute(${patternCode}, ${handlerCode});`)
            }
          }
        }
      }
    }
  }

  return entries
}

function getRuntimeCachingEntriesOld(
  proxifiedOptions: ProxifiedObject<GenerateSWOptions>,
  strategyImports: Set<string>,
): string[] {
  const runtimeCaching = parseModule(`const runtimeCaching = ${generateCode(proxifiedOptions.runtimeCaching!).code};
export default runtimeCaching;
`)

  const runtimeCachingDeclarationId = runtimeCaching.exports.default.$name

  const entries: string[] = []

  for (const node of (runtimeCaching.$ast as Program).body) {
    if (node.type === 'VariableDeclaration') {
      for (const declaration of node.declarations) {
        if (
          declaration.id.type === 'Identifier'
          && declaration.id.name === runtimeCachingDeclarationId
          && declaration.init
        ) {
          /* const init
            = declaration.init.type === 'TSSatisfiesExpression'
              ? declaration.init.expression
              : declaration.init */

          const handlers = declaration.init as ArrayExpression

          for (const rCaching of handlers.elements) {
            if (!rCaching) {
              continue
            }
            const data = rCaching as ObjectExpression
            console.log(rCaching?.type)
            console.log(data.properties)
            let patternCode: string | undefined
            let handlerCode: string | undefined
            for (const prop of data.properties) {
              if (prop.type === 'ObjectMethod') {
                const id = prop.key as Identifier
                if (id.name === 'handler') {
                  handlerCode = generateCode(prop).code
                }
                else if (id.name === 'urlPattern') {
                  patternCode = generateCode(prop).code
                }
              }
              else if (prop.type === 'ObjectProperty') {
                const id = prop.key as Identifier
                const value = prop.value
                if (id.name === 'handler') {
                  // can be an arrow function or a handler we only check for strategy name here
                  // todo: handle options arggg
                  if (value.type !== 'StringLiteral') {
                    handlerCode = `new ${capitalize(generateCode(value).code, true)}()`
                  }
                  else {
                    handlerCode = generateCode(value).code
                  }
                }
                else if (id.name === 'urlPattern') {
                  patternCode = generateCode(value).code
                }
              }
            }
            if (patternCode && handlerCode) {
              entries.push(`registerRoute(${patternCode}, ${handlerCode});`)
            }
          }
        }
      }
    }
  }

  return entries
}

async function main() {
  const module = parseModule<GenerateSWOptions>(`export default {
  swDest: 'sw.js',
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: /^\\/api\\//,
      handler: 'NetworkFirst',
    },
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern({ request }) { return request.destination === 'image' },
      handler: 'NetworkFirst',
    },
    {
      urlPattern: '/images/',
      handler: 'CacheFirst',
    },
    {
      urlPattern() { return  false },
      handler: 'CacheFirst',
    },
    {
      urlPattern: function () { return  false },
      handler: 'CacheFirst',
    },
    {
      urlPattern: function () { return  false },
      handler() { return Response.error() },
    },
    {
      urlPattern: function () { return  false },
      handler: {
        handle: () => Response.error()
      }
    },
    {
      // method: 'PEPE',
      urlPattern: function () { return  false },
      handler: {
        handle() {
          return Response.error()  
        } 
      }
    }
  ],
}
`)
  await generateSW(module)
}

main()
