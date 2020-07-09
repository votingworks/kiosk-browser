import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { promisify } from 'util'

import storage from 'electron-json-storage'
const clear = promisify(storage.clear)

export const channel = 'storageClear'

async function storageClear(): Promise<void> {
  return clear()
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async () => storageClear())
}
