import { ipcRenderer } from 'electron'
import { channel as printChannel } from './ipc/print'

class Kiosk {
  public async print(): Promise<void> {
    await ipcRenderer.invoke(printChannel)
  }
}

;(window as typeof window & { kiosk: Kiosk }).kiosk = new Kiosk()
