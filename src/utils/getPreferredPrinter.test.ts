import getPreferredPrinter from './getPreferredPrinter'
import { fakeElectronPrinter } from '../../test/fakePrinter'

test('returns nothing if given no printers', () => {
  expect(getPreferredPrinter([])).toBeUndefined()
})

test('gets the default printer if there is one', () => {
  expect(
    getPreferredPrinter([
      fakeElectronPrinter({ name: 'another printer', isDefault: false }),
      fakeElectronPrinter({ name: 'main printer', isDefault: true }),
    ])?.name,
  ).toEqual('main printer')
})

test('gets the first printer if there is no default printer', () => {
  expect(
    getPreferredPrinter([
      {
        description: 'printer #1',
        displayName: 'printer #1',
        options: {},
        isDefault: false,
        name: 'printer #1',
        status: 0,
      },
      {
        description: 'printer #2',
        displayName: 'printer #2',
        options: {},
        isDefault: false,
        name: 'printer #2',
        status: 0,
      },
    ])?.name,
  ).toEqual('printer #1')
})
