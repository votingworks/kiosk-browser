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

  // Always monitor devices.
  usbDetection.startMonitoring()

  ipcMain.handle(channel, (event: IpcMainInvokeEvent, subscribe: boolean) => {
    const webContents = event.sender

    const onDeviceAdded: DeviceChangeCallback = device =>
      webContents.send(deviceChangeChannel, ChangeType.Add, device)

    const onDeviceRemoved: DeviceChangeCallback = device =>
      webContents.send(deviceChangeChannel, ChangeType.Remove, device)

    if (subscribe && !subscribers.has(webContents)) {
      usbDetection.on('add', onDeviceAdded)
      usbDetection.on('remove', onDeviceRemoved)

      subscribers.set(webContents, [onDeviceAdded, onDeviceRemoved])

      webContents.on('destroyed', () => {
        usbDetection.off('add', onDeviceAdded)
        usbDetection.off('remove', onDeviceRemoved)
      })
    } else if (!subscribe) {
      const callbacks = subscribers.get(webContents)

      subscribers.delete(webContents)

      if (callbacks) {
        const [onDeviceAdded, onDeviceRemoved] = callbacks

        usbDetection.off('add', onDeviceAdded)
        usbDetection.off('remove', onDeviceRemoved)
      }
    }
  })
}
