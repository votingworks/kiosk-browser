import register, {
  getPrinterInfo,
  channel as getPrinterInfoChannel,
  PrinterInfo,
} from './get-printer-info'
import fakePrinter from '../../test/fakePrinter'
import mockOf from '../../test/mockOf'
import { IpcMain, IpcMainInvokeEvent } from 'electron'
import getConnectedDeviceURIs from '../utils/printing/getConnectedDeviceURIs'

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
  let channel: string | undefined
  let handler: ((event: IpcMainInvokeEvent) => unknown) | undefined

  function handle(ch: string, fn: () => void): void {
    channel = ch
    handler = fn
  }

  register(({ handle } as unknown) as IpcMain)
  expect(channel).toEqual(getPrinterInfoChannel)

  mockOf(getConnectedDeviceURIs).mockResolvedValueOnce(
    new Set(['usb://HP/Color%20LaserJet?serial=1234']),
  )

  expect(
    await handler?.(({
      sender: {
        getPrinters(): Electron.PrinterInfo[] {
          return [
            fakePrinter({
              options: {
                'device-uri': 'usb://HP/Color%20LaserJet?serial=1234',
              },
            }),
          ]
        },
      },
    } as unknown) as IpcMainInvokeEvent),
  ).toEqual([expect.objectContaining({ connected: true })])
})
