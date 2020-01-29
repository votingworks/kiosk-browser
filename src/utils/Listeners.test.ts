import Listeners, { Listener } from './Listeners'

class TestListeners extends Listeners {}

test('can add a callback to be triggered', () => {
  const listeners = new TestListeners()
  const callback = jest.fn()

  listeners.add(callback)
  listeners.trigger()
  expect(callback).toHaveBeenCalledTimes(1)
})

test('can remove a callback directly', () => {
  const listeners = new TestListeners()
  const callback = jest.fn()

  listeners.add(callback)
  listeners.remove(callback)
  listeners.trigger()
  expect(callback).not.toHaveBeenCalled()
})

test('can remove a callback by removing the listener', () => {
  const listeners = new TestListeners()
  const callback = jest.fn()

  listeners.add(callback).remove()
  listeners.trigger()
  expect(callback).not.toHaveBeenCalled()
})

test('calls each callback in order', () => {
  const listeners = new TestListeners()
  const order = new Array<number>()

  for (let i = 0; i < 5; i += 1) {
    listeners.add(() => order.push(i))
  }

  listeners.trigger()
  expect(order).toEqual([0, 1, 2, 3, 4])
})

test('calls a hook on adding or removing a callback', () => {
  const calls = new Array<{ add: number } | { remove: number }>()

  class WithHooks extends TestListeners {
    public listenerAdded(callback: () => void, count: number): void {
      calls.push({ add: count })
    }

    public listenerRemoved(callback: () => void, count: number): void {
      calls.push({ remove: count })
    }
  }

  const listeners = new WithHooks()

  listeners.add(jest.fn()).remove()
  listeners.add(jest.fn())
  listeners.add(jest.fn())
  listeners.add(jest.fn())

  expect(calls).toEqual([
    { add: 1 },
    { remove: 0 },
    { add: 1 },
    { add: 2 },
    { add: 3 },
  ])
})

test('calling remove on an unregistered callback does nothing', () => {
  const listeners = new TestListeners()
  const callback = jest.fn()

  listeners.add(callback)
  listeners.remove(jest.fn())
  listeners.trigger()

  expect(callback).toHaveBeenCalledTimes(1)
})

test('calls all callbacks, even if an earlier one fails', () => {
  const listeners = new TestListeners()
  const callbacks = [
    jest.fn().mockImplementation(() => {
      throw new Error('booo')
    }),
    jest.fn(),
  ]

  listeners.add(callbacks[0])
  listeners.add(callbacks[1])

  // suppress the error that is logged
  jest.spyOn(console, 'error').mockImplementation()
  listeners.trigger()

  expect(callbacks[0]).toHaveBeenCalledTimes(1)
  expect(callbacks[1]).toHaveBeenCalledTimes(1)
})

test('pausing callback interaction', () => {
  const listeners = new TestListeners()
  const callback = jest.fn()

  listeners.pause()
  listeners.add(callback)
  listeners.trigger()

  expect(callback).not.toHaveBeenCalled()
  listeners.resume()
  expect(callback).toHaveBeenCalledTimes(1)
})
