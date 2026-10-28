/*
  Copyright 2019 Google LLC, Vite PWA's Team

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { WorkboxEventTarget } from './WorkboxEventTarget'

/**
 * A minimal `Event` subclass shim.
 * This doesn't *actually* subclass `Event` because not all browsers support
 * constructable `EventTarget`, and using a real `Event` will error.
 * @private
 */
export class WorkboxEvent<K extends keyof WorkboxEventMap> {
  /** The Workbox instance that dispatched this event. */
  target?: WorkboxEventTarget
  /** The service worker associated with this event. */
  sw?: ServiceWorker
  /** The browser event that triggered this event, when available. */
  originalEvent?: Event
  /** Whether this event is associated with an external service worker. */
  isExternal?: boolean

  /**
   * Creates an event with the supplied type and properties.
   *
   * @param type The event type.
   * @param props The properties to assign to the event.
   */
  constructor(
    public type: K,
    props: Omit<WorkboxEventMap[K], 'target' | 'type'>,
  ) {
    Object.assign(this, props)
  }
}

/**
 * An event dispatched when a message is received from a service worker.
 */
export interface WorkboxMessageEvent extends WorkboxEvent<'message'> {
  /** The data sent by the service worker. */
  data: any
  /** The original message event received from the service worker. */
  originalEvent: Event
  /** The message ports transferred with the original message event. */
  ports: readonly MessagePort[]
}

/**
 * An event describing a change in a service worker's lifecycle.
 */
export interface WorkboxLifecycleEvent
  extends WorkboxEvent<keyof WorkboxLifecycleEventMap> {
  /** Whether a service worker was already controlling when register() was called. */
  isUpdate?: boolean
}

/**
 * A lifecycle event for a service worker waiting to activate.
 */
export interface WorkboxLifecycleWaitingEvent extends WorkboxLifecycleEvent {
  /** Whether the service worker was already waiting when register() was called. */
  wasWaitingBeforeRegister?: boolean
}

/**
 * Maps service worker lifecycle event names to their event types.
 */
export interface WorkboxLifecycleEventMap {

  /**
   * The `installing` event is dispatched if the service-worker
   * find the new version and start installing.
   *
   * @event workbox-window.Workbox#installing
   * @type {WorkboxEvent}
   * @property {ServiceWorker} sw The installing service worker instance.
   * @property {Event} originalEvent The original [`statechange`]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/onstatechange}
   *     event.
   * @property {string} type `installing`.
   * @property {Workbox} target The `Workbox` instance.
   */
  installing: WorkboxLifecycleEvent
  /**
   * The `installed` event is dispatched if the state of a
   * {@link workbox-window.Workbox} instance's
   * {@link https://developers.google.com/web/tools/workbox/modules/workbox-precaching#def-registered-sw|registered service worker}
   * changes to `installed`.
   *
   * Then can happen either the very first time a service worker is installed,
   * or after an update to the current service worker is found. In the case
   * of an update being found, the event's `isUpdate` property will be `true`.
   *
   * @event workbox-window.Workbox#installed
   * @type {WorkboxEvent}
   * @property {ServiceWorker} sw The service worker instance.
   * @property {Event} originalEvent The original [`statechange`]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/onstatechange}
   *     event.
   * @property {boolean|undefined} isUpdate True if a service worker was already
   *     controlling when this `Workbox` instance called `register()`.
   * @property {boolean|undefined} isExternal True if this event is associated
   *     with an [external service worker]{@link https://developers.google.com/web/tools/workbox/modules/workbox-window#when_an_unexpected_version_of_the_service_worker_is_found}.
   * @property {string} type `installed`.
   * @property {Workbox} target The `Workbox` instance.
   */
  installed: WorkboxLifecycleEvent
  /**
   * The `waiting` event is dispatched if the state of a
   * {@link workbox-window.Workbox} instance's
   * [registered service worker]{@link https://developers.google.com/web/tools/workbox/modules/workbox-precaching#def-registered-sw}
   * changes to `installed` and then doesn't immediately change to `activating`.
   * It may also be dispatched if a service worker with the same
   * [`scriptURL`]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/scriptURL}
   * was already waiting when the {@link workbox-window.Workbox#register}
   * method was called.
   *
   * @event workbox-window.Workbox#waiting
   * @type {WorkboxEvent}
   * @property {ServiceWorker} sw The service worker instance.
   * @property {Event|undefined} originalEvent The original
   *    [`statechange`]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/onstatechange}
   *     event, or `undefined` in the case where the service worker was waiting
   *     to before `.register()` was called.
   * @property {boolean|undefined} isUpdate True if a service worker was already
   *     controlling when this `Workbox` instance called `register()`.
   * @property {boolean|undefined} isExternal True if this event is associated
   *     with an [external service worker]{@link https://developers.google.com/web/tools/workbox/modules/workbox-window#when_an_unexpected_version_of_the_service_worker_is_found}.
   * @property {boolean|undefined} wasWaitingBeforeRegister True if a service worker with
   *     a matching `scriptURL` was already waiting when this `Workbox`
   *     instance called `register()`.
   * @property {string} type `waiting`.
   * @property {Workbox} target The `Workbox` instance.
   */
  waiting: WorkboxLifecycleWaitingEvent
  /**
   * The `activating` event is dispatched when the registered service worker's
   * state changes to `activating`.
   *
   * @event workbox-window.Workbox#activating
   * @type {WorkboxEvent}
   */
  activating: WorkboxLifecycleEvent
  /**
   * The `activated` event is dispatched if the state of a
   * {@link workbox-window.Workbox} instance's
   * {@link https://developers.google.com/web/tools/workbox/modules/workbox-precaching#def-registered-sw|registered service worker}
   * changes to `activated`.
   *
   * @event workbox-window.Workbox#activated
   * @type {WorkboxEvent}
   * @property {ServiceWorker} sw The service worker instance.
   * @property {Event} originalEvent The original [`statechange`]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/onstatechange}
   *     event.
   * @property {boolean|undefined} isUpdate True if a service worker was already
   *     controlling when this `Workbox` instance called `register()`.
   * @property {boolean|undefined} isExternal True if this event is associated
   *     with an [external service worker]{@link https://developers.google.com/web/tools/workbox/modules/workbox-window#when_an_unexpected_version_of_the_service_worker_is_found}.
   * @property {string} type `activated`.
   * @property {Workbox} target The `Workbox` instance.
   */
  activated: WorkboxLifecycleEvent
  /**
   * The `controlling` event is dispatched if a
   * [`controllerchange`]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/oncontrollerchange}
   * fires on the service worker [container]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer}
   * and the [`scriptURL`]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/scriptURL}
   * of the new [controller]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controller}
   * matches the `scriptURL` of the `Workbox` instance's
   * [registered service worker]{@link https://developers.google.com/web/tools/workbox/modules/workbox-precaching#def-registered-sw}.
   *
   * @event workbox-window.Workbox#controlling
   * @type {WorkboxEvent}
   * @property {ServiceWorker} sw The service worker instance.
   * @property {Event} originalEvent The original [`controllerchange`]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/oncontrollerchange}
   *     event.
   * @property {boolean|undefined} isUpdate True if a service worker was already
   *     controlling when this service worker was registered.
   * @property {boolean|undefined} isExternal True if this event is associated
   *     with an [external service worker]{@link https://developers.google.com/web/tools/workbox/modules/workbox-window#when_an_unexpected_version_of_the_service_worker_is_found}.
   * @property {string} type `controlling`.
   * @property {Workbox} target The `Workbox` instance.
   */
  controlling: WorkboxLifecycleEvent
  /**
   * The `redundant` event is dispatched if the state of a
   * {@link workbox-window.Workbox} instance's
   * [registered service worker]{@link https://developers.google.com/web/tools/workbox/modules/workbox-precaching#def-registered-sw}
   * changes to `redundant`.
   *
   * @event workbox-window.Workbox#redundant
   * @type {WorkboxEvent}
   * @property {ServiceWorker} sw The service worker instance.
   * @property {Event} originalEvent The original [`statechange`]{@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/onstatechange}
   *     event.
   * @property {boolean|undefined} isUpdate True if a service worker was already
   *     controlling when this `Workbox` instance called `register()`.
   * @property {string} type `redundant`.
   * @property {Workbox} target The `Workbox` instance.
   */
  redundant: WorkboxLifecycleEvent
}

/**
 * Maps all Workbox lifecycle and message event names to their event types.
 */
export interface WorkboxEventMap extends WorkboxLifecycleEventMap {
  /**
   * The `message` event is dispatched any time a `postMessage` is received.
   *
   * @event workbox-window.Workbox#message
   * @type {WorkboxEvent}
   * @property {*} data The `data` property from the original `message` event.
   * @property {Event} originalEvent The original [`message`]{@link https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent}
   *     event.
   * @property {string} type `message`.
   * @property {MessagePort[]} ports The `ports` value from `originalEvent`.
   * @property {Workbox} target The `Workbox` instance.
   */
  message: WorkboxMessageEvent
}
