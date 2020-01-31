import { Printer } from '.'

/**
 */
export default function findDeviceURIMatchingPrinterConfig(
  printer: Printer,
  deviceURIs: Iterable<string>,
): string | undefined {
  for (const deviceURI of deviceURIs) {
    if (deviceURI.startsWith(printer.baseDeviceURI)) {
      return deviceURI
    }
  }
}
