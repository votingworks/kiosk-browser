import { fakeIpc } from '../../test/ipc'
import mockOf from '../../test/mockOf'
import exec from '../utils/exec'
import register, { channel } from './mount-usb-drive'

const execMock = mockOf(exec)

jest.mock('../utils/exec')

test('mount-usb-drive', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc()
  register(ipcMain)

  // Things should be registered as expected.
  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  })

  // Is the handler wired up right?
  await ipcRenderer.invoke(channel, { device: 'sdb1' })

  expect(execMock).toHaveBeenCalledWith('pmount', [
    '-w',
    '-u',
    '000',
    '/dev/sdb1',
    'usb-drive-sdb1',
  ])
})

test('mount-usb-drive with custom label', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc()
  register(ipcMain)

  // Things should be registered as expected.
  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  })

  // Is the handler wired up right?
  await ipcRenderer.invoke(channel, { device: 'sdb1', label: 'usb-drive' })

  expect(execMock).toHaveBeenCalledWith('pmount', [
    '-w',
    '-u',
    '000',
    '/dev/sdb1',
    'usb-drive',
  ])
})
