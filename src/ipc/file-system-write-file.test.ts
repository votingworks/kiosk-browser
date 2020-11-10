import { promises as fs, WriteStream } from 'fs'
import { fakeIpc } from '../../test/ipc'
import { OriginFilePermission } from '../utils/access'
import OpenFiles from '../utils/OpenFiles'
import register, {
  channel as fileSystemWriteFileChannel,
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
  const fd = 1
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
  const fd = 1
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

test('registers a handler to write files', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain, {
    originFilePermissions: [
      {
        origins: 'https://example.com',
        paths: '**/*',
        access: 'rw',
      },
    ],
    url: new URL('https://example.com/'),
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
