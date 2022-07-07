import { IpcMainInvokeEvent, WebContents } from 'electron';
import { from, merge, Observable, of, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { RegisterIpcHandler } from '..';
import { debug } from '../utils/printing';
import { getPrinterInfo, PrinterInfo } from './get-printer-info';
import { PrinterInfo as ElectronPrinterInfo } from 'electron';

export const channel = 'printer-subscription';

export function buildPrinterObserver(
  getPrinters: () => Promise<ElectronPrinterInfo[]>,
  onDevicesChange: Observable<void>,
  onPrinterConfigure: Observable<void>,
): Observable<PrinterInfo[]> {
  return merge(
    onDevicesChange.pipe(
      tap(() => debug('devices changed, checking printers')),
    ),
    onPrinterConfigure.pipe(
      tap(() => debug('printer configured, checking printers')),
    ),
  ).pipe(
    switchMap(() => from(getPrinters())),
    switchMap((printers) => of(getPrinterInfo(printers))),
  );
}

/**
 * Subscribe to list of printers.
 */
const register: RegisterIpcHandler = (
  ipcMain,
  { changedDevices, autoconfiguredPrinter },
) => {
  debug('registering handler with channel: %s', channel);
  const subscriptions = new Map<WebContents, Subscription>();

  ipcMain.handle(
    channel,
    (event: IpcMainInvokeEvent, { subscribe }: { subscribe: boolean }) => {
      debug(
        'handling request to subscribe/unsubscribe: subscribe=%s',
        subscribe,
      );
      const webContents = event.sender;
      const subscription = subscriptions.get(webContents);

      // Always remove the old subscription as there's only one per WebContents.
      debug('unsubscribe', subscriptions.has(webContents), {
        subscribe,
      });
      subscription?.unsubscribe();

      if (subscribe) {
        const subscription = buildPrinterObserver(
          () => webContents.getPrintersAsync(),
          changedDevices.pipe(
            // erase device info, we only care about the event
            map(() => undefined),
          ),
          autoconfiguredPrinter,
        ).subscribe((printers) => {
          debug('sending printers to subscriber: %O', printers);
          webContents.send(channel, printers);
        });

        subscriptions.set(webContents, subscription);
        webContents.on('destroyed', () => {
          subscription.unsubscribe();
          subscriptions.delete(webContents);
        });
      } else if (!subscribe) {
        subscriptions.delete(webContents);
      }
    },
  );
};

export default register;
