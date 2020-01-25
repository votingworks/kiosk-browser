import { usbResource } from './usb'
import usbDetection from 'usb-detection'

test('monitoring is off by default', () => {
  expect(usbResource.isRetained()).toBe(false)
})

test('monitoring is on once the USB resource has been retained', () => {
  usbResource.retain()
  expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
  expect(usbResource.isRetained()).toBe(true)
})

test('monitoring is off once a retain is released', () => {
  const retain = usbResource.retain()
  expect(usbResource.isRetained()).toBe(true)
  retain.release()
  expect(usbResource.isRetained()).toBe(false)
  expect(usbDetection.stopMonitoring).toHaveBeenCalledTimes(1)
})

test('startMonitoring is only called once', () => {
  usbResource.retain()
  usbResource.retain()
  expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
})
