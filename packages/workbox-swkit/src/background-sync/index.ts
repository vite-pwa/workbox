/*
  Copyright 2018 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { QueueOptions } from './Queue'
import { BackgroundSyncPlugin } from './BackgroundSyncPlugin'
import { Queue } from './Queue'
import { QueueStore } from './QueueStore'
import { StorableRequest } from './StorableRequest'

// See https://github.com/GoogleChrome/workbox/issues/2946
interface SyncManager {
  getTags: () => Promise<string[]>
  register: (tag: string) => Promise<void>
}

declare global {
  interface ServiceWorkerRegistration {
    readonly sync: SyncManager
  }

  interface SyncEvent extends ExtendableEvent {
    readonly lastChance: boolean
    readonly tag: string
  }

  interface ServiceWorkerGlobalScopeEventMap {
    sync: SyncEvent
  }
}

export { BackgroundSyncPlugin, Queue, QueueOptions, QueueStore, StorableRequest }
