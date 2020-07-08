import makeDebug from 'debug'
import { ipcRenderer } from 'electron'
import { KioskBrowser } from '../types/kiosk-window'
import {
  BatteryInfo,
  channel as getBatteryInfoChannel,
} from './ipc/get-battery-info'
import {
  channel as getPrinterInfoChannel,
  PrinterInfo,
} from './ipc/get-printer-info'
import { channel as getUsbDrivesChannel, UsbDrive } from './ipc/get-usb-drives'
import { channel as mountUsbDriveChannel } from './ipc/mount-usb-drive'
import { channel as unmountUsbDriveChannel } from './ipc/unmount-usb-drive'
import { channel as storageSetChannel } from './ipc/storage-set'
import { channel as storageGetChannel } from './ipc/storage-get'
import { channel as storageRemoveChannel } from './ipc/storage-remove'
import { channel as storageClearChannel } from './ipc/storage-clear'
import { channel as printChannel } from './ipc/print'
import { channel as printToPDFChannel } from './ipc/printToPDF'
import { channel as quitChannel } from './ipc/quit'
import buildDevicesObservable from './utils/buildDevicesObservable'
import FileWriter from './utils/FileWriter'

const debug = makeDebug('kiosk-browser:client')

class Kiosk implements KioskBrowser.Kiosk {
  public async print(deviceName?: string, paperSource?: string): Promise<void> {
    debug(
      'forwarding `print(deviceName: %s, paperSource: %s)` to main process',
      deviceName,
      paperSource,
    )

    // NOTE: This check ensures we don't silently fail printing.
    //
    // This is here because we can't simply add `deviceName` as an argument
    // when it's undefined. Doing so makes electron coerce it to null for IPC.
    // Passing null means that default params will not be used, and null will
    // make its way into `WebContents#print` as the `deviceName` option. This
    // may get coerced into "null" or it may simply be declared invalid, and
    // the print operation will fail. If we do want to use the default printer,
    // we need to omit `deviceName` or use an empty string per the Electron
    // docs.
    //
    // https://www.electronjs.org/docs/api/web-contents#contentsprintoptions-callback
    // https://github.com/chromium/chromium/blob/4189e014e00fc9a147c7162e0cac1f699d37f33f/printing/backend/print_backend_cups.cc#L301-L303
    //
    if (typeof paperSource === 'string' && typeof deviceName === 'string') {
      await ipcRenderer.invoke(printChannel, deviceName, paperSource)
    } else if (typeof deviceName === 'string') {
      await ipcRenderer.invoke(printChannel, deviceName)
    } else {
      await ipcRenderer.invoke(printChannel)
    }
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

  public async mountUsbDrive(device: string): Promise<void> {
    debug('forwarding `mountUsbDrive` to main process')
    return ipcRenderer.invoke(mountUsbDriveChannel, device)
  }

  public async unmountUsbDrive(device: string): Promise<void> {
    debug('forwarding `unmountUsbDrive` to main process')
    return ipcRenderer.invoke(unmountUsbDriveChannel, device)
  }

  public async storageSet(key: string, value: object): Promise<void> {
    debug('forwarding `storageSet` to main process')
    return ipcRenderer.invoke(storageSetChannel, key, value)
  }

  public async storageGet(key: string): Promise<object> {
    debug('forwarding `storageGet` to main process')
    return ipcRenderer.invoke(storageGetChannel, key)
  }

  public async storageRemove(key: string): Promise<void> {
    debug('forwarding `storageRemove` to main process')
    return ipcRenderer.invoke(storageRemoveChannel, key)
  }

  public async storageClear(): Promise<void> {
    debug('forwarding `storageClear` to main process')
    return ipcRenderer.invoke(storageClearChannel)
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

  public async saveAs(): Promise<FileWriter | undefined> {
    return await FileWriter.fromPrompt()
  }

  public quit(): void {
    debug('forwarding `quit` to main process')
    ipcRenderer.invoke(quitChannel)
  }
}

debug('setting up window.kiosk')
window.kiosk = new Kiosk()
