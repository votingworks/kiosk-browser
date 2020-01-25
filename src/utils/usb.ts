import usbDetection, { Device } from 'usb-detection'
import Listeners from './Listeners'
import { ChangeType } from '../ipc/manage-device-subscription'
import { Resource, Retain } from './resources'

/**
 * Centralizes access to the USB monitoring resource to ensure monitoring is
 * started and stopped appropriately.
 */
class USBResource extends Resource {
  /**
   * Retains access to USB monitoring until the result is released.
   */
  public retain(): Retain {
    if (!this.isRetained()) {
      usbDetection.startMonitoring()
    }

    return super.retain()
  }

  /**
   * Releases the given retain value.
   */
  public release(retain: Retain): void {
    super.release(retain)

    if (!this.isRetained()) {
      usbDetection.stopMonitoring()
    }
  }

  /**
   * Releases all existing retain values.
   */
  public releaseAll(): void {
    if (this.isRetained()) {
      super.releaseAll()
      usbDetection.stopMonitoring()
    }
  }
}

/**
 * Singleton instance for managing the USB monitoring resource.
 */
export const usbResource = new USBResource()

export async function getDeviceList(): Promise<Device[]> {
  return await usbDetection.find()
}

export const onDeviceChange = new Listeners<[ChangeType, Device]>()

usbDetection.on('add', device => {
  onDeviceChange.trigger(ChangeType.Add, device)
})

usbDetection.on('remove', device => {
  onDeviceChange.trigger(ChangeType.Remove, device)
})

export { Device }
