import autoconfigurePrinter from './autoconfigurePrinter'
import Listeners from '../Listeners'
import { ChangeType } from '../../ipc/manage-device-subscription'
import { Device } from '../usb'
import fakeDevice from '../../../test/fakeDevice'
import configurePrinterFromDevice from './configurePrinterFromDevice'

jest.mock('./configurePrinterFromDevice')

test('device remove events', () => {
  const listeners = new Listeners<[ChangeType, Device]>()
  const config = {
    printerName: 'VxPrinter',
    printers: [],
  }

  // Set up autoconfigure.
  autoconfigurePrinter(config, listeners)

  // Trigger remove.
  listeners.trigger(ChangeType.Remove, fakeDevice())

  // We do not try to configure it.
  expect(configurePrinterFromDevice).not.toHaveBeenCalled()
})

test('device add calls to configure', () => {
  const listeners = new Listeners<[ChangeType, Device]>()
  const config = {
    printerName: 'VxPrinter',
    printers: [],
  }
  const addedDevice = fakeDevice()

  // Set up autoconfigure.
  autoconfigurePrinter(config, listeners)

  // Device added.
  listeners.trigger(ChangeType.Add, addedDevice)

  // We try to configure it.
  expect(configurePrinterFromDevice).toHaveBeenCalledWith(config, addedDevice)
})
