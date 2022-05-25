import { Observable } from 'rxjs';
import { debug, PrintConfig } from '.';
import configurePrinterFromDevice from './configurePrinterFromDevice';

export default function autoconfigurePrinter(
  config: PrintConfig,
  devices: Observable<Iterable<KioskBrowser.Device>>,
): Observable<void> {
  return new Observable((subscriber) =>
    devices.subscribe(function onDevicesUpdate(
      list: Iterable<KioskBrowser.Device>,
    ): void {
      for (const device of list) {
        configurePrinterFromDevice(config, device)
          .then((configured) => {
            if (configured) {
              debug(
                'yielding printer configure event after configuring printer: %o',
                device,
              );
              subscriber.next();
            } else {
              debug(
                'newly added device was not configured as a printer: %o',
                device,
              );
            }
          })
          .catch((error) => subscriber.error(error));
      }
    }),
  );
}
