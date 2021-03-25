import { ipcRenderer } from 'electron'
import { promises as fs, WriteStream } from 'fs'
import { v4 as uuid } from 'uuid'
import { fakeIpc } from '../../test/ipc'
import { OriginFilePermission } from '../utils/access'
import OpenFiles from '../utils/OpenFiles'
import register, {
  channel as fileSystemWriteFileChannel,
  Client,
  end,
  open,
  write,
} from './file-system-write-file'

test('fails when write permission is not present', () => {
  const files = new OpenFiles()
  expect(() =>
    open(files, [], 'https://example.com', { type: 'Open', path: '/a/path' }),
  ).toThrowError(
    new Error('https://example.com is not allowed to write to /a/path'),
  )
})

test('fails when the file path is not absolute', () => {
  const files = new OpenFiles()
  expect(() =>
    open(files, [], 'https://example.com', {
      type: 'Open',
      path: 'some/relative/path',
    }),
  ).toThrowError(
    new Error('requested path is not absolute: some/relative/path'),
  )
})

test('fails when the file has no write permission', () => {
  const files = new OpenFiles()
  expect(() =>
    open(
      files,
      [
        { origins: 'https://example.com', paths: '/a/**/*', access: 'ro' },
        { origins: 'https://example.com', paths: '/b/**/*', access: 'wo' },
      ],
      'https://example.com',
      {
        type: 'Open',
        path: '/a/path',
      },
    ),
  ).toThrowError(
    new Error('https://example.com is not allowed to write to /a/path'),
  )
})

test('open file for writing', () => {
  const files = new OpenFiles()
  const fd = uuid()
  jest.spyOn(files, 'open').mockReturnValueOnce(fd)

  expect(
    open(
      files,
      [{ origins: 'https://example.com', paths: '/a/path/**/*', access: 'rw' }],
      'https://example.com',
      { type: 'Open', path: '/a/path/to/file.txt' },
    ),
  ).toEqual({ fd })

  expect(files.open).toHaveBeenCalledWith(
    'https://example.com',
    '/a/path/to/file.txt',
  )
})

test('open and write to a file', async () => {
  const files = new OpenFiles()
  const permissions: readonly OriginFilePermission[] = [
    { origins: 'https://example.com', paths: '/a/path/**/*', access: 'rw' },
  ]
  const fd = uuid()
  const writeMock = jest
    .fn()
    .mockImplementation((_data: unknown, callback: () => void) => callback())
  jest.spyOn(files, 'open').mockReturnValueOnce(fd)
  jest
    .spyOn(files, 'get')
    .mockReturnValue(({ write: writeMock } as unknown) as WriteStream)
  jest.spyOn(files, 'close').mockResolvedValueOnce(true)

  open(files, permissions, 'https://example.com', {
    type: 'Open',
    path: '/a/path/to/file.txt',
  })

  await write(files, permissions, 'https://example.com', {
    type: 'Write',
    fd,
    data: 'hello ',
  })
  await write(files, permissions, 'https://example.com', {
    type: 'Write',
    fd,
    data: Buffer.of(0x20),
  })
  await end(files, permissions, 'https://example.com', { type: 'End', fd })

  expect(writeMock).toHaveBeenNthCalledWith(1, 'hello ', expect.any(Function))
  expect(writeMock).toHaveBeenNthCalledWith(
    2,
    Buffer.of(0x20),
    expect.any(Function),
  )
  expect(files.close).toHaveBeenCalledWith('https://example.com', fd)
})

test('write rejects when the underlying write fails', async () => {
  const files = new OpenFiles()
  const permissions: readonly OriginFilePermission[] = [
    { origins: 'https://example.com', paths: '/a/path/**/*', access: 'rw' },
  ]
  const fd = uuid()
  const writeMock = jest
    .fn()
    .mockImplementation((_data: unknown, callback: (error?: unknown) => void) =>
      callback(new Error('EPIPE')),
    )
  jest
    .spyOn(files, 'get')
    .mockReturnValue(({ write: writeMock } as unknown) as WriteStream)

  await expect(
    write(files, permissions, 'https://example.com', {
      type: 'Write',
      fd,
      data: 'hello ',
    }),
  ).rejects.toThrowError('EPIPE')
})

test('cannot end a file that is not opened', async () => {
  await expect(
    end(
      new OpenFiles(),
      [{ origins: 'https://example.com', paths: '**/*', access: 'rw' }],
      'https://example.com',
      { type: 'End', fd: 'not a file descriptor' },
    ),
  ).rejects.toThrowError('ENOENT')
})

test('registers a handler to write files', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain, {
    options: {
      originFilePermissions: [
        {
          origins: 'https://example.com',
          paths: '**/*',
          access: 'rw',
        },
      ],
      url: new URL('https://example.com/'),
    },
  })

  const path = '/tmp/kiosk-browser-write-file-test-file'
  const { fd } = await ipcRenderer.invoke(fileSystemWriteFileChannel, {
    type: 'Open',
    path,
  })

  await ipcRenderer.invoke(fileSystemWriteFileChannel, {
    type: 'Write',
    fd,
    data: 'hello world',
  })

  await ipcRenderer.invoke(fileSystemWriteFileChannel, { type: 'End', fd })

  expect(await fs.readFile(path, 'utf8')).toEqual('hello world')
})

test('client workflow', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()
  const client = new Client(undefined, ipcRenderer)
  const handler = jest.fn()

  ipcMain.handle(fileSystemWriteFileChannel, handler)

  handler.mockResolvedValueOnce({ fd: 'abcdefg' })
  expect(await client.open('/a/path')).toEqual({ fd: 'abcdefg' })
  expect(handler).toHaveBeenCalledWith(expect.anything(), {
    type: 'Open',
    path: '/a/path',
  })

  handler.mockResolvedValueOnce(undefined)
  await client.write('abcdefg', 'hello world')
  expect(handler).toHaveBeenCalledWith(expect.anything(), {
    type: 'Write',
    fd: 'abcdefg',
    data: 'hello world',
  })

  handler.mockResolvedValueOnce(undefined)
  await client.end('abcdefg')
  expect(handler).toHaveBeenCalledWith(expect.anything(), {
    type: 'End',
    fd: 'abcdefg',
  })
})

test('client uses real ipcRenderer by default', () => {
  expect(new Client()['ipcRenderer']).toBe(ipcRenderer)
})
