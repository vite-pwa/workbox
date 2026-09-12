import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

export async function createBundlerFixture(prefix: string, packageJson: string, use: (paths: { root: string, dist: string }) => Promise<void>) {
  let root: string | undefined
  try {
    root = await fs.mkdtemp(path.resolve(process.cwd(), 'test', 'temp-fixtures', `${prefix}-pwa-`))
    const src = path.resolve(root, 'src')
    const dist = path.resolve(root, 'dist')

    await fs.mkdir(src)

    const indexContent = 'document.body.textContent = "PWA compiler smoke"\n'
    const swContent = `import { clientsClaim } from "@vite-pwa/workbox-swkit/core"
    import { precacheAndRoute } from "@vite-pwa/workbox-swkit/precaching"

    globalThis.skipWaiting()
    clientsClaim()
    precacheAndRoute(globalThis.__WB_MANIFEST)
    `

    await Promise.all([
      fs.writeFile(path.resolve(src, 'index.js'), indexContent, 'utf-8'),
      fs.writeFile(path.resolve(src, 'sw.js'), swContent, 'utf-8'),
      fs.writeFile(path.resolve(root, 'package.json'), packageJson, 'utf-8'),
    ])

    await use({ root, dist })
  }
  finally {
    if (root) {
      await fs.rm(root, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      }).catch((err) => {
        console.error(`Failed to cleanup sandbox at ${root}:`, err)
      })
    }
  }
}
