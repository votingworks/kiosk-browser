import usbDetection, { Device } from 'usb-detection'
import makeDebug from 'debug'
import { Observable, from, defer, fromEvent } from 'rxjs'
import { shareReplay, finalize, tap } from 'rxjs/operators'
import KeySet from './KeySet'
import mergeChanges, { ImmutableSet } from './mergeChanges'

export interface DeviceChange {
  type: unknown
  device: Device
}

const debug = makeDebug('kiosk-browser:usb')

function deviceKey({
  deviceAddress,
  deviceName,
  locationId,
  manufacturer,
  productId,
  serialNumber,
  vendorId,
}: Device): string {
  return [
    deviceAddress,
    deviceName,
    locationId,
    manufacturer,
    productId,
    serialNumber,
    vendorId,
  ].join('-')
}

/**
 * @deprecated Use `devices` observable instead.
 */
export async function getDeviceList(): Promise<Device[]> {
  const deviceList = await usbDetection.find()
  debug('getDeviceList returning latest device list: %O', deviceList)
  return deviceList
}

/**
 * Build an observable that yields a USB device whenever one is added.
 */
const fromDeviceAdd = (): Observable<Device> =>
  fromEvent<Device>(usbDetection, 'add').pipe(
    tap(device => debug('device added: %O', device)),
  )

/**
 * Build an observable that yields a USB device whenever one is removed.
 */
const fromDeviceRemove = (): Observable<Device> =>
  fromEvent<Device>(usbDetection, 'remove').pipe(
    tap(device => debug('device removed: %O', device)),
  )

/**
 * Build an observable that yields a single value, the set of connected USB
 * devices, and starts device monitoring. This observable should be used in
 * combination with another whose teardown logic will stop device monitoring.
 * Also, it will not start monitoring until it has a subscriber.
 */
const initialDevices = (): Observable<ImmutableSet<Device>> =>
  // Wait until we have a subscriber.
  defer(() =>
    from(
      new Promise<Device[]>(resolve => {
        usbDetection.startMonitoring()
        debug('device monitoring started')
        resolve(usbDetection.find())
      }).then(devices => {
        debug('got initial devices: %O', devices)
        return new KeySet(deviceKey, devices)
      }),
    ),
  )

/**
 * Build a new observable that yields the current set of connected USB devices
 * as devices are added and removed.
 *
 * Given a set of initial devices (e.g. {mouse, keyboard}), a subscriber would
 * receive the initial set. Once a new device is added (e.g. flash drive), that
 * first subscriber receives a new set (e.g. {mouse, keyboard, flash drive}).
 * New subscribers immediately receive the same current set.
 */
export const buildDevicesObservable = (): Observable<ImmutableSet<Device>> =>
  // Get the initial devices and monitor devices.
  initialDevices().pipe(
    // Take the initial devices and merge in adds/removes.
    mergeChanges(fromDeviceAdd(), fromDeviceRemove()),
    // When we're done, stop monitoring.
    finalize(() => {
      usbDetection.stopMonitoring()
    }),
    // Ensure there's only one shared subscription, new subscribers get the most
    // recent device set (bufferSize: 1), and we start/stop monitoring with
    // subscribers (refCount: true).
    shareReplay({ refCount: true, bufferSize: 1 }),
    tap(devices => debug('yielding new devices to subscribers: %O', devices)),
  )

/**
 * The shared observable for monitoring connected USB devices. Typically, this
 * should be used instead of `buildDevicesObservable`.
 */
export const devices = buildDevicesObservable()

export { Device }
