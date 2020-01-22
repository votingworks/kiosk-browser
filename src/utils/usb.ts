import usbDetection, { Device } from 'usb-detection'
import Listeners from './Listeners'
import { ChangeType } from '../ipc/manage-device-subscription'

const assertions = new Set<object>()

export interface Assertion {
  release(): void
}

export function clearAssertions(): void {
  assertions.clear()
}

export function isMonitoring(): boolean {
  return assertions.size > 0
}

export function assertMonitoring(): Assertion {
  if (!isMonitoring()) {
    usbDetection.startMonitoring()
  }

  const token = {}

  assertions.add(token)

  return {
    release() {
      assertions.delete(token)

      if (!isMonitoring()) {
        usbDetection.stopMonitoring()
      }
    },
  }
}

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
