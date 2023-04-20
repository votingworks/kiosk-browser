import makeDebug from 'debug';
import {
  contextBridge,
  ipcRenderer,
  OpenDialogOptions,
  OpenDialogReturnValue,
} from 'electron';
import { MakeDirectoryOptions } from 'fs';
import { channel as cancelSpeakChannel } from './ipc/cancel-speak';
import { channel as setClockChannel } from './ipc/clock';
import { channel as showOpenDialogChannel } from './ipc/show-open-dialog';
import {
  channel as fileSystemGetEntriesChannel,
  FileSystemEntry,
} from './ipc/file-system-get-entries';
import { channel as fileSystemMakeDirectoryChannel } from './ipc/file-system-make-directory';
import { channel as fileSystemReadFileChannel } from './ipc/file-system-read-file';
import {
  BatteryInfo,
  channel as getBatteryInfoChannel,
} from './ipc/get-battery-info';
import { channel as getPrinterInfoChannel } from './ipc/get-printer-info';
import { channel as getUsbDriveInfoChannel } from './ipc/get-usb-drive-info';
import { channel as logChannel } from './ipc/log';
import { channel as mountUsbDriveChannel } from './ipc/mount-usb-drive';
import { channel as prepareBootUsbChannel } from './ipc/prepare-boot-usb';
import { channel as printChannel } from './ipc/print';
import { channel as printToPDFChannel } from './ipc/printToPDF';
import { channel as quitChannel } from './ipc/quit';
import { channel as rebootChannel } from './ipc/reboot';
import { channel as rebootToBiosChannel } from './ipc/reboot-to-bios';
import { channel as powerDownChannel } from './ipc/power-down';
import { PromptToSaveOptions } from './ipc/saveAs';
import { channel as signChannel, SignParams } from './ipc/sign';
import { channel as storageClearChannel } from './ipc/storage-clear';
import { channel as storageGetChannel } from './ipc/storage-get';
import { channel as storageRemoveChannel } from './ipc/storage-remove';
import { channel as storageSetChannel } from './ipc/storage-set';
import { channel as totpGetChannel, TotpInfo } from './ipc/totp-get';
import { channel as unmountUsbDriveChannel } from './ipc/unmount-usb-drive';
import { channel as formatUsbDriveChannel } from './ipc/format-usb-drive';
import { channel as speakChannel, Options as SpeakOptions } from './ipc/speak';
import { channel as syncUsbDriveChannel } from './ipc/sync-usb-drive';
import { channel as captureScreenshotChannel } from './ipc/capture-screenshot';

import buildDevicesObservable from './utils/buildDevicesObservable';
import buildPrinterInfoObservable from './utils/buildPrinterInfoObservable';
import { FileWriter, fromPath, fromPrompt } from './utils/FileWriter';

const debug = makeDebug('kiosk-browser:client');

function toDate(dateOrString: Date | string): Date {
  return typeof dateOrString === 'string'
    ? new Date(dateOrString)
    : dateOrString;
}

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

    async getUsbDriveInfo(): Promise<KioskBrowser.UsbDriveInfo[]> {
      debug('forwarding `getUsbDriveInfo` to main process');
      return (await ipcRenderer.invoke(
        getUsbDriveInfoChannel,
      )) as KioskBrowser.UsbDriveInfo[];
    },

    async mountUsbDrive(device: string): Promise<void> {
      debug('forwarding `mountUsbDrive` to main process');
      await ipcRenderer.invoke(mountUsbDriveChannel, device);
    },

    async unmountUsbDrive(): Promise<void> {
      debug('forwarding `unmountUsbDrive` to main process');
      await ipcRenderer.invoke(unmountUsbDriveChannel);
    },

    async formatUsbDrive(
      device: string,
      options: KioskBrowser.FormatUsbOptions,
    ): Promise<void> {
      debug('forwarding `formatUsbDrive` to main process');
      await ipcRenderer.invoke(formatUsbDriveChannel, device, options);
    },

    async syncUsbDrive(mountPoint: string): Promise<void> {
      debug('forwarding `syncUsbDrive` to main process');
      await ipcRenderer.invoke(syncUsbDriveChannel, mountPoint);
    },

    async getFileSystemEntries(path: string): Promise<FileSystemEntry[]> {
      debug('forwarding `getFileSystemEntries` to main process');
      const result = (await ipcRenderer.invoke(
        fileSystemGetEntriesChannel,
        path,
      )) as FileSystemEntry[];
      return result.map((entry) => ({
        ...entry,
        mtime: toDate(entry.mtime),
        atime: toDate(entry.atime),
        ctime: toDate(entry.ctime),
      }));
    },

    readFile: (async (...args: unknown[]): Promise<Uint8Array | string> => {
      debug('forwarding `readFile` to main process');
      return (await ipcRenderer.invoke(fileSystemReadFileChannel, ...args)) as
        | Uint8Array
        | string;
    }) as KioskBrowser.Kiosk['readFile'],

    writeFile: (async (
      path: string,
      content?: Uint8Array | string,
    ): Promise<FileWriter | void> => {
      debug('forwarding `writeFile` to main process');
      const writer = await fromPath(path);

      if (typeof content !== 'undefined') {
        await writer.write(content);
        await writer.end();
      } else {
        return writer;
      }
    }) as KioskBrowser.Kiosk['writeFile'],

    async makeDirectory(
      path: string,
      options: MakeDirectoryOptions = {},
    ): Promise<void> {
      debug('forwarding `makeDirectory` to main process');
      await ipcRenderer.invoke(fileSystemMakeDirectoryChannel, path, options);
    },

    storage: {
      async set(key: string, value: object): Promise<void> {
        debug('forwarding `storageSet` to main process');
        await ipcRenderer.invoke(storageSetChannel, key, value);
      },

      async get<T extends object>(key: string): Promise<T | undefined> {
        debug('forwarding `storageGet` to main process');
        return (await ipcRenderer.invoke(storageGetChannel, key)) as
          | T
          | undefined;
      },

      async remove(key: string): Promise<void> {
        debug('forwarding `storageRemove` to main process');
        await ipcRenderer.invoke(storageRemoveChannel, key);
      },

      async clear(): Promise<void> {
        debug('forwarding `storageClear` to main process');
        await ipcRenderer.invoke(storageClearChannel);
      },
    },

    async setClock(params: KioskBrowser.SetClockParams): Promise<void> {
      debug('forwarding `setClock` to main process');
      await ipcRenderer.invoke(setClockChannel, params);
    },

    totp: {
      async get(): Promise<TotpInfo | undefined> {
        debug('forwarding `totp.get` to main process');
        return (await ipcRenderer.invoke(totpGetChannel)) as
          | TotpInfo
          | undefined;
      },
    },

    async sign(params: SignParams): Promise<string> {
      debug('forwarding `sign` to main process');
      return (await ipcRenderer.invoke(signChannel, params)) as string;
    },

    async speak(utterance: string, options: SpeakOptions): Promise<void> {
      debug('forwarding `speak` to main process');
      await ipcRenderer.invoke(speakChannel, utterance, options);
    },

    async cancelSpeak(): Promise<void> {
      debug('forwarding `cancelSpeak` to main process');
      await ipcRenderer.invoke(cancelSpeakChannel);
    },

    async prepareToBootFromUsb(): Promise<boolean> {
      debug('forwarding `prepareToBootFromUsb` to main process');
      return (await ipcRenderer.invoke(prepareBootUsbChannel)) as boolean;
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

    async reboot(): Promise<void> {
      debug('forwarding `reboot` to the main process');
      await ipcRenderer.invoke(rebootChannel);
    },

    async rebootToBios(): Promise<void> {
      debug('forwarding `rebootToBios` to the main process');
      await ipcRenderer.invoke(rebootToBiosChannel);
    },

    async powerDown(): Promise<void> {
      debug('forwarding `powerDown` to the main process');
      await ipcRenderer.invoke(powerDownChannel);
    },

    async captureScreenshot(): Promise<Buffer> {
      debug('forwarding `captureScreenshot` to the main process');
      return (await ipcRenderer.invoke(captureScreenshotChannel)) as Buffer;
    },
  };
}

debug('setting up window.kiosk');
contextBridge.exposeInMainWorld('kiosk', makeKiosk());
