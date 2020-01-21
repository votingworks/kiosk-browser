import register, {
  printerSchemes,
  getPrinterInfo,
  channel as getPrinterInfoChannel,
  getConnectedDeviceURIs,
} from './get-printer-info'
import fakePrinter from '../../test/fakePrinter'
import exec from '../utils/exec'
import mockOf from '../../test/mockOf'
import { IpcMain, IpcMainInvokeEvent } from 'electron'

jest.mock('../utils/exec', () => jest.fn())

const execMock = mockOf(exec)

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

describe('getConnectedDeviceURIs', () => {
  it('calls out to lpinfo without any schemes', async () => {
    execMock.mockResolvedValue({
      stdout: 'direct usb://HP/Color%20LaserJet?serial=1234',
      stderr: '',
    })

    expect(await getConnectedDeviceURIs()).toEqual(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    )

    expect(execMock).toHaveBeenCalledWith('lpinfo', ['-v'])
  })

  it('calls out to lpinfo with schemes', async () => {
    execMock.mockResolvedValue({
      stdout: 'direct usb://HP/Color%20LaserJet?serial=1234',
      stderr: '',
    })

    expect(await getConnectedDeviceURIs(new Set(['usb', 'ippusb']))).toEqual(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    )

    expect(execMock).toHaveBeenCalledWith('lpinfo', [
      '--include-schemes',
      'usb,ippusb',
      '-v',
    ])
  })
})

describe('getPrinterInfo', () => {
  it('expands the printer info with connected=true if lpinfo shows the device', async () => {
    execMock.mockResolvedValue({
      stdout: 'direct usb://HP/Color%20LaserJet?serial=1234\n',
      stderr: '',
    })

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
    execMock.mockResolvedValue({
      stdout: '',
      stderr: '',
    })

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
  let listener: ((event: IpcMainInvokeEvent) => unknown) | undefined

  function handle(ch: string, fn: () => void) {
    channel = ch
    listener = fn
  }

  register(({ handle } as unknown) as IpcMain)
  expect(channel).toEqual(getPrinterInfoChannel)

  execMock.mockResolvedValue({
    stdout: 'direct usb://HP/Color%20LaserJet?serial=1234\n',
    stderr: '',
  })

  expect(
    await listener?.(({
      sender: {
        getPrinters() {
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
