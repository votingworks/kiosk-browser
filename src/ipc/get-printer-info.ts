import { IpcMainInvokeEvent, IpcMain } from 'electron'
import getConnectedDeviceURIs from '../utils/printing/getConnectedDeviceURIs'
import printerSchemes from '../utils/printing/printerSchemes'
import { debug } from '../utils/printing'

export const channel = 'get-printer-info'

export interface PrinterInfo extends Electron.PrinterInfo {
  connected: boolean
}

/**
 * Get information about all known printers, including connection status.
 */
export async function getPrinterInfo(
  printers: Electron.PrinterInfo[],
): Promise<PrinterInfo[]> {
  const results: PrinterInfo[] = []
  const connectedDeviceURIs = await getConnectedDeviceURIs(
    printerSchemes(printers),
  )

  debug('checking known printers against connected printers')
  for (const printer of printers) {
    const deviceURI = printer.options?.['device-uri']
    const connected = deviceURI ? connectedDeviceURIs.has(deviceURI) : false

    debug('known printer has connected=%o: %O', connected, printer)
    results.push({
      ...printer,
      connected,
    })
  }

  return results
}

/**
 * Registers a handler to get printer info.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, (event: IpcMainInvokeEvent) =>
    getPrinterInfo(event.sender.getPrinters()),
  )
}
