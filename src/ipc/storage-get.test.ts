import { fakeIpc } from '../../test/ipc'
import register, { channel as storageGetChannel } from './storage-get'

import storage from 'electron-json-storage'

type Callback = (error: string, result: object) => void

jest.mock('electron-json-storage', () => ({
  __esModule: true,
  default: {
    get: jest.fn((key: string, callback: Callback) =>
      callback('', { fizz: 'buzz' }),
    ),
  },
}))

test('storage-get works', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain)

  expect((await ipcRenderer.invoke(storageGetChannel, 'foo')).fizz).toBe('buzz')

  expect(storage.get).toHaveBeenCalledWith('foo', expect.any(Function))
})
