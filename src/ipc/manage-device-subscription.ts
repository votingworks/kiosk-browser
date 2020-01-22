import { IpcMain, IpcMainInvokeEvent, WebContents } from 'electron'
import { assertMonitoring, onDeviceChange, Device } from '../utils/usb'
import { Listener } from '../utils/Listeners'

export const channel = 'manage-device-subscription'
export const deviceChangeChannel = 'device-change'

export enum ChangeType {
  Add,
  Remove,
}

/**
 * Subscribe to add/remove USB device events.
 */
export default function register(ipcMain: IpcMain): (() => void) | undefined {
  const subscribers = new Map<WebContents, Listener<[ChangeType, Device]>>()

  // Always monitor devices.
  const monitoringAssertion = assertMonitoring()

  ipcMain.handle(channel, (event: IpcMainInvokeEvent, subscribe: boolean) => {
    const webContents = event.sender

    const onDeviceChanged = (changeType: ChangeType, device: Device) =>
      webContents.send(deviceChangeChannel, changeType, device)

    if (subscribe && !subscribers.has(webContents)) {
      subscribers.set(webContents, onDeviceChange.add(onDeviceChanged))

      webContents.on('destroyed', () => {
        onDeviceChange.remove(onDeviceChanged)
      })
    } else if (!subscribe) {
      const onDeviceChanged = subscribers.get(webContents)

      subscribers.delete(webContents)
      onDeviceChanged?.remove()
    }
  })

  return () => monitoringAssertion.release()
}
