import { WebContents } from 'electron'
import fakePrinter from '../../test/fakePrinter'
import { fakeIpc } from '../../test/ipc'
import mockOf from '../../test/mockOf'
import getConnectedDeviceURIs from '../utils/printing/getConnectedDeviceURIs'
import register, {
  channel as getPrinterInfoChannel,
  getPrinterInfo,
} from './get-printer-info'

jest.mock('../utils/printing/getConnectedDeviceURIs')

describe('getPrinterInfo', () => {
  it('expands the printer info with connected=true if lpinfo shows the device', async () => {
    mockOf(getConnectedDeviceURIs).mockResolvedValueOnce(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    )

    expect(
      await getPrinterInfo([
        fakePrinter(),
        fakePrinter({
          options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        }),
      ]),
    ).toEqual([
      expect.objectContaining({ connected: false }),
      expect.objectContaining({ connected: true }),
    ])
  })

  it('expands the printer info with connected=false if lpinfo does not show the device', async () => {
    mockOf(getConnectedDeviceURIs).mockResolvedValueOnce(new Set())

    expect(
      await getPrinterInfo([
        fakePrinter({
          options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        }),
      ]),
    ).toEqual([expect.objectContaining({ connected: false })])
  })
})

test('registers an IPC handler for getting printer info', async () => {
  const sender: Partial<WebContents> = {
    getPrinters(): Electron.PrinterInfo[] {
      return [
        fakePrinter({
          options: {
            'device-uri': 'usb://HP/Color%20LaserJet?serial=1234',
          },
        }),
      ]
    },
  }
  const { ipcMain, ipcRenderer } = fakeIpc(sender)

  register(ipcMain)

  mockOf(getConnectedDeviceURIs).mockResolvedValueOnce(
    new Set(['usb://HP/Color%20LaserJet?serial=1234']),
  )

  expect(await ipcRenderer.invoke(getPrinterInfoChannel)).toEqual([
    expect.objectContaining({ connected: true }),
  ])
})
