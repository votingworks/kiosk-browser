import { IpcMain } from 'electron'
import { getDeviceList, usbResource } from '../utils/usb'

export const channel = 'get-device-list'

/**
 * Get information about all known USB devices.
 */
export default function register(ipcMain: IpcMain): () => void {
  // Always monitor devices, otherwise `getDeviceList` will be cached and stale.
  const usbMonitor = usbResource.retain()

  ipcMain.handle(channel, () => getDeviceList())

  // Cleanup releases USB monitoring.
  return () => usbMonitor.release()
}
