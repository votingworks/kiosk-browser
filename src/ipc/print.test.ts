import { WebContents } from 'electron'
import fakePrinter from '../../test/fakePrinter'
import { fakeIpc } from '../../test/ipc'
import mockOf from '../../test/mockOf'
import exec from '../utils/exec'
import getPreferredPrinter from '../utils/getPreferredPrinter'
import register, { channel as printChannel } from './print'

const getPreferredPrinterMock = mockOf(getPreferredPrinter)
const execMock = mockOf(exec)

jest.mock('../utils/exec')
jest.mock('../utils/getPreferredPrinter', () => jest.fn())

beforeEach(() => {
  getPreferredPrinterMock.mockReset()
  execMock.mockReset()
})

test('registers a handler to trigger a print', async () => {
  const sender: Partial<WebContents> = {
    getPrinters: () => [],
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  }
  const { ipcMain, ipcRenderer } = fakeIpc(sender)

  register(ipcMain)

  execMock.mockResolvedValueOnce({ stdout: '', stderr: '' })

  await ipcRenderer.invoke(printChannel, 'mainprinter', 'Tray3')

  expect(sender.printToPDF).toHaveBeenCalledWith({
    printBackground: true,
  })

  expect(execMock).toHaveBeenCalledWith(
    'lpr',
    ['-P', 'mainprinter', '-o', 'sides=two-sided-long-edge', 'InputSlot=Tray3'],
    expect.anything(),
  )
})

test('uses the preferred printer if none is provided', async () => {
  const sender: Partial<WebContents> = {
    getPrinters: () => [],
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  }
  const { ipcMain, ipcRenderer } = fakeIpc(sender)

  register(ipcMain)

  getPreferredPrinterMock.mockReturnValueOnce(
    fakePrinter({ name: 'main printer' }),
  )

  execMock.mockResolvedValueOnce({ stdout: '', stderr: '' })

  await ipcRenderer.invoke(printChannel)

  expect(sender.printToPDF).toHaveBeenCalledWith({ printBackground: true })

  expect(execMock).toHaveBeenCalledWith(
    'lpr',
    ['-P', 'main printer', '-o', 'sides=two-sided-long-edge'],
    expect.anything(),
  )
})

test('propagates errors', async () => {
  const sender: Partial<WebContents> = {
    getPrinters: () => [],
    printToPDF: jest.fn().mockRejectedValueOnce(new Error('PCLOADLETTER')),
  }
  const { ipcMain, ipcRenderer } = fakeIpc(sender)

  register(ipcMain)
  await expect(ipcRenderer.invoke(printChannel)).rejects.toThrowError(
    'PCLOADLETTER',
  )

  expect(sender.printToPDF).toHaveBeenCalled()
})
