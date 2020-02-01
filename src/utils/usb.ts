import usbDetection, { Device } from 'usb-detection'
import Listeners from './Listeners'
import { ChangeType } from '../ipc/manage-device-subscription'
import makeDebug from 'debug'

const debug = makeDebug('kiosk-browser:usb')

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
  const deviceList = await usbDetection.find()
  debug('getDeviceList returning latest device list: %O', deviceList)
  return deviceList
}

class USBDeviceListeners extends Listeners<[ChangeType, Device]> {
  private devices = new Set<Device>()
  private setupPromise?: Promise<void>

  public constructor() {
    super()
    this.pause()
  }

  private onDeviceAdded = (added: Device) => {
    debug('device added: %O', added)
    this.devices.add(added)
    this.trigger(ChangeType.Add, added)
  }

  private onDeviceRemoved = (removed: Device) => {
    debug('device removed: %O')
    for (const existing of this.devices) {
      if (devicesEqual(removed, existing)) {
        debug('removing equivalent device from cache: %O', existing)
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
    debug('device listener added (count=%d)', count)

    if (count === 1) {
      debug('this is the first listener, start monitoring')
      this.setupPromise = this.setup()
    }

    await this.setupPromise

    for (const device of this.devices) {
      try {
        debug('calling newly-added listener with existing device: %O', device)
        callback(ChangeType.Add, device)
      } catch (error) {
        debug('event callback failed with error: %s', error.message)
        console.error('event callback failed with error:', error)
      }
    }
  }

  private async setup(): Promise<void> {
    debug('setting up monitoring')

    // Start monitoring. This must be called before `find`.
    debug('calling underlying startMonitoring')
    usbDetection.startMonitoring()
    usbDetection.on('add', this.onDeviceAdded)
    usbDetection.on('remove', this.onDeviceRemoved)

    // Cache the initial device list.
    const devices = await usbDetection.find()
    debug('got initial device list: %O', devices)
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
      debug('last listener was removed, stop monitoring')
      await this.teardown()
    }
  }

  private async teardown(): Promise<void> {
    debug('tearing down monitoring')

    await this.setupPromise

    // Stop dispatching events.
    this.pause()

    // Stop watching for changes.
    debug('calling underlying stopMonitoring')
    usbDetection.stopMonitoring()
    usbDetection.off('add', this.onDeviceAdded)
    usbDetection.off('removed', this.onDeviceRemoved)

    // Clear the cached device list.
    this.devices.clear()
    debug('cleared device cache: %O', this.devices)
  }
}

export const onDeviceChange = new USBDeviceListeners()

export { Device }
