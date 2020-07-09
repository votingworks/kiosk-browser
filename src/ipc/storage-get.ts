import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { promisify } from 'util'

import storage from 'electron-json-storage'
const has = promisify(storage.has)
const get = promisify(storage.get)

export const channel = 'storageGet'

async function storageGet<T extends object>(
  key: string,
): Promise<T | undefined> {
  if (await has(key)) {
    return ((await get(key)) ?? undefined) as T | undefined
  }
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, key: string) =>
    storageGet(key),
  )
}
