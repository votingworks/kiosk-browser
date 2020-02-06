import DeviceChangeListeners from '../src/utils/DeviceChangeListeners'
import { Device } from 'usb-detection'
import { PrinterInfo } from '../src/ipc/get-printer-info'
import { BatteryInfo } from '../src/ipc/get-battery-info'

declare namespace KioskBrowser {
  interface Kiosk {
    getBatteryInfo(): Promise<BatteryInfo>
    getDeviceList(): Promise<Device[]>
    getPrinterInfo(): Promise<PrinterInfo[]>
    onDeviceChange: DeviceChangeListeners
    print(deviceName: string, paperSource: string): Promise<void>
    quit(): void
  }
}

declare global {
  interface Window {
    kiosk?: KioskBrowser.Kiosk
  }
}
