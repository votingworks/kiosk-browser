import register, { channel } from './get-device-list'
import { IpcMain } from 'electron'
import { usbResource } from '../utils/usb'
import usbDetection, { Device } from 'usb-detection'
import mockOf from '../../test/mockOf'
import fakeDevice from '../../test/fakeDevice'

test('registers a handler for `get-device-list` channel which calls `getDeviceList`', () => {
  expect.assertions(4)

  mockOf(usbDetection.find).mockResolvedValueOnce([
    fakeDevice({ deviceName: 'Acme Fake Device' }),
  ])

  const handle = jest.fn((ch: string, fn: () => Promise<Device[]>) => {
    expect(fn()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ deviceName: 'Acme Fake Device' }),
      ]),
    )
  })

  // Set up USB monitoring.
  const cleanup = register(({ handle } as unknown) as IpcMain)

  expect(usbResource.isRetained()).toBe(true)
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function))

  // Ensure retain is released.
  cleanup()
  expect(usbResource.isRetained()).toBe(false)
})
