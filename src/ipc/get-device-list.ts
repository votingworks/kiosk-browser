import { IpcMain } from 'electron'
import usbDetection from 'usb-detection'

export const channel = 'get-device-list'

/**
 * Get information about all known USB devices.
 */
export default function register(ipcMain: IpcMain): void {
  // Always monitor devices, otherwise `getDeviceList` will be cached and stale.
  usbDetection.startMonitoring()

  ipcMain.handle(channel, () => usbDetection.find())
}
