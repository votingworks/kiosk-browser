import getPrinterConfigForDevice from './getPrinterConfigForDevice';
import findDeviceURIMatchingPrinterConfig from './findDeviceURIMatchingPrinterConfig';
import configurePrinter from './configurePrinter';
import getConnectedDeviceURIs from './getConnectedDeviceURIs';
import getPrinterDeviceURI from './getPrinterDeviceURI';
import { debug, PrintConfig } from '.';
import { Device } from '../usb';

export default async function configurePrinterFromDevice(
  config: PrintConfig,
  device: Device,
): Promise<boolean> {
  const printer = getPrinterConfigForDevice(config, device);

  if (!printer) {
    debug('USB device does not match a printer configuration: %O', device);
    return false;
  }

  const deviceURIs = await getConnectedDeviceURIs(new Set(['usb']));
  const deviceURI = findDeviceURIMatchingPrinterConfig(printer, deviceURIs);

  if (!deviceURI) {
    debug(
      'Could not find device URI in connected printers=%O for printer matching config=%O',
      deviceURIs,
      printer,
    );
    return false;
  }

  const namedPrinterDeviceURI = await getPrinterDeviceURI(config.printerName);

  if (namedPrinterDeviceURI === deviceURI) {
    debug('printer "%s" is already configured, skipping', config.printerName);
    return false;
  }

  await configurePrinter({
    printerName: config.printerName,
    ppd: printer.ppd,
    deviceURI,
    setDefault: true,
  });

  return true;
}
