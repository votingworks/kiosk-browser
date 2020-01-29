import usbDetection, { Device } from 'usb-detection'
import Listeners from './Listeners'
import { ChangeType } from '../ipc/manage-device-subscription'

function devicesEqual(device: Device, other: Device): boolean {
  return (
    device.deviceAddress === other.deviceAddress &&
    device.deviceName === other.deviceName &&
    device.locationId === other.locationId &&
    device.manufacturer === other.manufacturer &&
    device.productId === other.productId &&
    device.serialNumber === other.serialNumber &&
    device.vendorId === other.vendorId
  )
}

export async function getDeviceList(): Promise<Device[]> {
  return await usbDetection.find()
}

class USBDeviceListeners extends Listeners<[ChangeType, Device]> {
  private devices = new Set<Device>()
  private setupPromise?: Promise<void>

  public constructor() {
    super()
    this.pause()
  }

  private onDeviceAdded = (added: Device) => {
    this.devices.add(added)
    this.trigger(ChangeType.Add, added)
  }

  private onDeviceRemoved = (removed: Device) => {
    for (const existing of this.devices) {
      if (devicesEqual(removed, existing)) {
        this.devices.delete(existing)
      }
    }
    this.trigger(ChangeType.Remove, removed)
  }

  public async waitForMonitoring(): Promise<void> {
    await this.setupPromise
  }

  protected async listenerAdded(
    callback: (changeType: ChangeType, device: Device) => void,
    count: number,
  ) {
    if (count === 1) {
      this.setupPromise = this.setup()
    }

    await this.setupPromise

    for (const device of this.devices) {
      try {
        callback(ChangeType.Add, device)
      } catch (error) {
        console.error('event callback failed with error:', error)
      }
    }
  }

  private async setup(): Promise<void> {
    // Start monitoring. This must be called before `find`.
    usbDetection.startMonitoring()
    usbDetection.on('add', this.onDeviceAdded)
    usbDetection.on('remove', this.onDeviceRemoved)

    // Cache the initial device list.
    const devices = await usbDetection.find()
    this.devices.clear()
    for (const device of devices) {
      this.devices.add(device)
    }

    // Begin dispatching events.
    this.resume()
  }

  protected async listenerRemoved(
    callback: (changeType: ChangeType, device: Device) => void,
    count: number,
  ) {
    if (count === 0) {
      await this.teardown()
    }
  }

  private async teardown(): Promise<void> {
    await this.setupPromise

    // Stop dispatching events.
    this.pause()

    // Stop watching for changes.
    usbDetection.stopMonitoring()
    usbDetection.off('add', this.onDeviceAdded)
    usbDetection.off('removed', this.onDeviceRemoved)

    // Clear the cached device list.
    this.devices.clear()
  }
}

export const onDeviceChange = new USBDeviceListeners()

export { Device }
