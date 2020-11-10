import { IpcMain } from 'electron'
import storage from 'electron-json-storage'
import { promisify } from 'util'

const clear = promisify(storage.clear)

export const channel = 'storageClear'

async function storageClear(): Promise<void> {
  return clear()
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async () => storageClear())
}
