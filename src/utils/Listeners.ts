/**
 * Represents a registered listener.
 */
export class Listener<
  A extends unknown[] = [],
  C extends Function = (...args: A) => void
> {
  public constructor(private listeners: Listeners<A, C>, private callback: C) {}

  public remove(): void {
    this.listeners.remove(this.callback)
  }
}

/**
 * Represents registered listeners for an event.
 */
export default class Listeners<
  A extends unknown[] = [],
  C extends Function = (...args: A) => void
> {
  private pendingTriggers?: A[]
  private listenersByCallback = new Map<C, Listener<A, C>>()

  /**
   * Registers a callback to be called when the event is triggered. The callback
   * can be removed by calling `remove` with the same object, or by calling
   * `remove` on the returned `Listener` object.
   */
  public add(callback: C): Listener<A, C> {
    const listener = new Listener(this, callback)
    this.listenersByCallback.set(callback, listener)
    this.listenerAdded(callback, this.listenersByCallback.size)
    return listener
  }

  /**
   * Removes a previously-registered callback.
   */
  public remove(callback: C): void {
    const listener = this.listenersByCallback.get(callback)

    if (listener) {
      this.listenersByCallback.delete(callback)
      this.listenerRemoved(callback, this.listenersByCallback.size)
    }
  }

  /**
   * Removes all previously-registered callbacks.
   */
  public removeAll(): void {
    for (const callback of this.listenersByCallback.keys()) {
      this.remove(callback)
    }
  }

  /**
   * Checks whether triggers are queued.
   */
  public isPaused(): boolean {
    return typeof this.pendingTriggers !== 'undefined'
  }

  /**
   * Queues trigger requests rather than disptching immediately.
   */
  public pause(): void {
    this.pendingTriggers = []
  }

  /**
   * Resumes immediate trigger dispatching and flushes queued triggers.
   */
  public resume(): void {
    const { pendingTriggers = [] } = this
    this.pendingTriggers = undefined

    for (const args of pendingTriggers) {
      this.trigger(...args)
    }
  }

  /**
   * Triggers the registered callbacks in the order they were registered.
   */
  public trigger(...args: A): void {
    if (this.pendingTriggers) {
      this.pendingTriggers.push(args)
    } else {
      for (const callback of this.listenersByCallback.keys()) {
        try {
          callback(...args)
        } catch (error) {
          console.error('event callback failed with error:', error)
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected listenerAdded(callback: C, count: number): void {
    // override in subclasses
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected listenerRemoved(callback: C, count: number): void {
    // override in subclasses
  }
}
