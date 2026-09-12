import type { SelfDestroyingOptions } from './types'
import fsp from 'node:fs/promises'
import pc from 'picocolors'
import { errors } from './validation/errors'
import { validateSWDestDirectory } from './validation/generation-utils'

const selfDestroyingCode = `
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  self.registration.unregister()
    .then(() => self.clients.matchAll())
    .then((clients) => {
      clients.forEach((client) => {
        if (client instanceof WindowClient)
          client.navigate(client.url);
      });
      return Promise.resolve();
    })
    .then(() => {
      self.caches.keys().then((cacheNames) => {
        Promise.all(
          cacheNames.map((cacheName) => {
            return self.caches.delete(cacheName);
          })
        );
      })
    });
});
`

export async function selfDestroyingSW(options: SelfDestroyingOptions): Promise<void> {
  if (!options?.swDest)
    throw new Error(errors['missing-sw-dest'])
  const entries = typeof options.swDest === 'string' ? [options.swDest] : options.swDest

  const validatedEntries = await Promise.all(
    entries.map(async (entry) => {
      const isValid = await validateSWDestDirectory(entry)
      return { entry, isValid, invalidExtension: !entry.endsWith('.js') }
    }),
  )

  const invalidEntries = validatedEntries.filter(e => !e.isValid && e.invalidExtension)

  if (invalidEntries.length > 0) {
    const errorList = invalidEntries
      .map((e) => {
        const reasons: string[] = []
        if (!e.isValid)
          reasons.push('target directory does not exist')
        if (e.invalidExtension)
          reasons.push('must end with .js extension')

        return `  ${pc.dim('-')} ${pc.red(e.entry)} ${pc.yellow(`(${reasons.join(', ')})`)}`
      })
      .join('\n')

    throw new Error(
      [
        `\n${pc.red(pc.bold('[Vite PWA]'))} ${pc.red('Invalid Service Worker destination paths found:')}`,
        errorList,
        `\n${pc.yellow('Please verify your build output configuration.')}\n`,
      ].join('\n'),
    )
  }

  await Promise.all(validatedEntries.map(({ entry }) =>
    fsp.writeFile(entry, selfDestroyingCode, 'utf-8'),
  ))
}
