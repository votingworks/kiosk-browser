import register, { channel } from './get-device-list'
import { IpcMain } from 'electron'
import { assertMonitoring, getDeviceList } from '../utils/usb'
import mockOf from '../../test/mockOf'

jest.mock('../utils/usb', () => ({
  assertMonitoring: jest.fn(),
  getDeviceList: jest.fn(),
}))

test('registers a handler for `get-device-list` channel which calls `getDeviceList`', () => {
  const handle = jest.fn((ch: string, fn: () => void) => {
    fn()
  })

  // Set up USB monitoring assertion.
  const release = jest.fn()
  mockOf(assertMonitoring).mockReturnValueOnce({ release })

  const cleanup = register(({ handle } as unknown) as IpcMain)
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function))
  expect(assertMonitoring).toHaveBeenCalledTimes(1)
  expect(getDeviceList).toHaveBeenCalledTimes(1)
  expect(release).not.toHaveBeenCalled()

  // Ensure assertion is released.
  cleanup()
  expect(release).toHaveBeenCalledTimes(1)
})
