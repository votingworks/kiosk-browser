import { IpcMain, IpcMainInvokeEvent, WebContents } from 'electron'
import { onDeviceChange, Device } from '../utils/usb'
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
export default function register(ipcMain: IpcMain): void {
  const subscribers = new Map<WebContents, Listener>()

  ipcMain.handle(channel, (event: IpcMainInvokeEvent, subscribe: boolean) => {
    const webContents = event.sender
    const listener = subscribers.get(webContents)

    // Always remove the old listener as there's only one per WebContents.
    listener?.remove()

    if (subscribe) {
      const onDeviceChanged = (changeType: ChangeType, device: Device): void =>
        webContents.send(deviceChangeChannel, changeType, device)
      const listener = onDeviceChange.add(onDeviceChanged)

      subscribers.set(webContents, listener)
      webContents.on('destroyed', () => {
        listener.remove()
        subscribers.delete(webContents)
      })
    } else if (!subscribe) {
      subscribers.delete(webContents)
    }
  })
}
