import { IpcMainInvokeEvent, WebContents, PrinterInfo, IpcMain } from 'electron'

export function getDefaultPrinter(webContents: WebContents): PrinterInfo {
  const printers = webContents.getPrinters()
  return printers.find(printer => printer.isDefault) ?? printers[0]
}

export const channel = 'print'

/**
 * Enable directly printing without a prompt.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    (event: IpcMainInvokeEvent) =>
      new Promise((resolve, reject) =>
        event.sender.print(
          {
            silent: true,
            deviceName: getDefaultPrinter(event.sender).name,
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
