import * as electron from 'electron'
import * as fs from 'fs'
import { fakeIpc } from '../../test/ipc'
import mockOf from '../../test/mockOf'
import { defined } from '../utils/assert'
import register, { channel, Client } from './saveAs'

jest.mock('electron', () => ({
  dialog: {
    showSaveDialog: jest.fn(),
  },
}))

jest.mock('fs')

test('open, write, close', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain)

  const client = new Client(ipcRenderer.invoke.bind(ipcRenderer))

  // prepare to prompt
  mockOf(electron.dialog.showSaveDialog).mockResolvedValueOnce({
    canceled: false,
    filePath: '/example/path.txt',
  })
  const mockWriteStream: Partial<fs.WriteStream> = {
    write: jest.fn().mockImplementation((_data, cb) => cb()),
    end: jest.fn().mockImplementation(cb => cb()),
  }
  mockOf(fs.createWriteStream).mockReturnValueOnce(
    mockWriteStream as fs.WriteStream,
  )

  // do the prompt
  const promptResult = await client.promptToSave()

  // did it?
  expect(ipcRenderer.invoke).toHaveBeenCalledWith(channel, {
    type: 'PromptToSave',
  })
  expect(electron.dialog.showSaveDialog).toHaveBeenCalled()
  expect(fs.createWriteStream).toHaveBeenCalledWith('/example/path.txt')

  defined(promptResult)
  const { fd } = promptResult

  // do some writes
  await client.write(fd, 'abc')
  expect(mockWriteStream.write).toHaveBeenNthCalledWith(
    1,
    'abc',
    expect.any(Function),
  )

  await client.write(fd, Buffer.of(1, 2, 3))
  expect(mockWriteStream.write).toHaveBeenNthCalledWith(
    2,
    Uint8Array.of(1, 2, 3),
    expect.any(Function),
  )

  // end it
  await client.end(fd)
  expect(mockWriteStream)
})
