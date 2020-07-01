import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import exec from '../utils/exec'

export const channel = 'unmountUsbDrive'

async function unmountUsbDrive(device: string): Promise<void> {
  await exec('pumount', [join('/dev', device)])
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, device: string) => {
    await unmountUsbDrive(device)
  })
}
