import register, { channel as printChannel } from './print'
import { IpcMain, IpcMainInvokeEvent, WebContents } from 'electron'
import getPreferredPrinter from '../utils/getPreferredPrinter'
import mockOf from '../../test/mockOf'
import fakePrinter from '../../test/fakePrinter'

const getPreferredPrinterMock = mockOf(getPreferredPrinter)

jest.mock('../utils/getPreferredPrinter', () => jest.fn())

beforeEach(() => {
  getPreferredPrinterMock.mockReset()
})

test('registers a handler to trigger a print', async () => {
  let channel: string | undefined
  let listener:
    | ((event: IpcMainInvokeEvent, deviceName?: string) => unknown)
    | undefined

  function handle(ch: string, fn: () => void) {
    channel = ch
    listener = fn
  }

  const sender = ({
    getPrinters: () => [],
    print: jest.fn((options, callback) => {
      callback(/* success = */ true)
    }),
  } as unknown) as WebContents

  register(({ handle } as unknown) as IpcMain)

  expect(channel).toEqual(printChannel)

  await listener?.(
    ({
      sender,
    } as unknown) as IpcMainInvokeEvent,
    'main printer',
  )

  expect(sender.print).toHaveBeenCalledWith(
    { silent: true, deviceName: 'main printer' },
    expect.any(Function),
  )
})

test('uses the preferred printer if none is provided', async () => {
  let channel: string | undefined
  let listener:
    | ((event: IpcMainInvokeEvent, deviceName?: string) => unknown)
    | undefined

  function handle(ch: string, fn: () => void) {
    channel = ch
    listener = fn
  }

  const sender = ({
    getPrinters: () => [],
    print: jest.fn((options, callback) => {
      callback(/* success = */ true)
    }),
  } as unknown) as WebContents

  register(({ handle } as unknown) as IpcMain)

  expect(channel).toEqual(printChannel)

  getPreferredPrinterMock.mockReturnValue(fakePrinter({ name: 'main printer' }))

  await listener?.(({
    sender,
  } as unknown) as IpcMainInvokeEvent)

  expect(sender.print).toHaveBeenCalledWith(
    { silent: true, deviceName: 'main printer' },
    expect.any(Function),
  )
})

test('propagates errors', async () => {
  let channel: string | undefined
  let listener:
    | ((event: IpcMainInvokeEvent, deviceName?: string) => unknown)
    | undefined

  function handle(ch: string, fn: () => void) {
    channel = ch
    listener = fn
  }

  const sender = ({
    getPrinters: () => [],
    print: jest.fn((options, callback) => {
      callback(/* success = */ false, new Error('PCLOADLETTER'))
    }),
  } as unknown) as WebContents

  register(({ handle } as unknown) as IpcMain)

  expect(channel).toEqual(printChannel)

  expect(
    listener?.(({
      sender,
    } as unknown) as IpcMainInvokeEvent),
  ).rejects.toThrowError('PCLOADLETTER')

  expect(sender.print).toHaveBeenCalled()
})
