import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { promisify } from 'util'

import storage from 'electron-json-storage'
const get = promisify(storage.get)

export const channel = 'storageGet'

async function storageGet<T extends object>(
  key: string,
): Promise<T | undefined> {
  return ((await get(key)) || undefined) as Promise<T | undefined>
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, key: string) =>
    storageGet(key),
  )
}
