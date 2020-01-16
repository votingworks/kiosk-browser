import { WebContents, PrinterInfo } from 'electron'

/**
 * Gets either the default printer or the first available printer.
 */
export default function getPreferredPrinter(
  webContents: WebContents,
): PrinterInfo | undefined {
  const printers = webContents.getPrinters()
  return printers.find(printer => printer.isDefault) ?? printers[0]
}
