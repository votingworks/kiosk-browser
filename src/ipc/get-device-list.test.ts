import register, { channel } from './get-device-list'
import { IpcMain } from 'electron'
import { onDeviceChange } from '../utils/usb'
import usbDetection from 'usb-detection'
import mockOf from '../../test/mockOf'
import fakeDevice from '../../test/fakeDevice'

test('registers a handler for `get-device-list` channel which gets devices', async () => {
  jest.spyOn(onDeviceChange, 'add')
  jest.spyOn(onDeviceChange, 'remove')
  mockOf(usbDetection.find).mockResolvedValue([
    fakeDevice({ deviceName: 'Device #1' }),
  ])

  // Register our handler.
  const handle = jest.fn()
  const cleanup = register(({ handle } as unknown) as IpcMain)

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function))
  expect(onDeviceChange.add).toHaveBeenCalledTimes(1)
  expect(onDeviceChange.remove).not.toHaveBeenCalled()

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0]
  expect(await handler()).toEqual([
    expect.objectContaining({ deviceName: 'Device #1' }),
  ])

  // Ensure cleanup removes device listener.
  cleanup()
  expect(onDeviceChange.remove).toHaveBeenCalledTimes(1)
})
