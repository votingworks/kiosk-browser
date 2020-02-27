import mockOf from '../test/mockOf'
import fakeDevice from '../test/fakeDevice'

const find = jest.fn().mockResolvedValue([fakeDevice()])
const startMonitoring = jest.fn()
const stopMonitoring = jest.fn()
const addListener = jest.fn()
const removeListener = jest.fn()

beforeEach(() => {
  mockOf(find).mockClear()
  mockOf(startMonitoring).mockClear()
  mockOf(stopMonitoring).mockClear()
  mockOf(addListener).mockClear()
  mockOf(removeListener).mockClear()
})

export default {
  find,
  startMonitoring,
  stopMonitoring,
  addListener,
  removeListener,
  on: addListener,
  off: removeListener,
}
