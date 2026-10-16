/* eslint-disable no-restricted-globals,no-console */
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { clientsClaim } from '@vite-pwa/workbox-swkit/core'
import { cleanupOutdatedCaches, precacheAndRoute } from '@vite-pwa/workbox-swkit/precaching'

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

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
