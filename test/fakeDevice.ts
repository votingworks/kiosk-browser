import { Device } from '../src/utils/usb'

export default function fakeDevice(props: Partial<Device> = {}): Device {
  return {
    deviceName: 'fake device',
    deviceAddress: 0,
    locationId: 0,
    manufacturer: 'Acme Inc.',
    productId: 0,
    serialNumber: '12345',
    vendorId: 0,
    ...props,
  }
}
