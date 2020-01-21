import register, { channel } from './get-device-list'
import { IpcMain } from 'electron'
import usbDetection from 'usb-detection'

jest.mock('usb-detection', () => ({
  find: jest.fn(),
}))

test('registers a handler for `get-device-list` channel which calls into `usb-detection` to find devices', () => {
  const handle = jest.fn((ch: string, fn: () => void) => {
    fn()
    expect(usbDetection.find).toHaveBeenCalledTimes(1)
  })

  register(({ handle } as unknown) as IpcMain)
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function))
  handle
})
