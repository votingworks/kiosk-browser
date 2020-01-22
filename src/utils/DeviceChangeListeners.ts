import Listeners from './Listeners'
import { Device } from './usb'
import { IpcRendererEvent, IpcRenderer } from 'electron'
import {
  channel as manageDeviceSubscriptionChannel,
  ChangeType,
  deviceChangeChannel,
} from '../ipc/manage-device-subscription'

/**
 * Handles listeners for device add/remove events.
 */
export default class DeviceChangeListeners extends Listeners<
  [ChangeType, Device]
> {
  public constructor(private ipcRenderer: IpcRenderer) {
    super()
  }

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
    this.ipcRenderer.invoke(manageDeviceSubscriptionChannel, true)
    this.ipcRenderer.on(deviceChangeChannel, this.onDeviceChangeIpcCallback)
  }

  /**
   * Stops monitoring connected device add/remove events.
   */
  private stopMonitoringDevices(): void {
    this.ipcRenderer.invoke(manageDeviceSubscriptionChannel, false)
    this.ipcRenderer.off(deviceChangeChannel, this.onDeviceChangeIpcCallback)
  }
}
