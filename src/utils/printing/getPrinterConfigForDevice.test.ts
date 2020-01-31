import getPrinterConfigForDevice from './getPrinterConfigForDevice'
import fakeDevice from '../../../test/fakeDevice'

test('config has no printers', () => {
  expect(
    getPrinterConfigForDevice({ printerName: '', printers: [] }, fakeDevice()),
  ).toEqual(undefined)
})

test('config printers do not match device', () => {
  expect(
    getPrinterConfigForDevice(
      {
        printerName: '',
        printers: [
          {
            baseDeviceURI: 'usb://Example',
            label: 'Example Printer',
            ppd: { model: 'foo' },
            productId: 0,
            vendorId: 0,
          },
        ],
      },
      fakeDevice({ productId: 1, vendorId: 1 }),
    ),
  ).toEqual(undefined)
})

test('a config printer matches the device', () => {
  expect(
    getPrinterConfigForDevice(
      {
        printerName: '',
        printers: [
          {
            baseDeviceURI: 'usb://Example',
            label: 'Example Printer',
            ppd: { model: 'foo' },
            productId: 0,
            vendorId: 0,
          },
        ],
      },
      fakeDevice({ productId: 0, vendorId: 0 }),
    ),
  ).toEqual(expect.objectContaining({ label: 'Example Printer' }))
})
