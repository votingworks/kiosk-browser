import { Observable } from 'rxjs'
import { Device } from 'usb-detection'
import { BatteryInfo } from '../src/ipc/get-battery-info'
import { PrinterInfo } from '../src/ipc/get-printer-info'
import { PromptToSaveOptions } from '../src/ipc/saveAs'
import { FileWriter } from '../src/utils/FileWriter'

declare namespace KioskBrowser {
  interface PrintOptions {
    deviceName?: string
    paperSource?: string
    copies?: number
  }

  interface SetClockParams {
    isoDatetime: string
    IANAZone: string
  }

  type PrintSides =
    /**
     * One page per sheet, aka simplex or "Duplex=None".
     */
    | 'one-sided'

    /**
     * Two pages per sheet, aka "Duplex=DuplexNoTumble". This option prints such
     * that a right-side up portrait sheet flipped over on the long edge remains
     * right-side up, i.e. a regular left-to-right book.
     */
    | 'two-sided-long-edge'

    /**
     * Two pages per sheet, aka "Duplex=DuplexTumble". This option prints such
     * that a right-side up portrait sheet flipped over on the short edge remains
     * right-side up, i.e. a bound-at-the-top ring binder.
     */
    | 'two-sided-short-edge'

  interface Kiosk {
    getBatteryInfo(): Promise<BatteryInfo | undefined>
    getPrinterInfo(): Promise<PrinterInfo[]>
    devices: Observable<Iterable<Device>>
    print(options?: KioskBrowser.PrintOptions): Promise<void>
    print(
      deviceName?: string,
      paperSource?: string,
      copies?: number,
      sides?: PrintSides,
    ): Promise<void>
    saveAs(options?: PromptToSaveOptions): Promise<FileWriter | undefined>
    setClock(params: SetClockParams): Promise<void>
    quit(): void
  }
}

declare global {
  interface Window {
    kiosk?: KioskBrowser.Kiosk
  }
}
