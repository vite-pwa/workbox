/* eslint-disable no-console,no-restricted-globals,prefer-regex-literals */
import {
  CacheFirst,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  NavigationRoute,
  NetworkFirst,
  precacheAndRoute,
  registerRoute,
  StaleWhileRevalidate,
} from '@vite-pwa/workbox-swkit'
import { message2, sayHello2 } from 'virtual:sw-chunk'
import { message, sayHello } from './sw-chunk'

console.log('Message from local sw-chunk', message)
console.log('sayHello', sayHello('userquin'))
console.log('Message from virtual:sw-chunk', message2)
console.log('sayHello2', sayHello2('userquin'))

self.skipWaiting()
precacheAndRoute(self.__WB_MANIFEST, {
  cleanURLs: true,
  urlManipulation: () => {
    return []
  },
})
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))
registerRoute(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*$/i, new CacheFirst({
  cacheName: 'google-fonts',
  expiration: {
    maxEntries: 4,
    maxAgeSeconds: 31536e3,
  },
}), 'GET')
registerRoute(new RegExp('\\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$', 'i'), new StaleWhileRevalidate({
  cacheName: 'static-font-assets',
  expiration: {
    maxEntries: 4,
    maxAgeSeconds: 604800,
  },
}), 'GET')
registerRoute(new RegExp('\\.(?:jpg|jpeg|gif|png|svg|ico|webp)$', 'i'), new StaleWhileRevalidate({
  cacheName: 'static-image-assets',
  expiration: {
    maxEntries: 64,
    maxAgeSeconds: 86400,
  },
}), 'GET')
registerRoute(new RegExp('\\.js$', 'i'), new StaleWhileRevalidate({
  cacheName: 'static-js-assets',
  expiration: {
    maxEntries: 32,
    maxAgeSeconds: 86400,
  },
}), 'GET')
registerRoute(new RegExp('\\.(?:css|less)$', 'i'), new StaleWhileRevalidate({
  cacheName: 'static-style-assets',
  expiration: {
    maxEntries: 32,
    maxAgeSeconds: 86400,
  },
}), 'GET')
registerRoute(new RegExp('\\.(?:json|xml|csv)$', 'i'), new NetworkFirst({
  cacheName: 'static-data-assets',
  expiration: {
    maxEntries: 32,
    maxAgeSeconds: 86400,
  },
}), 'GET')
registerRoute(new RegExp('\\/api\\/.*$', 'i'), new NetworkFirst({
  cacheName: 'apis',
  expiration: {
    maxEntries: 16,
    maxAgeSeconds: 86400,
  },
  networkTimeoutSeconds: 10,
}), 'GET')
registerRoute(new RegExp('.*', ''), new NetworkFirst({
  cacheName: 'others',
  expiration: {
    maxEntries: 32,
    maxAgeSeconds: 86400,
  },
  networkTimeoutSeconds: 10,
}), 'GET')
