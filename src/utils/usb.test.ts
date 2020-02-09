import { buildDevicesObservable } from './usb'
import usbDetection, { Device } from 'usb-detection'
import mockOf from '../../test/mockOf'
import fakeDevice from '../../test/fakeDevice'
import deferred from './deferred'
import single from './single'
import { ImmutableSet } from './mergeChanges'

test('monitoring is on once there is a subscription', () => {
  buildDevicesObservable().subscribe()
  expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
})

test('monitoring is off once an assertion is released', () => {
  const subscription = buildDevicesObservable().subscribe()
  subscription.unsubscribe()
  expect(usbDetection.stopMonitoring).toHaveBeenCalledTimes(1)
})

test('startMonitoring is only called once', () => {
  const devices = buildDevicesObservable()
  devices.subscribe()
  devices.subscribe()
  expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
})

test('yields initial devices', async () => {
  mockOf(usbDetection.find).mockResolvedValueOnce([
    fakeDevice({ deviceName: 'Device #1' }),
    fakeDevice({ deviceName: 'Device #2' }),
  ])

  const devices = buildDevicesObservable()
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
  const devices = buildDevicesObservable()
  const initialDevices = [
    fakeDevice({ deviceName: 'Device #1' }),
    fakeDevice({ deviceName: 'Device #2' }),
  ]

  mockOf(usbDetection.find).mockResolvedValueOnce(initialDevices)

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

  const subscriber = jest.fn<void, [ImmutableSet<Device>]>()

  devices.subscribe(subscriber)

  const args = single(subscriber.mock.calls)
  const arg = single(args)

  expect(Array.from(arg)).toEqual([])
})
