import makeDebug from 'debug'
import { ipcRenderer } from 'electron'
import { MakeDirectoryOptions } from 'fs'
import { KioskBrowser } from '../types/kiosk-window'
import { channel as setClock } from './ipc/clock'
import {
  channel as fileSystemGetEntriesChannel,
  FileSystemEntry,
  FileSystemEntryType,
} from './ipc/file-system-get-entries'
import { channel as fileSystemMakeDirectory } from './ipc/file-system-make-directory'
import { channel as fileSystemReadFileChannel } from './ipc/file-system-read-file'
import {
  BatteryInfo,
  channel as getBatteryInfoChannel,
} from './ipc/get-battery-info'
import {
  channel as getPrinterInfoChannel,
  PrinterInfo,
} from './ipc/get-printer-info'
import { channel as getUsbDrivesChannel, UsbDrive } from './ipc/get-usb-drives'
import {
  channel as mountUsbDriveChannel,
  Options as MountUsbDriveOptions,
} from './ipc/mount-usb-drive'
import { channel as printChannel } from './ipc/print'
import { channel as printToPDFChannel } from './ipc/printToPDF'
import { channel as quitChannel } from './ipc/quit'
import { PromptToSaveOptions } from './ipc/saveAs'
import { channel as storageClearChannel } from './ipc/storage-clear'
import { channel as storageGetChannel } from './ipc/storage-get'
import { channel as storageRemoveChannel } from './ipc/storage-remove'
import { channel as storageSetChannel } from './ipc/storage-set'
import { channel as unmountUsbDriveChannel } from './ipc/unmount-usb-drive'
import { channel as totpGetChannel, TotpInfo } from './ipc/totp-get'
import { channel as signChannel, SignParams } from './ipc/sign'
import buildDevicesObservable from './utils/buildDevicesObservable'
import buildPrinterInfoObservable from './utils/buildPrinterInfoObservable'
import { FileWriter, fromPath, fromPrompt } from './utils/FileWriter'

const debug = makeDebug('kiosk-browser:client')

function toDate(dateOrString: Date | string): Date {
  return typeof dateOrString === 'string'
    ? new Date(dateOrString)
    : dateOrString
}

class Kiosk implements KioskBrowser.Kiosk {
  public async print(options?: KioskBrowser.PrintOptions): Promise<void>
  public async print(
    deviceName?: string,
    paperSource?: string,
    copies?: number,
  ): Promise<void>
  public async print(
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
        : deviceNameOrOptions ?? {}
    debug('forwarding `print(%o)` to main process', options)

    if (typeof options !== 'undefined' && typeof options !== 'object') {
      throw new TypeError(
        `expected an options object for print, got ${typeof options}`,
      )
    }

    await ipcRenderer.invoke(printChannel, options)
  }

  public async printToPDF(): Promise<Uint8Array> {
    debug('forwarding `printToPDF()` to main process')
    return await ipcRenderer.invoke(printToPDFChannel)
  }

  public async getBatteryInfo(): Promise<BatteryInfo> {
    debug('forwarding `getBatteryInfo` to main process')
    return ipcRenderer.invoke(getBatteryInfoChannel)
  }

  public async getPrinterInfo(): Promise<PrinterInfo[]> {
    debug('forwarding `getPrinterInfo` to main process')
    return ipcRenderer.invoke(getPrinterInfoChannel)
  }

  public async getUsbDrives(): Promise<UsbDrive[]> {
    debug('forwarding `getUsbDrives` to main process')
    return ipcRenderer.invoke(getUsbDrivesChannel)
  }

  public async mountUsbDrive(
    optionsOrDevice: string | MountUsbDriveOptions,
  ): Promise<void> {
    debug('forwarding `mountUsbDrive` to main process')
    return ipcRenderer.invoke(
      mountUsbDriveChannel,
      typeof optionsOrDevice === 'string'
        ? { device: optionsOrDevice }
        : optionsOrDevice,
    )
  }

  public async unmountUsbDrive(device: string): Promise<void> {
    debug('forwarding `unmountUsbDrive` to main process')
    return ipcRenderer.invoke(unmountUsbDriveChannel, device)
  }

  public FileSystemEntryType = FileSystemEntryType

  public async getFileSystemEntries(path: string): Promise<FileSystemEntry[]> {
    debug('forwarding `getFileSystemEntries` to main process')
    const result: FileSystemEntry[] = await ipcRenderer.invoke(
      fileSystemGetEntriesChannel,
      path,
    )
    return result.map(entry => ({
      ...entry,
      mtime: toDate(entry.mtime),
      atime: toDate(entry.atime),
      ctime: toDate(entry.ctime),
    }))
  }

  public async readFile(path: string): Promise<Buffer>
  public async readFile(path: string, encoding: string): Promise<string>
  public async readFile(...args: unknown[]): Promise<Buffer | string> {
    debug('forwarding `readFile` to main process')
    return ipcRenderer.invoke(fileSystemReadFileChannel, ...args)
  }

  public async writeFile(path: string): Promise<FileWriter>
  public async writeFile(path: string, content: Buffer | string): Promise<void>
  public async writeFile(
    path: string,
    content?: Buffer | string,
  ): Promise<FileWriter | void> {
    debug('forwarding `writeFile` to main process')
    const writer = await fromPath(path)

    if (typeof content !== 'undefined') {
      await writer.write(content)
      await writer.end()
    } else {
      return writer
    }
  }

  public async makeDirectory(
    path: string,
    options: MakeDirectoryOptions = {},
  ): Promise<void> {
    debug('forwarding `makeDirectory` to main process')
    return ipcRenderer.invoke(fileSystemMakeDirectory, path, options)
  }

  public storage = {
    async set(key: string, value: object): Promise<void> {
      debug('forwarding `storageSet` to main process')
      return ipcRenderer.invoke(storageSetChannel, key, value)
    },

    async get<T extends object>(key: string): Promise<T | undefined> {
      debug('forwarding `storageGet` to main process')
      return await ipcRenderer.invoke(storageGetChannel, key)
    },

    async remove(key: string): Promise<void> {
      debug('forwarding `storageRemove` to main process')
      return ipcRenderer.invoke(storageRemoveChannel, key)
    },

    async clear(): Promise<void> {
      debug('forwarding `storageClear` to main process')
      return ipcRenderer.invoke(storageClearChannel)
    },
  }

  public async setClock(params: KioskBrowser.SetClockParams): Promise<void> {
    debug('forwarding `setClock` to main process')
    return ipcRenderer.invoke(setClock, params)
  }

  public totp = {
    async get(): Promise<TotpInfo | undefined> {
      debug('forwarding `totp.get` to main process')
      return await ipcRenderer.invoke(totpGetChannel)
    },
  }

  public async sign(params: SignParams): Promise<string> {
    debug('forwarding `sign` to main process')
    return await ipcRenderer.invoke(signChannel, params)
  }

  /**
   * Gets an observable that yields the current set of connected USB devices as
   * devices are added and removed.
   *
   * Given a set of initial devices (e.g. {mouse, keyboard}), a subscriber would
   * receive the initial set. Once a new device is added (e.g. flash drive), that
   * first subscriber receives a new set (e.g. {mouse, keyboard, flash drive}).
   * New subscribers immediately receive the same current set.
   */
  public devices = buildDevicesObservable(ipcRenderer)

  /**
   * Gets an observable that yields the current printer info whenever a printer
   * is added or removed.
   */
  public printers = buildPrinterInfoObservable(ipcRenderer)

  public async saveAs(
    options?: PromptToSaveOptions,
  ): Promise<FileWriter | undefined> {
    return await fromPrompt(options)
  }

  public quit(): void {
    debug('forwarding `quit` to main process')
    ipcRenderer.invoke(quitChannel)
  }
}

debug('setting up window.kiosk')
window.kiosk = new Kiosk()
