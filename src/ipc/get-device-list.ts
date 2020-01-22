import { IpcMain } from 'electron'
import { assertMonitoring, getDeviceList } from '../utils/usb'

export const channel = 'get-device-list'

/**
 * Get information about all known USB devices.
 */
export default function register(ipcMain: IpcMain): () => void {
  // Always monitor devices, otherwise `getDeviceList` will be cached and stale.
  const monitoringAssertion = assertMonitoring()

  ipcMain.handle(channel, () => getDeviceList())

  // Cleanup releases USB monitoring assertion.
  return () => monitoringAssertion.release()
}
