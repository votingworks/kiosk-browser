import { onDeviceChange } from './usb'
import usbDetection from 'usb-detection'
import mockOf from '../../test/mockOf'
import fakeDevice from '../../test/fakeDevice'
import { ChangeType } from '../ipc/manage-device-subscription'

afterEach(() => {
  onDeviceChange.removeAll()
})

test('monitoring is off by default', () => {
  expect(onDeviceChange.isPaused()).toBe(true)
})

test('monitoring is on once there is a listener', async () => {
  onDeviceChange.add(jest.fn())
  await onDeviceChange.waitForMonitoring()
  expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
  expect(onDeviceChange.isPaused()).toBe(false)
})

test('monitoring is off once an assertion is released', async () => {
  const listener = onDeviceChange.add(jest.fn())
  await onDeviceChange.waitForMonitoring()
  expect(onDeviceChange.isPaused()).toBe(false)
  listener.remove()
  await onDeviceChange.waitForMonitoring()
  expect(onDeviceChange.isPaused()).toBe(true)
  expect(usbDetection.stopMonitoring).toHaveBeenCalledTimes(1)
})

test('startMonitoring is only called once', async () => {
  onDeviceChange.add(jest.fn())
  onDeviceChange.add(jest.fn())
  await onDeviceChange.waitForMonitoring()
  expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
})

test('fires initial add callbacks with every existing device', async () => {
  const callback = jest.fn()

  mockOf(usbDetection.find).mockResolvedValueOnce([
    fakeDevice({ deviceName: 'Device #1' }),
    fakeDevice({ deviceName: 'Device #2' }),
  ])
  onDeviceChange.add(callback)
  await onDeviceChange.waitForMonitoring()

  expect(callback).toHaveBeenNthCalledWith(
    1,
    ChangeType.Add,
    expect.objectContaining({ deviceName: 'Device #1' }),
  )
  expect(callback).toHaveBeenNthCalledWith(
    2,
    ChangeType.Add,
    expect.objectContaining({ deviceName: 'Device #2' }),
  )
})

test('does not fire initial add callbacks for removed devices', async () => {
  const callback = jest.fn()
  const devices = [
    fakeDevice({ deviceName: 'Device #1' }),
    fakeDevice({ deviceName: 'Device #2' }),
  ]

  mockOf(usbDetection.find).mockResolvedValueOnce(devices)

  // Ensure device monitoring is on.
  onDeviceChange.add(jest.fn())
  await onDeviceChange.waitForMonitoring()

  // Remove all devices.
  const [, onDeviceRemoved] = mockOf(usbDetection.on).mock.calls.find(
    call => call[0] === 'remove',
  )!
  for (const device of devices) {
    onDeviceRemoved(device)
  }

  onDeviceChange.add(callback)
  await onDeviceChange.waitForMonitoring()

  expect(callback).not.toHaveBeenCalled()
})
