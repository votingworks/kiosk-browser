import { remote, ipcRenderer, IpcRendererEvent } from 'electron'
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
import { Device } from 'usb-detection'
import {
  channel as manageDeviceSubscriptionChannel,
  ChangeType,
  deviceChangeChannel,
} from './ipc/manage-device-subscription'

type DeviceChangeListener = (changeType: ChangeType, device: Device) => void

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

  private _onDeviceChange?: DeviceChangeListener
  private _onDeviceChangeIpcCallback = (
    event: IpcRendererEvent,
    changeType: ChangeType,
    device: Device,
  ) => {
    this.onDeviceChange?.(changeType, device)
  }

  public get onDeviceChange(): DeviceChangeListener | undefined {
    return this._onDeviceChange
  }

  private _onBrowserWindowClosed = () => {
    ipcRenderer.invoke(manageDeviceSubscriptionChannel, false)
    ipcRenderer.off(deviceChangeChannel, this._onDeviceChangeIpcCallback)
  }

  public set onDeviceChange(onDeviceChange: DeviceChangeListener | undefined) {
    if (!this._onDeviceChange && onDeviceChange) {
      ipcRenderer.invoke(manageDeviceSubscriptionChannel, true)
      remote.getCurrentWindow().on('closed', this._onBrowserWindowClosed)
    } else if (this._onDeviceChange && !onDeviceChange) {
      ipcRenderer.invoke(manageDeviceSubscriptionChannel, false)
      remote.getCurrentWindow().off('closed', this._onBrowserWindowClosed)
    }

    this._onDeviceChange = onDeviceChange
    ipcRenderer.off(deviceChangeChannel, this._onDeviceChangeIpcCallback)

    if (onDeviceChange) {
      ipcRenderer.on(deviceChangeChannel, this._onDeviceChangeIpcCallback)
    }
  }

  public async getDeviceList(): Promise<Device[]> {
    return ipcRenderer.invoke(getDeviceListChannel)
  }
}

;(window as typeof window & { kiosk: Kiosk }).kiosk = new Kiosk()
