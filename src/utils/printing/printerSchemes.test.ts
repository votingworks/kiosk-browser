import printerSchemes from './printerSchemes';
import { fakeElectronPrinter } from '../../../test/fakePrinter';

describe('printerSchemes', () => {
  it('returns an empty set given no printers', () => {
    expect(printerSchemes([])).toEqual(new Set());
  });

  it('gets schemes for a list of printers', () => {
    expect(
      printerSchemes([
        fakeElectronPrinter(),
        fakeElectronPrinter({
          options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        }),
        fakeElectronPrinter({
          options: { 'device-uri': 'ippusb://HP/Color%20LaserJet?serial=1234' },
        }),
      ]),
    ).toEqual(new Set(['usb', 'ippusb']));
  });
});
