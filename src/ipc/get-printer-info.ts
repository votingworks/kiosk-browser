import { IpcMainInvokeEvent, IpcMain } from 'electron'
import getConnectedDeviceURIs from '../utils/printing/getConnectedDeviceURIs'
import printerSchemes from '../utils/printing/printerSchemes'
import { debug } from '../utils/printing'
import {
  getPrinterIppAttributes,
  PrinterIppAttributes,
} from '../utils/printing/getPrinterIppAttributes'

export const channel = 'get-printer-info'
export const PRINTER_CONNECTION_NUM_TRIES = 3

/**
 * A collection of info about a printer.
 * Note that Electron's status is not accurate - its always 3 (idle) even when the printer is stopped.
 * Instead, we get an accurate status via IPP.
 */
export interface PrinterInfo
  extends Omit<Electron.PrinterInfo, 'status'>,
    PrinterIppAttributes {
  connected: boolean
}

/**
 * Get information about all known printers, including connection status.
 */
export async function getPrinterInfo(
  printers: Electron.PrinterInfo[],
): Promise<PrinterInfo[]> {
  let results: PrinterInfo[] = []

  for (
    let attempt = 0;
    attempt < PRINTER_CONNECTION_NUM_TRIES && results.length === 0;
    attempt += 1
  ) {
    results = []
    const connectedDeviceURIs = await getConnectedDeviceURIs(
      printerSchemes(printers),
    )

    // CUPS makes an IPP server available for each USB printer, starting with port
    // 6000 and incrementing for each printer. For now, we just assume that only
    // one printer is connected and use this URI to query its IPP attributes.
    // https://wiki.debian.org/CUPSDriverlessPrinting#IPP-over-USB:_Investigation_and_Troubleshooting
    const ippAttributes = await getPrinterIppAttributes(
      'ipp://localhost:60000/ipp/print',
    )

    debug('checking known printers against connected printers')
    for (const printer of printers) {
      const deviceURI = printer.options?.['device-uri']
      const connected = deviceURI ? connectedDeviceURIs.has(deviceURI) : false

      debug('known printer has connected=%o: %O', connected, printer)
      results.push({
        name: printer.name,
        isDefault: printer.isDefault,
        options: printer.options,
        description: printer.description,
        ...ippAttributes,
        connected,
      })
    }
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
