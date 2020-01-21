import { IpcMainInvokeEvent, IpcMain } from 'electron'
import exec from '../utils/exec'

export const channel = 'get-printer-info'

export interface PrinterInfo extends Electron.PrinterInfo {
  connected: boolean
}

/**
 * Gets the URIs of any connected printers matching the given schemes.
 */
export async function getConnectedDeviceURIs(
  schemes?: Set<string>,
): Promise<Set<string>> {
  const lpinfoArgs: string[] = []

  if (schemes?.size) {
    lpinfoArgs.push(
      '--include-schemes',
      Array.from(schemes).join(','), // e.g. usb
    )
  }

  // Show available devices with `-v` vs available drivers with `-m`.
  lpinfoArgs.push('-v')

  const { stdout } = await exec('lpinfo', lpinfoArgs)

  return new Set(stdout.split('\n').map(line => line.split(/\s+/, 2)[1]))
}

/**
 * Gets the printer schemes from the given printers, for example `usb`.
 */
export function printerSchemes(printers: Electron.PrinterInfo[]): Set<string> {
  const uris = printers
    .map(printer => printer.options?.['device-uri'])
    .filter(Boolean) as string[]
  return new Set(uris.map(uri => new URL(uri).protocol.slice(0, -1)))
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

  for (const printer of printers) {
    const deviceURI = printer.options?.['device-uri']
    const connected = deviceURI ? connectedDeviceURIs.has(deviceURI) : false

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
