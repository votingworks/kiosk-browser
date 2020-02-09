import register, { channel as printChannel } from './print'
import { IpcMain, IpcMainInvokeEvent, WebContents } from 'electron'
import getPreferredPrinter from '../utils/getPreferredPrinter'
import mockOf from '../../test/mockOf'
import fakePrinter from '../../test/fakePrinter'
import exec from '../utils/exec'

const getPreferredPrinterMock = mockOf(getPreferredPrinter)
const execMock = mockOf(exec)

jest.mock('../utils/exec')
jest.mock('../utils/getPreferredPrinter', () => jest.fn())

beforeEach(() => {
  getPreferredPrinterMock.mockReset()
  execMock.mockReset()
})

test('registers a handler to trigger a print', async () => {
  let channel: string | undefined
  let handler:
    | ((
        event: IpcMainInvokeEvent,
        deviceName?: string,
        paperSource?: string,
      ) => unknown)
    | undefined

  function handle(ch: string, fn: () => void): void {
    channel = ch
    handler = fn
  }

  const sender = ({
    getPrinters: () => [],
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  } as unknown) as WebContents

  register(({ handle } as unknown) as IpcMain)

  expect(channel).toEqual(printChannel)

  execMock.mockResolvedValueOnce({ stdout: '', stderr: '' })

  await handler?.(
    ({
      sender,
    } as unknown) as IpcMainInvokeEvent,
    'mainprinter',
    'Tray3',
  )

  expect(sender.printToPDF).toHaveBeenCalledWith({
    printBackground: true,
  })

  expect(execMock).toHaveBeenCalledWith(
    'lpr',
    ['-P', 'mainprinter', '-o', 'InputSlot=Tray3'],
    expect.anything(),
  )
})

test('uses the preferred printer if none is provided', async () => {
  let channel: string | undefined
  let handler:
    | ((event: IpcMainInvokeEvent, deviceName?: string) => unknown)
    | undefined

  function handle(ch: string, fn: () => void): void {
    channel = ch
    handler = fn
  }

  const sender = ({
    getPrinters: () => [],
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  } as unknown) as WebContents

  register(({ handle } as unknown) as IpcMain)

  expect(channel).toEqual(printChannel)

  getPreferredPrinterMock.mockReturnValueOnce(
    fakePrinter({ name: 'main printer' }),
  )

  execMock.mockResolvedValueOnce({ stdout: '', stderr: '' })

  await handler?.(({
    sender,
  } as unknown) as IpcMainInvokeEvent)

  expect(sender.printToPDF).toHaveBeenCalledWith({ printBackground: true })

  expect(execMock).toHaveBeenCalledWith(
    'lpr',
    ['-P', 'main printer'],
    expect.anything(),
  )
})

test('propagates errors', async () => {
  let channel: string | undefined
  let handler:
    | ((event: IpcMainInvokeEvent, deviceName?: string) => unknown)
    | undefined

  function handle(ch: string, fn: () => void): void {
    channel = ch
    handler = fn
  }

  const sender = ({
    getPrinters: () => [],
    printToPDF: jest.fn().mockRejectedValueOnce(new Error('PCLOADLETTER')),
  } as unknown) as WebContents

  register(({ handle } as unknown) as IpcMain)

  expect(channel).toEqual(printChannel)

  await expect(
    handler?.(({
      sender,
    } as unknown) as IpcMainInvokeEvent),
  ).rejects.toThrowError('PCLOADLETTER')

  expect(sender.printToPDF).toHaveBeenCalled()
})
