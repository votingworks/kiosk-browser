import { ChangeType } from '../../ipc/manage-device-subscription'
import makeDebug from 'debug'
import getPrinterConfigForDevice from './getPrinterConfigForDevice'
import findDeviceURIMatchingPrinterConfig from './findDeviceURIMatchingPrinterConfig'
import configurePrinter from './configurePrinter'
import getConnectedDeviceURIs from './getConnectedDeviceURIs'
import { Device } from '../usb'
import { Listener } from '../Listeners'

export const debug = makeDebug('kiosk-browser:printing')

export interface PrintConfig {
  printerName: string
  printers: Printer[]
}

export interface Printer {
  label: string
  vendorId: number
  productId: number
  baseDeviceURI: string
  ppd: PostScriptPrinterDefinition
}

export type PostScriptPrinterDefinition =
  | FilePostScriptPrinterDefinition
  | ModelPostScriptPrinterDefinition

export interface FilePostScriptPrinterDefinition {
  /**
   * Path to a `.ppd` file for a given printer.
   */
  path: string
}

export interface ModelPostScriptPrinterDefinition {
  /**
   * Name of a well-known printer definition.
   */
  model: string
}

export function makeDeviceChangeHandler(config: PrintConfig) {
  return async function(changeType: ChangeType, device: Device) {
    if (changeType !== ChangeType.Add) {
      debug('ignoring device remove event: %O', device)
      return
    }

    const printer = getPrinterConfigForDevice(config, device)

    if (!printer) {
      debug('USB device does not match a printer configuration: %O', device)
      return
    }

    const deviceURIs = await getConnectedDeviceURIs(new Set(['usb']))
    const deviceURI = findDeviceURIMatchingPrinterConfig(printer, deviceURIs)

    if (!deviceURI) {
      debug(
        'Could not find device URI for printer matching config: %O',
        printer,
      )
      return
    }

    await configurePrinter({
      printerName: config.printerName,
      ppd: printer.ppd,
      deviceURI,
      setDefault: true,
    })
  }
}

export default function autoconfigurePrinter(
  config: PrintConfig,
  onDeviceChange: typeof import('../usb').onDeviceChange,
): Listener<[ChangeType, Device]> {
  return onDeviceChange.add(makeDeviceChangeHandler(config))
}
