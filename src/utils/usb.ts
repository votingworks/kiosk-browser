import { strict as assert } from 'assert'
import makeDebug from 'debug'
import { defer, fromEvent, Observable } from 'rxjs'
import { finalize, tap } from 'rxjs/operators'
import { Device } from 'usb-detection'
import KeySet, { ImmutableSet } from './KeySet'

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

export class USBDetectionManager {
  private refCount = 0
  private readonly usbDetection: typeof import('usb-detection').default

  /**
   * Build a manager for `usbDetection`.
   */
  public constructor(usbDetection: typeof import('usb-detection').default) {
    this.usbDetection = usbDetection
  }

  public ref(): void {
    assert(this.refCount >= 0)
    if (this.refCount++ === 0) {
      debug('got first USB detection reference, starting monitoring')
      this.usbDetection.startMonitoring()
    }
    debug('ref: detection ref count=%d', this.refCount)
  }

  public deref(): void {
    assert(this.refCount > 0)
    if (--this.refCount === 0) {
      debug('lost last USB detection reference, stopping monitoring')
      this.usbDetection.stopMonitoring()
    }
    debug('deref: detection ref count=%d', this.refCount)
  }

  public isMonitoring(): boolean {
    return this.refCount > 0
  }

  /**
   * Gets the current list of connected devices.
   */
  private async find(): Promise<Device[]> {
    assert(this.isMonitoring())
    return await this.usbDetection.find()
  }

  /**
   * Build an observable that yields a USB device whenever one is added.
   */
  public get deviceAdd(): Observable<Device> {
    return defer(() => {
      debug('deviceAdd observer initialize')
      this.ref()
      return fromEvent<Device>(this.usbDetection, 'add').pipe(
        tap(device => debug('device added: %O', device)),
        finalize(() => {
          debug('deviceAdd observer finalize')
          this.deref()
        }),
      )
    })
  }

  /**
   * Build an observable that yields a USB device whenever one is removed.
   */
  public get deviceRemove(): Observable<Device> {
    return defer(() => {
      debug('deviceRemove observer initialize')
      this.ref()
      return fromEvent<Device>(this.usbDetection, 'remove').pipe(
        tap(device => debug('device removed: %O', device)),
        finalize(() => {
          debug('deviceRemove observer finalize')
          this.deref()
        }),
      )
    })
  }

  /**
   * Build a new observable that yields the current set of connected USB devices
   * as devices are added and removed.
   *
   * Given a set of initial devices (e.g. {mouse, keyboard}), a subscriber would
   * receive the initial set. Once a new device is added (e.g. flash drive), that
   * first subscriber receives a new set (e.g. {mouse, keyboard, flash drive}).
   * New subscribers immediately receive the same current set.
   */
  public get devices(): Observable<ImmutableSet<Device>> {
    const result = new Observable<ImmutableSet<Device>>(subscriber => {
      this.ref()
      let unsubscribed = false
      const cleanups: VoidFunction[] = []

      this.find().then(findResult => {
        if (unsubscribed) {
          return
        }

        let devices = new KeySet(deviceKey, findResult)

        debug('pushing initial device list: %O', devices)
        subscriber.next(devices)

        const deviceAddSubscription = this.deviceAdd.subscribe(added => {
          devices = devices.add(added)
          debug('pushing new devices list: %O', devices)
          subscriber.next(devices)
        })

        const deviceRemoveSubscription = this.deviceRemove.subscribe(
          removed => {
            devices = devices.delete(removed)
            debug('pushing new devices list: %O', devices)
            subscriber.next(devices)
          },
        )

        cleanups.push(() => {
          deviceAddSubscription.unsubscribe()
          deviceRemoveSubscription.unsubscribe()
        })
      })

      return (): void => {
        unsubscribed = true
        this.deref()
        for (const cleanup of cleanups) {
          cleanup()
        }
      }
    })

    // Memoize the observer.
    Object.defineProperty(this, 'devices', { value: result })

    return result
  }
}

export { Device }
