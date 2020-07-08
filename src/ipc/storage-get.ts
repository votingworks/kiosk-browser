import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { promises as fs } from 'fs'
import { promisify } from 'util'

import storage from 'electron-json-storage'
const get = promisify(storage.get)

export const channel = 'storageGet'

interface StringObject {
  value: string
}

async function storageGet(key: string): Promise<object> {
  return get(key) as Promise<object>
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, key: string) =>
    storageGet(key),
  )
}
