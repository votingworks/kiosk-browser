/**
 * Gets the printer schemes from the given printers, for example `usb`.
 */
export default function printerSchemes(
  printers: Electron.PrinterInfo[],
): Set<string> {
  const uris = printers
    .map(printer => printer.options?.['device-uri'])
    .filter(Boolean) as string[]
  return new Set(uris.map(uri => new URL(uri).protocol.slice(0, -1)))
}
