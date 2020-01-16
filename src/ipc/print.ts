import { IpcMainInvokeEvent, IpcMain } from 'electron'
import getPreferredPrinter from '../utils/getPreferredPrinter'

export const channel = 'print'

/**
 * Enable directly printing without a prompt.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    (
      event: IpcMainInvokeEvent,
      deviceName = getPreferredPrinter(event.sender)?.name,
    ) =>
      new Promise((resolve, reject) =>
        event.sender.print(
          {
            silent: true,
            deviceName,
          },
          (success, failureReason) => {
            if (success) {
              resolve()
            } else {
              reject(failureReason)
            }
          },
        ),
      ),
  )
}
