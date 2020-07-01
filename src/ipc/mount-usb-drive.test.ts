import register, { channel } from './mount-usb-drive'
import { IpcMain, app } from 'electron'
import exec from '../utils/exec'
import mockOf from '../../test/mockOf'

const execMock = mockOf(exec)

jest.mock('../utils/exec')

test('mount-usb-drive', async () => {
  // Register our handler.
  const handle = jest.fn()
  register(({ handle } as unknown) as IpcMain)

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function))

  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  })

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0]
  await handler(channel, 'sdb1')

  expect(execMock).toHaveBeenCalledWith('pmount', [
    '-w',
    '-u',
    '000',
    '/dev/sdb1',
    'usb-drive-sdb1',
  ])
})
