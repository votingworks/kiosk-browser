import { Device } from 'usb-detection'
import { Observable } from 'rxjs'
import { PrinterInfo } from '../src/ipc/get-printer-info'
import { BatteryInfo } from '../src/ipc/get-battery-info'

declare namespace KioskBrowser {
  interface Kiosk {
    getBatteryInfo(): Promise<BatteryInfo>
    getPrinterInfo(): Promise<PrinterInfo[]>
    devices: Observable<Iterable<Device>>
    print(deviceName: string, paperSource: string): Promise<void>
    quit(): void
  }
}

declare global {
  interface Window {
    kiosk?: KioskBrowser.Kiosk
  }
}
