import { describe, expect, it } from 'vitest'
import { prepareSWCode } from '../src/build/builder/prepare-sw-code'

describe('prepare-sw-code: runtimeCaching plugin shorthands', () => {
  it('should transform all Workbox configuration keys into plugin class instantiations and deduplicate imports', async () => {
    const swCode = await prepareSWCode({
      swDest: 'dummy.js',
      globPatterns: [],
      manifestTransforms: [async manifestEntries => ({ manifest: manifestEntries })],
      runtimeCaching: [
        {
          urlPattern: /\/api\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            cacheableResponse: { statuses: [0, 200], headers: { 'x-test': 'true' } },
            broadcastUpdate: { options: { headersToCheck: ['x-custom-header'] } },
            backgroundSync: { name: 'api-queue', options: { maxRetentionTime: 1440 } },
            precacheFallback: { fallbackURL: '/offline-api.json' },
            rangeRequests: true,

            // Base options that should be kept as raw configuration
            networkTimeoutSeconds: 10,
            fetchOptions: { mode: 'no-cors' },
            matchOptions: { ignoreSearch: true },

            // User injected custom plugins
            plugins: [
              { cacheWillUpdate: async () => null },
              { requestWillFetch: async ({ request }) => request },
            ],
          },
        },
        // Second handler to verify deduplication of imports
        {
          urlPattern: /\/images\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: { maxEntries: 100, maxAgeSeconds: 2592000 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    }).then(d => d.swCode.replace(/["']([a-z_$][\w$]*)["']:/gi, '$1:'))

    // --- 1. VERIFY UNIQUE IMPORTS ---
    const expirationImportMatches = swCode.match(/import \{ ExpirationPlugin \} from ['"]@vite-pwa\/workbox-swkit\/expiration['"]/g)
    expect(expirationImportMatches?.length).toBe(1)

    const cacheableResponseImportMatches = swCode.match(/import \{ CacheableResponsePlugin \} from ['"]@vite-pwa\/workbox-swkit\/cacheable-response['"]/g)
    expect(cacheableResponseImportMatches?.length).toBe(1)

    expect(swCode).toMatch(/import \{ BroadcastUpdatePlugin \} from ['"]@vite-pwa\/workbox-swkit\/broadcast-update['"]/)
    expect(swCode).toMatch(/import \{ BackgroundSyncPlugin \} from ['"]@vite-pwa\/workbox-swkit\/background-sync['"]/)
    expect(swCode).toMatch(/import \{ PrecacheFallbackPlugin \} from ['"]@vite-pwa\/workbox-swkit\/precaching['"]/)
    expect(swCode).toMatch(/import \{ RangeRequestsPlugin \} from ['"]@vite-pwa\/workbox-swkit\/range-requests['"]/)

    // --- 2. VERIFY CLASS INSTANTIATIONS IN THE AST (First Route) ---
    expect(swCode).toMatch(/new ExpirationPlugin\(\s*\{\s*maxEntries:\s*50,\s*maxAgeSeconds:\s*86400\s*\}\s*\)/)
    expect(swCode).toMatch(/new CacheableResponsePlugin\(\s*\{\s*statuses:\s*\[\s*0,\s*200\s*\],\s*headers:\s*\{\s*["']x-test["']:\s*["']true["']\s*\}\s*\}\s*\)/)
    expect(swCode).toMatch(/new BroadcastUpdatePlugin\(\s*\{\s*headersToCheck:\s*\[\s*["']x-custom-header["']\s*\]\s*\}\s*\)/)
    expect(swCode).toMatch(/new BackgroundSyncPlugin\(\s*["']api-queue["'],\s*\{\s*maxRetentionTime:\s*1440\s*\}\s*\)/)
    expect(swCode).toMatch(/new PrecacheFallbackPlugin\(\s*\{\s*fallbackURL:\s*["']\/offline-api\.json["']\s*\}\s*\)/)
    expect(swCode).toMatch(/new RangeRequestsPlugin\(\)/)

    // --- 3. VERIFY CLASS INSTANTIATIONS IN THE AST (Second Route) ---
    expect(swCode).toMatch(/new ExpirationPlugin\(\s*\{\s*maxEntries:\s*100,\s*maxAgeSeconds:\s*2592000\s*\}\s*\)/)
    expect(swCode).toMatch(/new CacheableResponsePlugin\(\s*\{\s*statuses:\s*\[\s*0,\s*200\s*\]\s*\}\s*\)/)

    // --- 4. VERIFY REMAINING BASE CONFIGURATION AND FORMATTING ---
    expect(swCode).toMatch(/cacheWillUpdate:\s*async/)
    expect(swCode).toMatch(/requestWillFetch:\s*async\s*\(\{\s*request\s*\}\)\s*=>\s*request/)
    expect(swCode).toMatch(/cacheName:\s*["']api-cache["']/)
    expect(swCode).toMatch(/networkTimeoutSeconds:\s*10/)
    expect(swCode).toMatch(/fetchOptions:\s*\{\s*mode:\s*["']no-cors["']\s*\}/)
    expect(swCode).toMatch(/matchOptions:\s*\{\s*ignoreSearch:\s*true\s*\}/)
    expect(swCode).toMatch(/cacheName:\s*["']image-cache["']/)

    // --- 5. VERIFY SYNTACTIC SUGAR KEYS WERE REMOVED ---
    expect(swCode).not.toMatch(/["']?expiration["']?:/)
    expect(swCode).not.toMatch(/["']?cacheableResponse["']?:/)
    expect(swCode).not.toMatch(/["']?broadcastUpdate["']?:/)
    expect(swCode).not.toMatch(/["']?backgroundSync["']?:/)
    expect(swCode).not.toMatch(/["']?precacheFallback["']?:/)
    expect(swCode).not.toMatch(/["']?rangeRequests["']?:/)
  })
})
