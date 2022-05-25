import { Printer, PrintConfig } from '.';

/**
 * Finds a printer config matching a USB device.
 */
export default function getPrinterConfigForDevice(
  config: PrintConfig,
  device: KioskBrowser.Device,
): Printer | undefined {
  for (const printer of config.printers) {
    if (
      printer.vendorId === device.vendorId &&
      printer.productId === device.productId
    ) {
      return printer;
    }
  }
}
