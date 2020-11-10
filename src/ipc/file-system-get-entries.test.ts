import { Dirent, promises as fs, Stats } from 'fs'
import { basename } from 'path'
import { fakeIpc } from '../../test/ipc'
import register, {
  channel as fileSystemGetEntriesChannel,
  DirentType,
  getEntries,
} from './file-system-get-entries'

// Dirent types treat the constructor as private.
const ConstructableDirent = (Dirent as unknown) as new (
  name: string,
  type: DirentType,
) => Dirent

const file = (name: string): Dirent =>
  new ConstructableDirent(name, DirentType.File)

test('gets entries with stat info', async () => {
  const entries = [file('a.txt'), file('b.json'), file('c.csv'), file('d.png')]
  jest.spyOn(fs, 'readdir').mockResolvedValueOnce(entries)

  jest.spyOn(fs, 'lstat').mockImplementation(path => {
    const base = basename(path as string)
    for (const [i, entry] of entries.entries()) {
      if (entry.name === base) {
        return Promise.resolve({
          size: i + 1,
          mtime: new Date(0),
          atime: new Date(0),
          ctime: new Date(0),
        } as Stats)
      }
    }

    throw new Error(`unexpected path: ${path}`)
  })

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
      type: DirentType.File,
      mtime: new Date(0),
      atime: new Date(0),
      ctime: new Date(0),
    },
    {
      name: 'b.json',
      path: '/a/path/b.json',
      size: 2,
      type: DirentType.File,
      mtime: new Date(0),
      atime: new Date(0),
      ctime: new Date(0),
    },
    {
      name: 'c.csv',
      path: '/a/path/c.csv',
      size: 3,
      type: DirentType.File,
      mtime: new Date(0),
      atime: new Date(0),
      ctime: new Date(0),
    },
    {
      name: 'd.png',
      path: '/a/path/d.png',
      size: 4,
      type: DirentType.File,
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

  expect(fs.readdir).toHaveBeenCalledWith('/a/path', { withFileTypes: true })
})
