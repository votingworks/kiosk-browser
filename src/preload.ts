import { ipcRenderer } from 'electron'
import { channel as printChannel } from './ipc/print'
import {
  BatteryInfo,
  channel as getBatteryInfoChannel,
} from './ipc/get-battery-info'
import { channel as ttsChannel, SpeakOptions } from './ipc/tts'

class Kiosk {
  public async print(): Promise<void> {
    await ipcRenderer.invoke(printChannel)
  }

  public async getBatteryInfo(): Promise<BatteryInfo> {
    return ipcRenderer.invoke(getBatteryInfoChannel)
  }

  public tts = {
    async speak(text: string, options?: SpeakOptions): Promise<void> {
      return ipcRenderer.invoke(ttsChannel, 'speak', text, options)
    },

    async cancel(): Promise<void> {
      return ipcRenderer.invoke(ttsChannel, 'cancel')
    },

    async getVoices(): Promise<SpeechSynthesisVoice[]> {
      return ipcRenderer.invoke(ttsChannel, 'getVoices')
    },
  }
}

speechSynthesis.getVoices()
;(window as typeof window & { kiosk: Kiosk }).kiosk = new Kiosk()
