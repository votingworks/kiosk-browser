import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { promisify } from 'util'

import storage from 'electron-json-storage'
const set = promisify(storage.set)

export const channel = 'storageSet'

async function storageSet(key: string, value: object): Promise<void> {
  return set(key, value)
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, key: string, value: object) =>
      storageSet(key, value),
  )
}
