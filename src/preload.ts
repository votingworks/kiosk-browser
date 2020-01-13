import { ipcRenderer } from 'electron'
import { channel as printChannel } from './ipc/print'
import {
  BatteryInfo,
  channel as getBatteryInfoChannel,
} from './ipc/get-battery-info'

class Kiosk {
  public async print(): Promise<void> {
    await ipcRenderer.invoke(printChannel)
  }

  public async getBatteryInfo(): Promise<BatteryInfo> {
    return ipcRenderer.invoke(getBatteryInfoChannel)
  }
}

;(window as typeof window & { kiosk: Kiosk }).kiosk = new Kiosk()
