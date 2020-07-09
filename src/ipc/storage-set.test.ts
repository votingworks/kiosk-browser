import storage from 'electron-json-storage'
import { promisify } from 'util'
import { fakeIpc } from '../../test/ipc'
import register, { channel as storageSetChannel } from './storage-set'

const get = promisify(storage.get)

test('storage-set works', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain)

  await ipcRenderer.invoke(storageSetChannel, 'foo', { corona: 'virus' })

  expect(await get('foo')).toEqual({ corona: 'virus' })

  expect(storage.set).toHaveBeenCalledWith(
    'foo',
    { corona: 'virus' },
    expect.any(Function),
  )
})
