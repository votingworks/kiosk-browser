import { IpcMainInvokeEvent, WebContents } from 'electron'
import { from, merge, Observable, Subscription } from 'rxjs'
import { map, switchMap, tap } from 'rxjs/operators'
import { RegisterIpcHandler } from '..'
import { debug } from '../utils/printing'
import { getPrinterInfo, PrinterInfo } from './get-printer-info'
import { PrinterInfo as ElectronPrinterInfo } from 'electron'

export const channel = 'printer-subscription'

export function buildPrinterObserver(
  getPrinters: () => ElectronPrinterInfo[],
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
  ).pipe(switchMap(() => from(getPrinterInfo(getPrinters()))))
}

/**
 * Subscribe to list of printers.
 */
const register: RegisterIpcHandler = (
  ipcMain,
  { changedDevices, autoconfiguredPrinter },
) => {
  const subscriptions = new Map<WebContents, Subscription>()

  ipcMain.handle(
    channel,
    (event: IpcMainInvokeEvent, { subscribe }: { subscribe: boolean }) => {
      const webContents = event.sender
      const subscription = subscriptions.get(webContents)

      // Always remove the old subscription as there's only one per WebContents.
      debug('unsubscribe', subscriptions.has(webContents), {
        subscribe,
      })
      subscription?.unsubscribe()

      if (subscribe) {
        const subscription = buildPrinterObserver(
          () => webContents.getPrinters(),
          changedDevices.pipe(
            // erase device info, we only care about the event
            map(() => undefined),
          ),
          autoconfiguredPrinter,
        ).subscribe(printers => {
          debug('sending printers to subscriber: %O', printers)
          webContents.send(channel, printers)
        })

        subscriptions.set(webContents, subscription)
        webContents.on('destroyed', () => {
          subscription.unsubscribe()
          subscriptions.delete(webContents)
        })
      } else if (!subscribe) {
        subscriptions.delete(webContents)
      }
    },
  )
}

export default register
