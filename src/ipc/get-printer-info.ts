import { IpcMainInvokeEvent, IpcMain } from 'electron'
import getConnectedDeviceURIs from '../utils/printing/getConnectedDeviceURIs'
import printerSchemes from '../utils/printing/printerSchemes'
import { debug } from '../utils/printing'
import {
  getPrinterIppAttributes,
  PrinterIppAttributes,
} from '../utils/printing/getPrinterIppAttributes'
import { retry } from '../utils/retry'

export const channel = 'get-printer-info'
export const PRINTER_CONNECTION_NUM_TRIES = 3
export const IPP_ATTRIBUTES_NUM_TRIES = 3

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
  const printersWithConnectionStatus = await retry(
    {
      tries: PRINTER_CONNECTION_NUM_TRIES,
      retryCondition: result => !result.some(printer => printer.connected),
    },
    async () => {
      const connectedDeviceURIs = await getConnectedDeviceURIs(
        printerSchemes(printers),
      )
      return printers.map(printer => {
        const deviceURI = printer.options?.['device-uri']
        const connected = deviceURI ? connectedDeviceURIs.has(deviceURI) : false
        return { ...printer, connected }
      })
    },
  )

  let ippAttributes: PrinterIppAttributes | undefined
  if (printersWithConnectionStatus.some(printer => printer.connected)) {
    // CUPS makes an IPP server available for each USB printer, starting with port
    // 60000 and incrementing for each printer. For now, we just assume that only
    // one printer is connected and use this URI to query its IPP attributes.
    // https://wiki.debian.org/CUPSDriverlessPrinting#IPP-over-USB:_Investigation_and_Troubleshooting
    try {
      ippAttributes = await retry({ tries: IPP_ATTRIBUTES_NUM_TRIES }, () =>
        getPrinterIppAttributes('ipp://localhost:60000/ipp/print'),
      )
    } catch (error) {
      debug('failed to get IPP attributes: %o', error)
    }
  }

  return printersWithConnectionStatus.map(printer => {
    const attributes =
      printer.connected && ippAttributes
        ? ippAttributes
        : { state: null, stateReasons: [], markerInfos: [] }
    return {
      name: printer.name,
      isDefault: printer.isDefault,
      options: printer.options,
      description: printer.description,
      ...attributes,
      connected: printer.connected,
    }
  })
}

/**
 * Registers a handler to get printer info.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, (event: IpcMainInvokeEvent) =>
    getPrinterInfo(event.sender.getPrinters()),
  )
}
