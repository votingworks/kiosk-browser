import mockOf from '../test/mockOf'

const find = jest.fn().mockResolvedValue([])
const startMonitoring = jest.fn()
const stopMonitoring = jest.fn()
const on = jest.fn()
const off = jest.fn()

beforeEach(() => {
  mockOf(find).mockClear()
  mockOf(startMonitoring).mockClear()
  mockOf(stopMonitoring).mockClear()
  mockOf(on).mockClear()
  mockOf(off).mockClear()
})

export default {
  find,
  startMonitoring,
  stopMonitoring,
  on,
  off,
}
