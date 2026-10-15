import { clientsClaim } from '@vite-pwa/workbox-swkit/core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from '@vite-pwa/workbox-swkit/precaching'
import { NavigationRoute, registerRoute } from '@vite-pwa/workbox-swkit/routing'
import { message } from 'virtual:message'
import { runC } from './c.ts'
// eslint-disable-next-line perfectionist/sort-imports
import { runA } from './a.ts'
import { circularDepMessage1, func1 } from './circular-dep-1.ts'
import { circularDepMessage2, func2 } from './circular-dep-2.ts'
import { hello, sayHello } from './sw-helper.ts'

console.log(message)
console.log(hello)
console.log(sayHello('from SW'))
console.log(circularDepMessage1, typeof func1)
console.log(circularDepMessage2, typeof func2)

runA()
runC()

declare let self: ServiceWorkerGlobalScope

console.log(`import.meta.env.BASE_URL: ${import.meta.env.BASE_URL}`)
console.log(`import.meta.env.MODE: ${import.meta.env.MODE}`)
console.log(`import.meta.env.DEV: ${import.meta.env.DEV}`)
console.log(`import.meta.env.PROD: ${import.meta.env.PROD}`)
console.log(`import.meta.env.SSR: ${import.meta.env.SSR}`)
console.log(`import.meta.env.ENABLE_SWKIT_LOGS: ${import.meta.env.ENABLE_SWKIT_LOGS}`)

if (import.meta.env.ENABLE_SWKIT_LOGS) {
  console.log('ENABLE_SWKIT_LOGS is enabled')
  self.__WB_DISABLE_DEV_LOGS = false
}

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST)

// clean old assets
cleanupOutdatedCaches()

let allowlist: undefined | RegExp[]
if (import.meta.env.DEV) {
  allowlist = [/^\/$/]
}

// to allow work offline
registerRoute(new NavigationRoute(
  createHandlerBoundToURL('index.html'),
  { allowlist },
))

self.skipWaiting()
clientsClaim()

declare global {
  interface WorkerGlobalScope {
    __WB_DISABLE_DEV_LOGS: boolean
  }
}
