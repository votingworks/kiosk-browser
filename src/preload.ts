import makeDebug from 'debug';
import {
  contextBridge,
  ipcRenderer,
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from 'electron';
import { channel as showOpenDialogChannel } from './ipc/show-open-dialog';
import { channel as showSaveDialogChannel } from './ipc/show-save-dialog';
import {
  BatteryInfo,
  channel as getBatteryInfoChannel,
} from './ipc/get-battery-info';
import { channel as getPrinterInfoChannel } from './ipc/get-printer-info';
import { channel as logChannel } from './ipc/log';
import { channel as printChannel } from './ipc/print';
import { channel as printToPDFChannel } from './ipc/printToPDF';
import { channel as quitChannel } from './ipc/quit';
import { PromptToSaveOptions } from './ipc/saveAs';
import { channel as captureScreenshotChannel } from './ipc/capture-screenshot';

import buildDevicesObservable from './utils/buildDevicesObservable';
import buildPrinterInfoObservable from './utils/buildPrinterInfoObservable';
import { FileWriter, fromPrompt } from './utils/FileWriter';

const debug = makeDebug('kiosk-browser:client');

function makeKiosk(): KioskBrowser.Kiosk {
  return {
    async print(
      deviceNameOrOptions?: KioskBrowser.PrintOptions | string,
      paperSource?: string,
      copies?: number,
    ): Promise<void> {
      const options =
        typeof deviceNameOrOptions === 'string'
          ? {
              deviceName: deviceNameOrOptions,
              paperSource,
              copies,
            }
          : deviceNameOrOptions ?? {};
      debug('forwarding `print(%o)` to main process', options);

      if (typeof options !== 'undefined' && typeof options !== 'object') {
        throw new TypeError(
          `expected an options object for print, got ${typeof options}`,
        );
      }

      await ipcRenderer.invoke(printChannel, options);
    },

    async printToPDF(): Promise<Uint8Array> {
      debug('forwarding `printToPDF()` to main process');
      return (await ipcRenderer.invoke(printToPDFChannel)) as Uint8Array;
    },

    async showOpenDialog(
      options?: OpenDialogOptions,
    ): Promise<OpenDialogReturnValue> {
      debug('forwarding `showOpenDialog` to main process');
      return (await ipcRenderer.invoke(
        showOpenDialogChannel,
        options,
      )) as OpenDialogReturnValue;
    },

    async showSaveDialog(
      options?: SaveDialogOptions,
    ): Promise<SaveDialogReturnValue> {
      debug('forwarding `showSaveDialog` to main process');
      return (await ipcRenderer.invoke(
        showSaveDialogChannel,
        options,
      )) as SaveDialogReturnValue;
    },

    async getBatteryInfo(): Promise<BatteryInfo | undefined> {
      debug('forwarding `getBatteryInfo` to main process');
      return (await ipcRenderer.invoke(getBatteryInfoChannel)) as
        | BatteryInfo
        | undefined;
    },

    async getPrinterInfo(): Promise<KioskBrowser.PrinterInfo[]> {
      debug('forwarding `getPrinterInfo` to main process');
      return (await ipcRenderer.invoke(
        getPrinterInfoChannel,
      )) as KioskBrowser.PrinterInfo[];
    },

    async log(message: string): Promise<void> {
      debug('forwarding `log` to the main process');
      await ipcRenderer.invoke(logChannel, message);
    },

    /**
     * Gets an observable that yields the current set of connected USB devices as
     * devices are added and removed.
     *
     * Given a set of initial devices (e.g. {mouse, keyboard}), a subscriber would
     * receive the initial set. Once a new device is added (e.g. flash drive), that
     * first subscriber receives a new set (e.g. {mouse, keyboard, flash drive}).
     * New subscribers immediately receive the same current set.
     */
    devices: buildDevicesObservable(ipcRenderer),

    /**
     * Gets an observable that yields the current printer info whenever a printer
     * is added or removed.
     */
    printers: buildPrinterInfoObservable(ipcRenderer),

    async saveAs(
      options?: PromptToSaveOptions,
    ): Promise<FileWriter | undefined> {
      return await fromPrompt(options);
    },

    quit(exitCode?: number): void {
      debug('forwarding `quit` to main process');
      if (typeof exitCode === 'undefined') {
        void ipcRenderer.invoke(quitChannel);
      } else {
        void ipcRenderer.invoke(quitChannel, exitCode);
      }
    },

    async captureScreenshot(): Promise<Buffer> {
      debug('forwarding `captureScreenshot` to the main process');
      return (await ipcRenderer.invoke(captureScreenshotChannel)) as Buffer;
    },
  };
}

debug('setting up window.kiosk');
contextBridge.exposeInMainWorld('kiosk', makeKiosk());
