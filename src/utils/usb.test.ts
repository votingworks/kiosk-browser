import usbDetection, { Device } from 'usb-detection'
import fakeDevice from '../../test/fakeDevice'
import mockOf from '../../test/mockOf'
import deferred from './deferred'
import { ImmutableSet } from './KeySet'
import single from './single'
import { USBDetectionManager } from './usb'

test('monitoring is on once there is a subscription', () => {
  const usbManager = new USBDetectionManager(usbDetection)
  usbManager.devices.subscribe()
  expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
})

test('monitoring is off once an assertion is released', () => {
  const usbManager = new USBDetectionManager(usbDetection)
  usbManager.devices.subscribe().unsubscribe()
  expect(usbDetection.stopMonitoring).toHaveBeenCalledTimes(1)
})

test('startMonitoring and stopMonitoring are only called once', () => {
  const usbManager = new USBDetectionManager(usbDetection)
  const devices = usbManager.devices

  for (const subscription of [
    devices.subscribe(),
    devices.subscribe(),
    usbManager.devices.subscribe(),
    usbManager.devices.subscribe(),
  ]) {
    subscription.unsubscribe()
  }

  expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
  expect(usbDetection.stopMonitoring).toHaveBeenCalledTimes(1)
})

test('yields initial devices', async () => {
  mockOf(usbDetection.find).mockResolvedValueOnce([
    fakeDevice({ deviceName: 'Device #1' }),
    fakeDevice({ deviceName: 'Device #2' }),
  ])

  const devices = new USBDetectionManager(usbDetection).devices
  const defer = deferred<ImmutableSet<Device>>()
  const subscriber = jest
    .fn<void, [ImmutableSet<Device>]>()
    .mockImplementation(defer.resolve)

  devices.subscribe(subscriber)
  await defer.promise

  const args = single(subscriber.mock.calls)
  const arg = single(args)

  expect(Array.from(arg)).toEqual([
    expect.objectContaining({ deviceName: 'Device #1' }),
    expect.objectContaining({ deviceName: 'Device #2' }),
  ])
})

test('does not include removed devices in initial yield', async () => {
  const devices = new USBDetectionManager(usbDetection).devices
  const initialDevices = [
    fakeDevice({ deviceName: 'Device #1' }),
    fakeDevice({ deviceName: 'Device #2' }),
  ]

  mockOf(usbDetection.find)
    .mockResolvedValueOnce(initialDevices)
    .mockResolvedValueOnce([])
    .mockRejectedValue(new Error('find was called too many times'))

  // Ensure device monitoring is on.
  const defer = deferred<ImmutableSet<Device>>()
  devices.subscribe(defer.resolve)
  await defer.promise

  // Remove all devices.
  const [, onDeviceRemoved] =
    mockOf(usbDetection.on).mock.calls.find(call => call[0] === 'remove') ?? []
  for (const device of initialDevices) {
    onDeviceRemoved?.(device)
  }

  const defer2 = deferred<ImmutableSet<Device>>()
  const subscriber = jest.fn<void, [ImmutableSet<Device>]>(defer2.resolve)

  devices.subscribe(subscriber)
  await defer2.promise

  const args = single(subscriber.mock.calls)
  const arg = single(args)

  expect(Array.from(arg)).toEqual([])
})
