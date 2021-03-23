import mockOf from '../test/mockOf'
import fakeDevice from '../test/fakeDevice'
import { testEventEmitter } from '../test/events'

const find = jest.fn().mockResolvedValue([fakeDevice()])
const startMonitoring = jest.fn()
const stopMonitoring = jest.fn()
const eventEmitter = testEventEmitter()

beforeEach(() => {
  mockOf(find).mockClear()
  mockOf(startMonitoring).mockClear()
  mockOf(stopMonitoring).mockClear()
  eventEmitter.mockClear()
})

export default {
  find,
  startMonitoring,
  stopMonitoring,
  addListener: eventEmitter.addListener,
  emit: eventEmitter.emit,
  off: eventEmitter.off,
  on: eventEmitter.on,
  removeListener: eventEmitter.removeListener,
  removeAllListeners: eventEmitter.removeAllListeners,
}
