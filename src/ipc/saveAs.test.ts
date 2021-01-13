import * as electron from 'electron'
import * as fs from 'fs'
import { fakeIpc } from '../../test/ipc'
import mockOf from '../../test/mockOf'
import { ok } from '../utils/assert'
import register, { channel, Client } from './saveAs'

jest.mock('electron', () => ({
  dialog: {
    showSaveDialog: jest.fn(),
  },
}))

jest.mock('fs')

test('open, write, close', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain, {
    url: new URL('https://example.com/'),
    originFilePermissions: [{ origins: '**/*', paths: '**/*', access: 'rw' }],
  })

  const client = new Client(ipcRenderer)

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

  ok(promptResult.type === 'file')
  const { fd, name } = promptResult
  expect(name).toBe('path.txt')

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

test('accepts options for the save dialog', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain, {
    url: new URL('https://example.com/'),
    originFilePermissions: [{ origins: '**/*', paths: '**/*', access: 'rw' }],
  })

  const client = new Client(ipcRenderer)

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
  const promptResult = await client.promptToSave({
    buttonLabel: 'SAVE IT',
    title: 'WHERE?!',
    filters: [{ name: 'ZIP Files', extensions: ['.zip'] }],
    defaultPath: '/media/usb-drive-sdb/file-path.zip',
  })

  // did it?
  expect(ipcRenderer.invoke).toHaveBeenCalledWith(channel, {
    type: 'PromptToSave',
    options: {
      buttonLabel: 'SAVE IT',
      title: 'WHERE?!',
      filters: [{ name: 'ZIP Files', extensions: ['.zip'] }],
      defaultPath: '/media/usb-drive-sdb/file-path.zip',
    },
  })
  expect(electron.dialog.showSaveDialog).toHaveBeenCalledWith({
    buttonLabel: 'SAVE IT',
    title: 'WHERE?!',
    filters: [{ name: 'ZIP Files', extensions: ['.zip'] }],
    defaultPath: '/media/usb-drive-sdb/file-path.zip',
  })
  expect(fs.createWriteStream).toHaveBeenCalledWith('/example/path.txt')

  ok(promptResult.type === 'file')
  const { fd, name } = promptResult
  expect(name).toBe('path.txt')

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

test('disallows hosts that are not explicitly listed', async () => {
  const url = new URL('http://evil.com/')
  const { ipcMain, ipcRenderer } = fakeIpc({
    getURL() {
      return url.toString()
    },
  })

  register(ipcMain, {
    url,
    originFilePermissions: [],
  })

  const client = new Client(ipcRenderer)

  expect(electron.dialog.showSaveDialog).not.toBeCalled()
  await expect(client.promptToSave()).rejects.toThrowError(
    `evil.com is not allowed to write to disk`,
  )
})

test('disallows file destinations that are not explicitly listed', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain, {
    url: new URL('https://example.com/'),
    originFilePermissions: [
      { origins: 'https://example.com', paths: '/media/**/*', access: 'rw' },
    ],
  })

  const client = new Client(ipcRenderer)

  mockOf(electron.dialog.showSaveDialog).mockResolvedValueOnce({
    canceled: false,
    filePath: '/etc/passwd',
  })
  await expect(client.promptToSave()).rejects.toThrowError()

  mockOf(electron.dialog.showSaveDialog).mockResolvedValueOnce({
    canceled: false,
    filePath: '/media/allowed/path.txt',
  })
  expect(await client.promptToSave()).toBeDefined()
})

test('does not allow cross-site file access', async () => {
  const { ipcMain, ipcRenderer, setWebContents } = fakeIpc()

  register(ipcMain, {
    url: new URL('https://example.com/'),
    originFilePermissions: [{ origins: '**/*', paths: '**/*', access: 'rw' }],
  })

  const client = new Client(ipcRenderer)

  setWebContents({
    getURL() {
      return 'https://example.com/'
    },
  })

  mockOf(electron.dialog.showSaveDialog).mockResolvedValueOnce({
    canceled: false,
    filePath: '/tmp/test.log',
  })
  const mockWriteStream: Partial<fs.WriteStream> = {
    write: jest.fn().mockImplementation((_data, cb) => cb()),
    end: jest.fn().mockImplementation(cb => cb()),
  }
  mockOf(fs.createWriteStream).mockReturnValueOnce(
    mockWriteStream as fs.WriteStream,
  )

  const promptResult = await client.promptToSave()
  ok(promptResult.type === 'file')

  // the domain that created it should be able to write to it
  await client.write(promptResult.fd, 'example things')
  expect(mockWriteStream.write).toHaveBeenNthCalledWith(
    1,
    'example things',
    expect.any(Function),
  )

  setWebContents({
    getURL() {
      return 'http://evil.com/'
    },
  })

  // but the bad guys should not
  await expect(
    client.write(promptResult.fd, 'evil things'),
  ).rejects.toThrowError(
    `ENOENT: no such file with descriptor '${promptResult.fd}'`,
  )
  expect(mockWriteStream.write).not.toHaveBeenCalledWith(
    'evil things',
    expect.any(Function),
  )
})
