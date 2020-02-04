import fakeDevice from '../../../test/fakeDevice'
import mockOf from '../../../test/mockOf'

import configurePrinter from './configurePrinter'
import getConnectedDeviceURIs from './getConnectedDeviceURIs'
import configurePrinterFromDevice from './configurePrinterFromDevice'

jest.mock('./configurePrinter')
jest.mock('./getConnectedDeviceURIs')
jest.mock('./getPrinterDeviceURI')

test('device not matching a known printer', async () => {
  await configurePrinterFromDevice(
    {
      printerName: 'VxPrinter',
      printers: [],
    },
    fakeDevice(),
  )

  expect(configurePrinter).not.toHaveBeenCalled()
})

test('device matching a known printer but not matching a connected device URI', async () => {
  mockOf(getConnectedDeviceURIs).mockResolvedValueOnce(new Set())

  await configurePrinterFromDevice(
    {
      printerName: 'VxPrinter',
      printers: [
        {
          label: 'HP LaserSomething!',
          baseDeviceURI: 'usb://HP/LaserSomething',
          ppd: { model: 'foomatic-something' },
          productId: 0x123,
          vendorId: 0x456,
        },
      ],
    },
    fakeDevice({ productId: 0x123, vendorId: 0x456 }),
  )

  expect(configurePrinter).not.toHaveBeenCalled()
})

test('device matching a known printer and a connected device URI', async () => {
  mockOf(getConnectedDeviceURIs).mockResolvedValueOnce(
    new Set(['usb://HP/LaserSomething?serial=abc123']),
  )

  await configurePrinterFromDevice(
    {
      printerName: 'VxPrinter',
      printers: [
        {
          label: 'HP LaserSomething!',
          baseDeviceURI: 'usb://HP/LaserSomething',
          ppd: { model: 'foomatic-something' },
          productId: 0x123,
          vendorId: 0x456,
        },
      ],
    },
    fakeDevice({ productId: 0x123, vendorId: 0x456 }),
  )

  expect(configurePrinter).toHaveBeenCalledWith({
    printerName: 'VxPrinter',
    ppd: { model: 'foomatic-something' },
    deviceURI: 'usb://HP/LaserSomething?serial=abc123',
    setDefault: true,
  })
})
