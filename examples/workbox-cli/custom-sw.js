importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js')
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

// clean old assets
workbox.precaching.cleanupOutdatedCaches()

// to allow work offline
workbox.routing.registerRoute(new workbox.routing.NavigationRoute(
    workbox.precaching.createHandlerBoundToURL('index.html'),
))

self.skipWaiting()
workbox.core.clientsClaim()
