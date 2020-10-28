import { promises as fs, Stats } from 'fs'
import { fakeIpc } from '../../test/ipc'
import register, {
  channel as fileSystemGetEntriesChannel,
  getEntries,
} from './file-system-get-entries'

jest.mock('fs', () => ({
  promises: {
    readdir: jest
      .fn()
      .mockRejectedValue(new Error('ENOENT no mock value provided')),
    stat: jest
      .fn()
      .mockRejectedValue(new Error('ENOENT no mock value provided')),
  },
}))

test('gets entries with stat info', async () => {
  jest
    .spyOn(fs, 'readdir')
    .mockResolvedValueOnce(['a.txt', 'b.json', 'c.csv', 'd.png'] as never)

  // a.txt
  jest.spyOn(fs, 'stat').mockResolvedValueOnce({
    size: 1,
    isDirectory: () => false,
    isFile: () => true,
    mtime: new Date(0),
    atime: new Date(0),
    ctime: new Date(0),
  } as Stats)

  // b.json
  jest.spyOn(fs, 'stat').mockResolvedValueOnce({
    size: 2,
    isDirectory: () => false,
    isFile: () => true,
    mtime: new Date(0),
    atime: new Date(0),
    ctime: new Date(0),
  } as Stats)

  // c.csv
  jest.spyOn(fs, 'stat').mockResolvedValueOnce({
    size: 3,
    isDirectory: () => false,
    isFile: () => true,
    mtime: new Date(0),
    atime: new Date(0),
    ctime: new Date(0),
  } as Stats)

  // d.png
  jest.spyOn(fs, 'stat').mockResolvedValueOnce({
    size: 4,
    isDirectory: () => false,
    isFile: () => true,
    mtime: new Date(0),
    atime: new Date(0),
    ctime: new Date(0),
  } as Stats)

  expect(
    await getEntries(
      [{ hostnames: 'example.com', paths: '**/*', access: 'ro' }],
      'example.com',
      '/a/path',
    ),
  ).toEqual([
    {
      name: 'a.txt',
      path: '/a/path/a.txt',
      size: 1,
      isDirectory: false,
      isFile: true,
      mtime: new Date(0),
      atime: new Date(0),
      ctime: new Date(0),
    },
    {
      name: 'b.json',
      path: '/a/path/b.json',
      size: 2,
      isDirectory: false,
      isFile: true,
      mtime: new Date(0),
      atime: new Date(0),
      ctime: new Date(0),
    },
    {
      name: 'c.csv',
      path: '/a/path/c.csv',
      size: 3,
      isDirectory: false,
      isFile: true,
      mtime: new Date(0),
      atime: new Date(0),
      ctime: new Date(0),
    },
    {
      name: 'd.png',
      path: '/a/path/d.png',
      size: 4,
      isDirectory: false,
      isFile: true,
      mtime: new Date(0),
      atime: new Date(0),
      ctime: new Date(0),
    },
  ])
})

test('registers a handler to get directory entries', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain, {
    hostFilePermissions: [
      {
        hostnames: 'example.com',
        paths: '**/*',
        access: 'ro',
      },
    ],
    url: new URL('http://example.com/'),
  })

  jest.spyOn(fs, 'readdir').mockResolvedValueOnce([])

  expect(
    await ipcRenderer.invoke(fileSystemGetEntriesChannel, '/a/path'),
  ).toEqual([])

  expect(fs.readdir).toHaveBeenCalledWith('/a/path')
})
