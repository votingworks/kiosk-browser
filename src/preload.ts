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
import Listeners from './utils/Listeners'

/**
 * Handles listeners for device add/remove events.
 */
class DeviceChangeListeners extends Listeners<[ChangeType, Device]> {
  /**
   * Called when a listener is added, allows us to notice when we have our first
   * listener.
   */
  protected listenerAdded(count: number): void {
    if (count === 1) {
      this.startMonitoringDevices()
    }
  }

  /**
   * Called when a listener is removed, allows us to notice when we have no more
   * listeners.
   */
  protected listenerRemoved(count: number): void {
    if (count === 0) {
      this.stopMonitoringDevices()
    }
  }

  /**
   * Called by the main process whenever a device change happens.
   */
  private onDeviceChangeIpcCallback = (
    event: IpcRendererEvent,
    changeType: ChangeType,
    device: Device,
  ): void => {
    this.trigger(changeType, device)
  }

  /**
   * Starts monitoring connected device add/remove events.
   */
  private startMonitoringDevices(): void {
    ipcRenderer.invoke(manageDeviceSubscriptionChannel, true)
    ipcRenderer.on(deviceChangeChannel, this.onDeviceChangeIpcCallback)
  }

  /**
   * Stops monitoring connected device add/remove events.
   */
  private stopMonitoringDevices(): void {
    ipcRenderer.invoke(manageDeviceSubscriptionChannel, false)
    ipcRenderer.off(deviceChangeChannel, this.onDeviceChangeIpcCallback)
  }
}

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

  public async getDeviceList(): Promise<Device[]> {
    return ipcRenderer.invoke(getDeviceListChannel)
  }

  public onDeviceChange = new DeviceChangeListeners()
}

;(window as typeof window & { kiosk: Kiosk }).kiosk = new Kiosk()
