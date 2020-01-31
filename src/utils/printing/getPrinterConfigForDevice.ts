import { Printer, PrintConfig } from '.'
import { Device } from '../usb'

/**
 * Finds a printer config matching a USB device.
 */
export default function getPrinterConfigForDevice(
  config: PrintConfig,
  device: Device,
): Printer | undefined {
  for (const printer of config.printers) {
    if (
      printer.vendorId === device.vendorId &&
      printer.productId === device.productId
    ) {
      return printer
    }
  }
}
