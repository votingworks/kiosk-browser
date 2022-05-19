import { PrinterInfo } from 'electron';

/**
 * Gets either the default printer or the first available printer.
 */
export default function getPreferredPrinter(
  printers: PrinterInfo[],
): PrinterInfo | undefined {
  return printers.find((printer) => printer.isDefault) ?? printers[0];
}
