export {}

declare global {
  interface SyncEvent extends ExtendableEvent {
    readonly lastChance: boolean
    readonly tag: string
  }

  interface ServiceWorkerRegistration {
    readonly sync: SyncManager
  }

  interface SyncManager {
    register: (tag: string) => Promise<void>
    getTags: () => Promise<string[]>
  }
  interface ServiceWorkerGlobalScopeEventMap {
    sync: SyncEvent
  }

  interface ServiceWorkerRegistration {
    readonly periodicSync: PeriodicSyncManager
  }
}
