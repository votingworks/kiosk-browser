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

class Kiosk {
  public async print(deviceName?: string): Promise<void> {
    await ipcRenderer.invoke(printChannel, deviceName)
  }

  public async getBatteryInfo(): Promise<BatteryInfo> {
    return ipcRenderer.invoke(getBatteryInfoChannel)
  }

  public async getPrinterInfo(): Promise<PrinterInfo[]> {
    return ipcRenderer.invoke(getPrinterInfoChannel)
  }
}

;(window as typeof window & { kiosk: Kiosk }).kiosk = new Kiosk()
