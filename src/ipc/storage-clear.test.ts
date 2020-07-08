import { fakeIpc } from '../../test/ipc'
import register, { channel as storageClearChannel } from './storage-clear'

import storage from 'electron-json-storage'

type Callback = (error: string) => void

jest.mock('electron-json-storage', () => ({
  __esModule: true,
  default: {
    clear: jest.fn((callback: Callback) => callback('')),
  },
}))

test('store works', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain)

  await ipcRenderer.invoke(storageClearChannel)

  expect(storage.clear).toHaveBeenCalledWith(expect.any(Function))
})
