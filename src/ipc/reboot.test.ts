import { fakeIpc } from '../../test/ipc'
import register, { channel } from './reboot'
import mockOf from '../../test/mockOf'
import exec from '../utils/exec'

const execMock = mockOf(exec)
jest.mock('../utils/exec')

beforeEach(() => {
  execMock.mockReset()
  execMock.mockResolvedValue({ stdout: '', stderr: '' })
})

test('reboot', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain)

  await ipcRenderer.invoke(channel)
  expect(execMock).toHaveBeenCalledTimes(1)
})
