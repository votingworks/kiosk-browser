import { IpcRenderer } from 'electron';
import { Observable } from 'rxjs';
import { channel as managePrinterSubscriptionChannel } from '../ipc/printer-subscription';
import buildIpcMainForwardingObservable from './buildIpcMainForwardingObservable';
import { PrinterInfo } from '../ipc/get-printer-info';

/**
 * Build a new observable that yields the current set of printers.
 */
const buildDevicesObservable = (
  ipcRenderer: IpcRenderer,
): Observable<Iterable<PrinterInfo>> =>
  buildIpcMainForwardingObservable<Iterable<PrinterInfo>>(
    ipcRenderer,
    managePrinterSubscriptionChannel,
  );

export default buildDevicesObservable;
