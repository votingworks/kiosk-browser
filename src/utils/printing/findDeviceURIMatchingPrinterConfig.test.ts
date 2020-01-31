import findDeviceURIMatchingPrinterConfig from './findDeviceURIMatchingPrinterConfig'
import { PrintConfig } from '.'
import { loadPrintConfig } from '../options'
import { ok } from '../assert'
import { join } from 'path'

async function getTestConfig(): Promise<PrintConfig> {
  const config = await loadPrintConfig(
    join(__dirname, '../../../test/print-config/print-config.json'),
  )
  ok(config)
  return config
}

test('no device URIs', async () => {
  const config = await getTestConfig()
  expect(findDeviceURIMatchingPrinterConfig(config.printers[0], [])).toEqual(
    undefined,
  )
})

test('one matching device URI', async () => {
  const config = await getTestConfig()
  expect(
    findDeviceURIMatchingPrinterConfig(config.printers[0], [
      'usb://Brother/HL-L5100DN%20series?TAG=abcdefg',
    ]),
  ).toEqual('usb://Brother/HL-L5100DN%20series?TAG=abcdefg')
})

test('no matching device URIs', async () => {
  const config = await getTestConfig()
  expect(
    findDeviceURIMatchingPrinterConfig(config.printers[0], [
      'usb://Example/Printer',
      'usb://Example/Printer_2',
    ]),
  ).toEqual(undefined)
})

test('multiple matching device URIs', async () => {
  const config = await getTestConfig()
  expect(
    findDeviceURIMatchingPrinterConfig(config.printers[0], [
      'usb://Brother/HL-L5100DN%20series?TAG=1',
      'usb://Brother/HL-L5100DN%20series?TAG=2',
    ]),
  ).toEqual('usb://Brother/HL-L5100DN%20series?TAG=1')
})
