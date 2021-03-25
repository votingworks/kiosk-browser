import { EventEmitter } from 'events'

export type TestEventEmitter = jest.Mocked<
  Pick<
    EventEmitter,
    | 'addListener'
    | 'emit'
    | 'off'
    | 'on'
    | 'once'
    | 'removeAllListeners'
    | 'removeListener'
  >
> & {
  mockClear(): void
}

export function testEventEmitter(): TestEventEmitter {
  const eventEmitter = new EventEmitter()
  const addListener = jest.fn((event, listener) =>
    eventEmitter.addListener(event, listener),
  )
  const emit = jest.fn((event, ...args) => eventEmitter.emit(event, ...args))
  const once = jest.fn((event, listener) => eventEmitter.once(event, listener))
  const removeListener = jest.fn((event, listener) =>
    eventEmitter.removeListener(event, listener),
  )
  const removeAllListeners = jest.fn(() => eventEmitter.removeAllListeners())
  return {
    addListener,
    emit,
    off: removeListener,
    on: addListener,
    once,
    removeAllListeners,
    removeListener,
    mockClear(): void {
      eventEmitter.removeAllListeners()
      addListener.mockClear()
      emit.mockClear()
      once.mockClear()
      removeListener.mockClear()
      removeAllListeners.mockClear()
    },
  }
}
