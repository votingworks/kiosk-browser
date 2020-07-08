import { fakeIpc } from '../../test/ipc'
import register, { channel as storageSetChannel } from './storage-set'

import storage from 'electron-json-storage'

type Callback = (error: string) => void

jest.mock('electron-json-storage', () => ({
  __esModule: true,
  default: {
    set: jest.fn((key: string, value: string, callback: Callback) =>
      callback(''),
    ),
  },
}))

test('storage-set works', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain)

  await ipcRenderer.invoke(storageSetChannel, 'foo', { corona: 'virus' })

  expect(storage.set).toHaveBeenCalledWith(
    'foo',
    { corona: 'virus' },
    expect.any(Function),
  )
})
