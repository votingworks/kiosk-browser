import autoconfigurePrinter from './autoconfigurePrinter';
import { Subject } from 'rxjs';
import fakeDevice from '../../../test/fakeDevice';
import configurePrinterFromDevice from './configurePrinterFromDevice';
import mockOf from '../../../test/mockOf';
import deferred from '../deferred';

jest.mock('./configurePrinterFromDevice');

test('configurable device added', async () => {
  const configurePrinterDeferred = deferred<boolean>();
  mockOf(configurePrinterFromDevice).mockReturnValueOnce(
    configurePrinterDeferred.promise,
  );

  const observable = new Subject<Iterable<KioskBrowser.Device>>();
  const config = {
    printerName: 'VxPrinter',
    printers: [],
  };
  const addedDevice = fakeDevice();

  // Set up autoconfigure.
  const autoconfigure = autoconfigurePrinter(config, observable);
  const callback = jest.fn();
  autoconfigure.subscribe({
    next: callback,
  });

  // Device added.
  observable.next([addedDevice]);
  expect(callback).not.toHaveBeenCalled();

  // We try to configure it.
  expect(configurePrinterFromDevice).toHaveBeenCalledWith(config, addedDevice);

  // Configuration succeeded.
  configurePrinterDeferred.resolve(true);
  await configurePrinterDeferred.promise;

  // Output observable yields on success.
  expect(callback).toHaveBeenCalledTimes(1);
});

test('unconfigurable device added', async () => {
  const configurePrinterDeferred = deferred<boolean>();
  mockOf(configurePrinterFromDevice).mockReturnValueOnce(
    configurePrinterDeferred.promise,
  );

  const observable = new Subject<Iterable<KioskBrowser.Device>>();
  const config = {
    printerName: 'VxPrinter',
    printers: [],
  };
  const addedDevice = fakeDevice();

  // Set up autoconfigure.
  const autoconfigure = autoconfigurePrinter(config, observable);
  const callback = jest.fn();
  autoconfigure.subscribe({
    next: callback,
  });

  // Device added.
  observable.next([addedDevice]);
  expect(callback).not.toHaveBeenCalled();

  // We try to configure it.
  expect(configurePrinterFromDevice).toHaveBeenCalledWith(config, addedDevice);

  // Configuration failed.
  configurePrinterDeferred.resolve(false);
  await configurePrinterDeferred.promise;

  // Output observable does not yield on failure.
  expect(callback).not.toHaveBeenCalled();
});
