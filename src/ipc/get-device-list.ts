import { IpcMain } from 'electron'
import { getDeviceList, onDeviceChange } from '../utils/usb'

export const channel = 'get-device-list'

/**
 * Get information about all known USB devices.
 */
export default function register(ipcMain: IpcMain): () => void {
  // Always monitor devices, otherwise `getDeviceList` will be cached and stale.
  const listener = onDeviceChange.add(() => {
    // just here for the side effect
  })

  ipcMain.handle(channel, () => getDeviceList())

  // Cleanup releases USB monitoring assertion.
  return (): void => listener.remove()
}
