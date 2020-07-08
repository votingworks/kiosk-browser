import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { promises as fs } from 'fs'
import { promisify } from 'util'

import storage from 'electron-json-storage'
const clear = promisify(storage.clear)

export const channel = 'storageClear'

async function storageClear(): Promise<void> {
  return clear()
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent) => storageClear())
}
