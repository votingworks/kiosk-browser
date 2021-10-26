import { fakeIpc } from '../../test/ipc'
import register, { channel } from './log'

test('log', async () => {
  console.log = jest.fn()
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain)

  await ipcRenderer.invoke(channel, 'long story short I survived')
  expect(console.log).toHaveBeenCalledWith('long story short I survived')
})
