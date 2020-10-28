import makeDebug from 'debug'
import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { promises as fs } from 'fs'
import { isAbsolute } from 'path'
import { assertHasReadAccess, HostFilePermission } from '../utils/access'
import { Options } from '../utils/options'

const debug = makeDebug('kiosk-browser:file-system-read-file')

export const channel = 'file-system-read-file'

export async function readFile(
  hostname: string,
  permissions: readonly HostFilePermission[],
  path: string,
  encoding?: string,
): Promise<Buffer | string> {
  if (!isAbsolute(path)) {
    debug('aborting request because it is not an absolute path')
    throw new Error(`requested path is not absolute: ${path}`)
  }

  assertHasReadAccess(permissions, hostname, path)
  return await fs.readFile(path, encoding)
}

export default function register(ipcMain: IpcMain, options: Options): void {
  ipcMain.handle(
    channel,
    (event: IpcMainInvokeEvent, path: string, encoding?: string) => {
      const url = new URL(event.sender.getURL())
      const hostname = url.hostname || url.toString()
      return readFile(hostname, options.hostFilePermissions, path, encoding)
    },
  )
}
