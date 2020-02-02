import { IpcMainInvokeEvent, IpcMain, PrinterInfo } from 'electron'
import getPreferredPrinter from '../utils/getPreferredPrinter'

export const channel = 'print'

/**
 * This function could be easily inlined, except for this:
 * https://github.com/microsoft/TypeScript/issues/36295
 *
 * So once that bug is fixed we can inline this.
 */
function getPreferredPrinterName(printers: PrinterInfo[]): string | undefined {
  return getPreferredPrinter(printers)?.name
}

/**
 * Enable directly printing without a prompt.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    (
      event: IpcMainInvokeEvent,
      deviceName = getPreferredPrinterName(event.sender.getPrinters()),
    ) => {
      return new Promise((resolve, reject) =>
        event.sender.print(
          {
            silent: true,
            deviceName,
	    printBackground: true,
          },
          (success, failureReason) => {
            if (success) {
              resolve()
            } else {
              reject(failureReason)
            }
          },
        ),
      )
    },
  )
}
