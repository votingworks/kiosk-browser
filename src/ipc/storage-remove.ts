import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { promisify } from 'util'

import storage from 'electron-json-storage'
const remove = promisify(storage.remove)

export const channel = 'storageRemove'

async function storageRemove(key: string): Promise<void> {
  return remove(key)
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, key: string) =>
    storageRemove(key),
  )
}
