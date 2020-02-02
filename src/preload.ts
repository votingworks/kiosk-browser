import { ipcRenderer } from 'electron'
import { channel as printChannel } from './ipc/print'
import {
  BatteryInfo,
  channel as getBatteryInfoChannel,
} from './ipc/get-battery-info'
import {
  PrinterInfo,
  channel as getPrinterInfoChannel,
} from './ipc/get-printer-info'
import { channel as getDeviceListChannel } from './ipc/get-device-list'
import { Device } from './utils/usb'
import DeviceChangeListeners from './utils/DeviceChangeListeners'

class Kiosk {
  public async print(deviceName: string, paperSource: string): Promise<void> {
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

  public async getBatteryInfo(): Promise<BatteryInfo> {
    return ipcRenderer.invoke(getBatteryInfoChannel)
  }

  public async getPrinterInfo(): Promise<PrinterInfo[]> {
    return ipcRenderer.invoke(getPrinterInfoChannel)
  }

  public async getDeviceList(): Promise<Device[]> {
    return ipcRenderer.invoke(getDeviceListChannel)
  }

  public onDeviceChange = new DeviceChangeListeners(ipcRenderer)
}

;(window as typeof window & { kiosk: Kiosk }).kiosk = new Kiosk()
