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
  private listenersByCallback = new Map<C, Listener<A, C>>()

  /**
   * Registers a callback to be called when the event is triggered. The callback
   * can be removed by calling `remove` with the same object, or by calling
   * `remove` on the returned `Listener` object.
   */
  public add(callback: C): Listener<A, C> {
    const listening = new Listener(this, callback)
    this.listenersByCallback.set(callback, listening)
    this.listenerAdded(this.listenersByCallback.size)
    return listening
  }

  /**
   * Removes a previously-registered callback.
   */
  public remove(callback: C): void {
    this.listenersByCallback.delete(callback)
    this.listenerRemoved(this.listenersByCallback.size)
  }

  /**
   * Triggers the registered callbacks in the order they were registered.
   */
  public trigger(...args: A): void {
    for (const callback of this.listenersByCallback.keys()) {
      try {
        callback(...args)
      } catch (error) {
        console.error('event callback failed with error:', error)
      }
    }
  }

  protected listenerAdded(count: number): void {
    // override in subclasses
  }

  protected listenerRemoved(count: number): void {
    // override in subclasses
  }
}
