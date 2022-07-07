import { Subject } from 'rxjs';
import { fakePrinterInfo, fakeElectronPrinter } from '../../test/fakePrinter';
import { fakeIpc, fakeWebContents } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import deferred from '../utils/deferred';
import { Options } from '../utils/options';
import { getPrinterInfo } from './get-printer-info';
import register, {
  buildPrinterObserver,
  channel as printerSubscriptionChannel,
} from './printer-subscription';

jest.mock('./get-printer-info');

const getPrinterInfoMock = mockOf(getPrinterInfo);

test('printer observer triggers on devices change', async () => {
  const onDevicesChange = new Subject<void>();
  const onPrinterConfigure = new Subject<void>();
  const electronPrinter = fakeElectronPrinter();
  const printer = fakePrinterInfo(electronPrinter);
  const callback = jest.fn();
  buildPrinterObserver(
    () => Promise.resolve([electronPrinter]),
    onDevicesChange,
    onPrinterConfigure,
  ).subscribe(callback);
  expect(callback).not.toHaveBeenCalled();

  // Trigger change and wait for promises.
  getPrinterInfoMock.mockReturnValueOnce([printer]);
  onDevicesChange.next();

  // wait for promises to resolve twice, once for each `switchMap/from`
  await Promise.resolve();
  await Promise.resolve();

  expect(callback).toHaveBeenCalledWith([printer]);
});

test('printer observer triggers on printer configure', async () => {
  const onDevicesChange = new Subject<void>();
  const onPrinterConfigure = new Subject<void>();
  const electronPrinter = fakeElectronPrinter();
  const printer = fakePrinterInfo(electronPrinter);
  const callback = jest.fn();
  buildPrinterObserver(
    () => Promise.resolve([electronPrinter]),
    onDevicesChange,
    onPrinterConfigure,
  ).subscribe(callback);
  expect(callback).not.toHaveBeenCalled();

  // Trigger change and wait for promises.
  getPrinterInfoMock.mockReturnValueOnce([printer]);
  onPrinterConfigure.next();

  // wait for promises to resolve twice, once for each `switchMap/from`
  await Promise.resolve();
  await Promise.resolve();

  expect(callback).toHaveBeenCalledWith([printer]);
});

test('printer observer triggers multiple times', async () => {
  const onDevicesChange = new Subject<void>();
  const onPrinterConfigure = new Subject<void>();
  const electronPrinter = fakeElectronPrinter();
  const printer = fakePrinterInfo(electronPrinter);
  const callback = jest.fn();
  buildPrinterObserver(
    () => Promise.resolve([electronPrinter]),
    onDevicesChange,
    onPrinterConfigure,
  ).subscribe(callback);
  expect(callback).not.toHaveBeenCalled();

  // Trigger change and wait for promises.
  getPrinterInfoMock.mockReturnValueOnce([printer]);
  onDevicesChange.next();

  // wait for promises to resolve twice, once for each `switchMap/from`
  await Promise.resolve();
  await Promise.resolve();

  // Trigger change and wait for promises.
  getPrinterInfoMock.mockReturnValueOnce([printer]);
  onPrinterConfigure.next();

  // wait for promises to resolve twice, once for each `switchMap/from`
  await Promise.resolve();
  await Promise.resolve();

  expect(callback).toHaveBeenNthCalledWith(1, [printer]);
  expect(callback).toHaveBeenNthCalledWith(2, [printer]);
});

test('registering a subscription handler hooks up to both USB devices and autoconfigured printers', async () => {
  const webContents = fakeWebContents({
    getPrintersAsync: jest.fn().mockResolvedValue([]),
    send: jest.fn(),
  });
  const { ipcMain, ipcRenderer } = fakeIpc(webContents);
  const changedDevices = new Subject<Iterable<KioskBrowser.Device>>();
  const autoconfiguredPrinter = new Subject<void>();
  const options: Options = {
    url: new URL('about:blank'),
    originFilePermissions: [],
  };
  const printer = fakePrinterInfo();

  const { resolve, promise } = deferred<void>();
  register(ipcMain, { changedDevices, autoconfiguredPrinter, options });
  await ipcRenderer.invoke(printerSubscriptionChannel, { subscribe: true });

  expect(webContents.send).not.toHaveBeenCalled();
  getPrinterInfoMock.mockImplementation(() => {
    resolve();
    return [printer];
  });

  // Trigger device change and wait.
  changedDevices.next([]);

  // wait for promises to resolve twice, once for each `switchMap/from`
  await promise;
  await promise;

  expect(webContents.send).toHaveBeenCalledWith(printerSubscriptionChannel, [
    printer,
  ]);
});

test('unsubscribe', async () => {
  const webContents = fakeWebContents({
    getPrintersAsync: jest.fn().mockResolvedValue([]),
    send: jest.fn(),
  });
  const { ipcMain, ipcRenderer } = fakeIpc(webContents);
  const changedDevices = new Subject<Iterable<KioskBrowser.Device>>();
  const autoconfiguredPrinter = new Subject<void>();
  const options: Options = {
    url: new URL('about:blank'),
    originFilePermissions: [],
  };
  const printer = fakePrinterInfo();

  const { resolve, promise } = deferred<void>();
  register(ipcMain, { changedDevices, autoconfiguredPrinter, options });
  await ipcRenderer.invoke(printerSubscriptionChannel, { subscribe: true });
  await ipcRenderer.invoke(printerSubscriptionChannel, { subscribe: false });

  getPrinterInfoMock.mockImplementationOnce(() => {
    resolve();
    return [printer];
  });

  // Trigger device change and wait.
  changedDevices.next([]);
  await Promise.race([
    promise,
    new Promise((resolve) => setTimeout(resolve, 10)),
  ]);

  expect(webContents.send).not.toHaveBeenCalled();
});

test('unsubscribe on webContents teardown', async () => {
  const webContents = fakeWebContents({
    getPrintersAsync: jest.fn().mockResolvedValue([]),
    send: jest.fn(),
  });
  const { ipcMain, ipcRenderer } = fakeIpc(webContents);
  const changedDevices = new Subject<Iterable<KioskBrowser.Device>>();
  const autoconfiguredPrinter = new Subject<void>();
  const options: Options = {
    url: new URL('about:blank'),
    originFilePermissions: [],
  };
  const printer = fakePrinterInfo();

  const { resolve, promise } = deferred<void>();
  register(ipcMain, { changedDevices, autoconfiguredPrinter, options });
  await ipcRenderer.invoke(printerSubscriptionChannel, { subscribe: true });

  // Trigger unsubscribe.
  webContents.emit('destroyed');

  getPrinterInfoMock.mockImplementationOnce(() => {
    resolve();
    return [printer];
  });

  // Trigger device change and wait.
  changedDevices.next([]);
  await Promise.race([
    promise,
    new Promise((resolve) => setTimeout(resolve, 10)),
  ]);

  expect(webContents.send).not.toHaveBeenCalled();
});
