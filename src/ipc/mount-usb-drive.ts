import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import exec from '../utils/exec'

export const channel = 'mountUsbDrive'

async function mountUsbDrive(device: string): Promise<void> {
  await exec('pmount', [
    '-w',
    '-u',
    '000',
    join('/dev', device),
    `usb-drive-${device}`,
  ])
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, device: string) => {
    await mountUsbDrive(device)
  })
}
