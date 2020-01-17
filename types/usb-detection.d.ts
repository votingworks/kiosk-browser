declare module 'usb-detection' {
  // Type definitions for usb-detection 4.5.0
  // Project: https://github.com/MadLittleMods/node-usb-detection
  // Definitions by: Rob Moran <https://github.com/thegecko>
  //                 Rico Brase <https://github.com/RicoBrase>

  export interface Device {
    locationId: number
    vendorId: number
    productId: number
    deviceName: string
    manufacturer: string
    serialNumber: string
    deviceAddress: number
  }

  class USBDetection extends NodeJS.EventEmitter {
    public find(
      vid: number,
      pid: number,
      callback: (error: any, devices: Device[]) => any,
    ): void
    public find(vid: number, pid: number): Promise<Device[]>
    public find(
      vid: number,
      callback: (error: any, devices: Device[]) => any,
    ): void
    public find(vid: number): Promise<Device[]>
    public find(callback: (error: any, devices: Device[]) => any): void
    public find(): Promise<Device[]>

    public startMonitoring(): void
    public stopMonitoring(): void

    public on(event: string, callback: (device: Device) => void): this
    public off(event: string, callback: (device: Device) => void): this

    public version: number
  }

  const usbDetection: USBDetection

  export default usbDetection
}
