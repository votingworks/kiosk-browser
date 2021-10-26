import { IpcMain, IpcMainInvokeEvent } from 'electron'

export const channel = 'log'

/**
 * Log the given log line
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, (event: IpcMainInvokeEvent, message: string) => {
    console.log(message)
  })
}
