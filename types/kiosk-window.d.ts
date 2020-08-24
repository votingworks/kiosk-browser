import { Observable } from 'rxjs'
import { Device } from 'usb-detection'
import { BatteryInfo } from '../src/ipc/get-battery-info'
import { PrinterInfo } from '../src/ipc/get-printer-info'
import { PromptToSaveOptions } from '../src/ipc/saveAs'
import FileWriter from '../src/utils/FileWriter'

declare namespace KioskBrowser {
  interface PrintOptions {
    deviceName?: string
    paperSource?: string
    copies?: number
  }

  interface Kiosk {
    getBatteryInfo(): Promise<BatteryInfo>
    getPrinterInfo(): Promise<PrinterInfo[]>
    devices: Observable<Iterable<Device>>
    print(options?: KioskBrowser.PrintOptions): Promise<void>
    print(
      deviceName?: string,
      paperSource?: string,
      copies?: number,
    ): Promise<void>
    saveAs(options?: PromptToSaveOptions): Promise<FileWriter | undefined>
    quit(): void
  }
}

declare global {
  interface Window {
    kiosk?: KioskBrowser.Kiosk
  }
}
