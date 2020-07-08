import { fakeIpc } from '../../test/ipc'
import register, { channel as storageRemoveChannel } from './storage-remove'

import storage from 'electron-json-storage'

type Callback = (error: string) => void

jest.mock('electron-json-storage', () => ({
  __esModule: true,
  default: {
    remove: jest.fn((key: string, callback: Callback) => callback('')),
  },
}))

test('storage-remove works', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain)

  await ipcRenderer.invoke(storageRemoveChannel, 'foo')

  expect(storage.remove).toHaveBeenCalledWith('foo', expect.any(Function))
})
