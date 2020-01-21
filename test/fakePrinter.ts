import { PrinterInfo } from 'electron'

export default function fakePrinter(
  printer: Partial<PrinterInfo> = {},
): PrinterInfo {
  return {
    description: printer.name ?? 'main printer',
    isDefault: true,
    name: 'main printer',
    status: 0,
    ...printer,
  }
}
