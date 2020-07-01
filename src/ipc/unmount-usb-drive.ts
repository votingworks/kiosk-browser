import { IpcMainInvokeEvent, IpcMain, PrinterInfo } from 'electron'
import exec from '../utils/exec'

export const channel = 'unmountUsbDrive'

async function unmountUsbDrive(device: string): Promise<void> {
  const { stdout, stderr } = await exec('pumount', ['/dev/' + device])
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, device: string) => {
    await unmountUsbDrive(device)
  })
}
