import { IpcRenderer } from 'electron';
import { channel as printerSubscriptionChannel } from '../ipc/printer-subscription';
import { PrinterInfo } from '../ipc/get-printer-info';
import buildIpcMainForwardingObservable from './buildIpcMainForwardingObservable';

/**
 * Build a new observable that yields the current set of printers.
 */
const buildPrinterInfoObservable = (
  ipcRenderer: IpcRenderer,
): KioskBrowser.Observable<Iterable<PrinterInfo>> =>
  buildIpcMainForwardingObservable<Iterable<PrinterInfo>>(
    ipcRenderer,
    printerSubscriptionChannel,
  );

export default buildPrinterInfoObservable;
