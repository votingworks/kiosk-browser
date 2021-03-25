import { Subject } from 'rxjs'
import { Device } from 'usb-detection'
import fakePrinter from '../../test/fakePrinter'
import { fakeIpc, fakeWebContents } from '../../test/ipc'
import mockOf from '../../test/mockOf'
import deferred from '../utils/deferred'
import { Options } from '../utils/options'
import { getPrinterInfo } from './get-printer-info'
import register, { buildPrinterObserver, channel } from './printer-subscription'

jest.mock('./get-printer-info')

const getPrinterInfoMock = mockOf(getPrinterInfo).mockRejectedValue(
  new Error('no mocks ready'),
)

test('printer observer triggers on devices change', async () => {
  const onDevicesChange = new Subject<void>()
  const onPrinterConfigure = new Subject<void>()
  const printer = { ...fakePrinter(), connected: true }
  const callback = jest.fn()
  buildPrinterObserver(
    () => [printer],
    onDevicesChange,
    onPrinterConfigure,
  ).subscribe(callback)
  expect(callback).not.toHaveBeenCalled()

  // Trigger change and wait for promises.
  getPrinterInfoMock.mockResolvedValueOnce([printer])
  onDevicesChange.next()
  await Promise.resolve()

  expect(callback).toHaveBeenCalledWith([printer])
})

test('printer observer triggers on printer configure', async () => {
  const onDevicesChange = new Subject<void>()
  const onPrinterConfigure = new Subject<void>()
  const printer = { ...fakePrinter(), connected: true }
  const callback = jest.fn()
  buildPrinterObserver(
    () => [printer],
    onDevicesChange,
    onPrinterConfigure,
  ).subscribe(callback)
  expect(callback).not.toHaveBeenCalled()

  // Trigger change and wait for promises.
  getPrinterInfoMock.mockResolvedValueOnce([printer])
  onPrinterConfigure.next()
  await Promise.resolve()

  expect(callback).toHaveBeenCalledWith([printer])
})

test('printer observer triggers multiple times', async () => {
  const onDevicesChange = new Subject<void>()
  const onPrinterConfigure = new Subject<void>()
  const printer = { ...fakePrinter(), connected: true }
  const callback = jest.fn()
  buildPrinterObserver(
    () => [printer],
    onDevicesChange,
    onPrinterConfigure,
  ).subscribe(callback)
  expect(callback).not.toHaveBeenCalled()

  // Trigger change and wait for promises.
  getPrinterInfoMock.mockResolvedValueOnce([printer])
  onDevicesChange.next()
  await Promise.resolve()

  // Trigger change and wait for promises.
  getPrinterInfoMock.mockResolvedValueOnce([printer])
  onPrinterConfigure.next()
  await Promise.resolve()

  expect(callback).toHaveBeenNthCalledWith(1, [printer])
  expect(callback).toHaveBeenNthCalledWith(2, [printer])
})

test('registering a subscription handler hooks up to both USB devices and autoconfigured printers', async () => {
  const webContents = fakeWebContents({
    getPrinters: jest.fn().mockReturnValue([]),
    send: jest.fn(),
  })
  const { ipcMain, ipcRenderer } = fakeIpc(webContents)
  const changedDevices = new Subject<Iterable<Device>>()
  const autoconfiguredPrinter = new Subject<void>()
  const options: Options = {
    url: new URL('about:blank'),
    originFilePermissions: [],
  }
  const printer = { ...fakePrinter(), connected: true }

  const { resolve, promise } = deferred<void>()
  register(ipcMain, { changedDevices, autoconfiguredPrinter, options })
  await ipcRenderer.invoke(channel, { subscribe: true })

  expect(webContents.send).not.toHaveBeenCalled()
  getPrinterInfoMock.mockImplementationOnce(() => {
    resolve()
    return Promise.resolve([printer])
  })

  // Trigger device change and wait.
  changedDevices.next([])
  await promise

  expect(webContents.send).toHaveBeenCalledWith(channel, [printer])
})

test('unsubscribe', async () => {
  const webContents = fakeWebContents({
    getPrinters: jest.fn().mockReturnValue([]),
    send: jest.fn(),
  })
  const { ipcMain, ipcRenderer } = fakeIpc(webContents)
  const changedDevices = new Subject<Iterable<Device>>()
  const autoconfiguredPrinter = new Subject<void>()
  const options: Options = {
    url: new URL('about:blank'),
    originFilePermissions: [],
  }
  const printer = { ...fakePrinter(), connected: true }

  const { resolve, promise } = deferred<void>()
  register(ipcMain, { changedDevices, autoconfiguredPrinter, options })
  await ipcRenderer.invoke(channel, { subscribe: true })
  await ipcRenderer.invoke(channel, { subscribe: false })

  getPrinterInfoMock.mockImplementationOnce(() => {
    resolve()
    return Promise.resolve([printer])
  })

  // Trigger device change and wait.
  changedDevices.next([])
  await Promise.race([promise, new Promise(resolve => setTimeout(resolve, 10))])

  expect(webContents.send).not.toHaveBeenCalled()
})

test('unsubscribe on webContents teardown', async () => {
  const webContents = fakeWebContents({
    getPrinters: jest.fn().mockReturnValue([]),
    send: jest.fn(),
  })
  const { ipcMain, ipcRenderer } = fakeIpc(webContents)
  const changedDevices = new Subject<Iterable<Device>>()
  const autoconfiguredPrinter = new Subject<void>()
  const options: Options = {
    url: new URL('about:blank'),
    originFilePermissions: [],
  }
  const printer = { ...fakePrinter(), connected: true }

  const { resolve, promise } = deferred<void>()
  register(ipcMain, { changedDevices, autoconfiguredPrinter, options })
  await ipcRenderer.invoke(channel, { subscribe: true })

  // Trigger unsubscribe.
  webContents.emit('destroyed')

  getPrinterInfoMock.mockImplementationOnce(() => {
    resolve()
    return Promise.resolve([printer])
  })

  // Trigger device change and wait.
  changedDevices.next([])
  await Promise.race([promise, new Promise(resolve => setTimeout(resolve, 10))])

  expect(webContents.send).not.toHaveBeenCalled()
})
