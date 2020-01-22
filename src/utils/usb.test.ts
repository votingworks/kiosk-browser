import { isMonitoring, assertMonitoring, clearAssertions } from './usb'
import usbDetection from 'usb-detection'
import mockOf from '../../test/mockOf'

jest.mock('usb-detection', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}))

beforeEach(() => {
  mockOf(usbDetection.find).mockReset()
  mockOf(usbDetection.startMonitoring).mockReset()
  mockOf(usbDetection.stopMonitoring).mockReset()
  mockOf(usbDetection.on).mockReset()
  mockOf(usbDetection.off).mockReset()

  clearAssertions()
})

test('monitoring is off by default', () => {
  expect(isMonitoring()).toBe(false)
})

test('monitoring is on once an assertion is made', () => {
  assertMonitoring()
  expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
  expect(isMonitoring()).toBe(true)
})

test('monitoring is off once an assertion is released', () => {
  const assertion = assertMonitoring()
  expect(isMonitoring()).toBe(true)
  assertion.release()
  expect(isMonitoring()).toBe(false)
  expect(usbDetection.stopMonitoring).toHaveBeenCalledTimes(1)
})

test('startMonitoring is only called once', () => {
  assertMonitoring()
  assertMonitoring()
  expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
})
