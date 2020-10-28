import makeDebug from 'debug'
import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { promises as fs } from 'fs'
import { isAbsolute, join } from 'path'
import { assertHasReadAccess, HostFilePermission } from '../utils/access'
import { Options } from '../utils/options'

const debug = makeDebug('kiosk-browser:file-system-get-entries')

export const channel = 'file-system-get-entries'

export interface FileSystemEntry {
  readonly name: string
  readonly path: string
  readonly isDirectory: boolean
  readonly isFile: boolean
  readonly size: number
  readonly mtime: Date
  readonly atime: Date
  readonly ctime: Date
}

/**
 * Get entries for a directory, includes stat information for each entry.
 */
export async function getEntries(
  permissions: readonly HostFilePermission[],
  hostname: string,
  path: string,
): Promise<FileSystemEntry[] | undefined> {
  if (!isAbsolute(path)) {
    debug('aborting request because it is not an absolute path')
    throw new Error(`requested path is not absolute: ${path}`)
  }
  assertHasReadAccess(permissions, hostname, path)

  const names = await fs.readdir(path)
  return await Promise.all(
    names.map(async name => {
      const entryPath = join(path, name)
      const stat = await fs.stat(entryPath)

      return {
        name,
        path: entryPath,
        size: stat.size,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
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
    const hostname = url.hostname || url.toString()
    return await getEntries(options.hostFilePermissions, hostname, path)
  })
}
