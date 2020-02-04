import { ChangeType } from '../../ipc/manage-device-subscription'
import { Device } from '../usb'
import Listeners, { Listener } from '../Listeners'
import { debug, PrintConfig } from '.'
import configurePrinterFromDevice from './configurePrinterFromDevice'

export default function autoconfigurePrinter(
  config: PrintConfig,
  onDeviceChange: Listeners<[ChangeType, Device]>,
): Listener {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return onDeviceChange.add(async function onDeviceChangeCallback(
    changeType: ChangeType,
    device: Device,
  ): Promise<void> {
    if (changeType !== ChangeType.Add) {
      debug('ignoring device remove event: %O', device)
    } else if (await configurePrinterFromDevice(config, device)) {
      debug(
        're-triggering device add event after configuring printer: %o',
        device,
      )
      onDeviceChange.trigger(changeType, device)
    } else {
      debug('newly added device was not configured as a printer: %o', device)
    }
  })
}
