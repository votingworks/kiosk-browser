import { IpcMain, IpcMainInvokeEvent, WebContents } from 'electron'
import usbDetection, { Device } from 'usb-detection'

export const channel = 'manage-device-subscription'
export const deviceChangeChannel = 'device-change'

export enum ChangeType {
  Add,
  Remove,
}

type DeviceChangeCallback = (device: Device) => void

/**
 * Subscribe to add/remove USB device events.
 */
export default function register(ipcMain: IpcMain): void {
  const subscribers = new Map<
    WebContents,
    [DeviceChangeCallback, DeviceChangeCallback]
  >()

  ipcMain.handle(channel, (event: IpcMainInvokeEvent, subscribe: boolean) => {
    const webContents = event.sender

    const onDeviceAdded: DeviceChangeCallback = device =>
      webContents.send(deviceChangeChannel, ChangeType.Add, device)

    const onDeviceRemoved: DeviceChangeCallback = device =>
      webContents.send(deviceChangeChannel, ChangeType.Remove, device)

    if (subscribe && !subscribers.has(webContents)) {
      usbDetection.on('add', onDeviceAdded)
      usbDetection.on('remove', onDeviceRemoved)

      if (subscribers.size === 0) {
        usbDetection.startMonitoring()
      }

      subscribers.set(webContents, [onDeviceAdded, onDeviceRemoved])
    } else if (!subscribe) {
      const callbacks = subscribers.get(webContents)

      subscribers.delete(webContents)

      if (subscribers.size === 0) {
        usbDetection.stopMonitoring()
      }

      if (callbacks) {
        const [onDeviceAdded, onDeviceRemoved] = callbacks

        usbDetection.off('add', onDeviceAdded)
        usbDetection.off('remove', onDeviceRemoved)
      }
    }
  })
}
