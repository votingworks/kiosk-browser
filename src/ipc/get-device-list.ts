import { IpcMain } from 'electron'
import usbDetection from 'usb-detection'

export const channel = 'get-device-list'

/**
 * Get information about all known USB devices.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => usbDetection.find())
}
