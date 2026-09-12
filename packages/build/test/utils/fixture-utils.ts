import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

export async function createFixture(
  swCode: string,
  use: (paths: { root: string, dist: string }) => Promise<void>,
) {
  let root: string | undefined
  try {
    root = await fs.mkdtemp(
      path.resolve(process.cwd(), 'test', 'temp-fixtures', 'vite-pwa-'),
    )
    const src = path.resolve(root, 'src')
    const dist = path.resolve(root, 'dist')
    await fs.mkdir(src, { recursive: true })
    await Promise.all([
      fs.writeFile(path.resolve(src, 'index.js'), 'console.log("PWA test");\n'),
      fs.writeFile(path.resolve(src, 'sw.js'), swCode, 'utf-8'),
      fs.writeFile(path.resolve(root, 'package.json'), '{}'),
    ])
    await use({ root, dist })
  }
  finally {
    if (root) {
      await fs
        .rm(root, {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 100,
        })
        .catch(err =>
          console.error(`Failed to cleanup sandbox at ${root}:`, err),
        )
    }
  }
}
