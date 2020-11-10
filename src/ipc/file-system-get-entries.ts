import makeDebug from 'debug'
import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { Dirent, promises as fs } from 'fs'
import { isAbsolute, join } from 'path'
import { assertHasReadAccess, OriginFilePermission } from '../utils/access'
import { Options } from '../utils/options'

const debug = makeDebug('kiosk-browser:file-system-get-entries')

export const channel = 'file-system-get-entries'

export enum DirentType {
  File = 1, // UV_DIRENT_FILE
  Directory = 2, // UV_DIRENT_DIR
  SymbolicLink = 3, // UV_DIRENT_LINK
  FIFO = 4, // UV_DIRENT_FIFO
  Socket = 5, // UV_DIRENT_SOCKET
  CharacterDevice = 6, // UV_DIRENT_CHAR
  BlockDevice = 7, // UV_DIRENT_BLOCK
}

export interface FileSystemEntry {
  readonly name: string
  readonly path: string
  readonly type: DirentType
  readonly size: number
  readonly mtime: Date
  readonly atime: Date
  readonly ctime: Date
}

function getDirentType(dirent: Dirent): DirentType {
  if (dirent.isFile()) return DirentType.File
  if (dirent.isDirectory()) return DirentType.Directory
  if (dirent.isSymbolicLink()) return DirentType.SymbolicLink
  if (dirent.isFIFO()) return DirentType.FIFO
  if (dirent.isSocket()) return DirentType.Socket
  if (dirent.isCharacterDevice()) return DirentType.CharacterDevice
  if (dirent.isBlockDevice()) return DirentType.BlockDevice
  throw new TypeError('dirent is not of a known type')
}

/**
 * Get entries for a directory, includes stat information for each entry.
 */
export async function getEntries(
  permissions: readonly OriginFilePermission[],
  origin: string,
  path: string,
): Promise<FileSystemEntry[] | undefined> {
  if (!isAbsolute(path)) {
    debug('aborting request because it is not an absolute path')
    throw new Error(`requested path is not absolute: ${path}`)
  }
  assertHasReadAccess(permissions, origin, path)

  const entries = await fs.readdir(path, { withFileTypes: true })
  return await Promise.all(
    entries
      .filter(entry => entry.isFile() || entry.isDirectory())
      .map(async entry => {
        const entryPath = join(path, entry.name)
        const stat = await fs.lstat(entryPath)

        return {
          name: entry.name,
          path: entryPath,
          size: stat.size,
          type: getDirentType(entry),
          mtime: stat.mtime,
          atime: stat.atime,
          ctime: stat.ctime,
        }
      }),
  )
}

export default function register(ipcMain: IpcMain, options: Options): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, path: string) => {
    const url = new URL(event.sender.getURL())
    return await getEntries(options.originFilePermissions, url.origin, path)
  })
}
