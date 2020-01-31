import printerSchemes from './printerSchemes'
import fakePrinter from '../../../test/fakePrinter'

describe('printerSchemes', () => {
  it('returns an empty set given no printers', () => {
    expect(printerSchemes([])).toEqual(new Set())
  })

  it('gets schemes for a list of printers', () => {
    expect(
      printerSchemes([
        fakePrinter(),
        fakePrinter({
          options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        }),
        fakePrinter({
          options: { 'device-uri': 'ippusb://HP/Color%20LaserJet?serial=1234' },
        }),
      ]),
    ).toEqual(new Set(['usb', 'ippusb']))
  })
})
