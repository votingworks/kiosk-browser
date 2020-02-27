import { IpcMain, IpcMainInvokeEvent, WebContents } from 'electron'
import { Subscription } from 'rxjs'
import { devices } from '../utils/usb'

export const channel = 'device-subscription'

/**
 * Subscribe to add/remove USB device events.
 */
export default function register(ipcMain: IpcMain): void {
  const subscriptions = new Map<WebContents, Subscription>()

  ipcMain.handle(
    channel,
    (event: IpcMainInvokeEvent, { subscribe }: { subscribe: boolean }) => {
      const webContents = event.sender
      const subscription = subscriptions.get(webContents)

      // Always remove the old subscription as there's only one per WebContents.
      subscription?.unsubscribe()

      if (subscribe) {
        const subscription = devices.subscribe(set =>
          webContents.send(channel, Array.from(set)),
        )

        subscriptions.set(webContents, subscription)
        webContents.on('destroyed', () => {
          subscription.unsubscribe()
          subscriptions.delete(webContents)
        })
      } else if (!subscribe) {
        subscriptions.delete(webContents)
      }
    },
  )
}
