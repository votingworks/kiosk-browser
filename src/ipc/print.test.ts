import { WebContents } from 'electron';
import { fakeElectronPrinter } from '../../test/fakePrinter';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import execSync from '../utils/execSync';
import getPreferredPrinter from '../utils/getPreferredPrinter';
import register, { channel as printChannel, PrintSides } from './print';

const getPreferredPrinterMock = mockOf(getPreferredPrinter);
const execSyncMock = mockOf(execSync);

jest.mock('../utils/execSync');
jest.mock('../utils/getPreferredPrinter', () => jest.fn());

beforeEach(() => {
  getPreferredPrinterMock.mockReset();
  execSyncMock.mockReset();
});

test('registers a handler to trigger a print', async () => {
  const sender: Partial<WebContents> = {
    getPrintersAsync: () => Promise.resolve([]),
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  };
  const { ipcMain, ipcRenderer } = fakeIpc(sender);

  register(ipcMain);

  execSyncMock.mockReturnValueOnce({ stdout: '', stderr: '' });

  await ipcRenderer.invoke(printChannel, {
    deviceName: 'mainprinter',
    paperSource: 'Tray3',
  });

  expect(sender.printToPDF).toHaveBeenCalledWith({
    printBackground: true,
  });

  expect(execSyncMock).toHaveBeenCalledWith(
    'lpr',
    ['-P', 'mainprinter', '-o', 'sides=two-sided-long-edge', 'InputSlot=Tray3'],
    expect.anything(),
  );
});

test('uses the preferred printer if none is provided', async () => {
  const sender: Partial<WebContents> = {
    getPrintersAsync: () => Promise.resolve([]),
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  };
  const { ipcMain, ipcRenderer } = fakeIpc(sender);

  register(ipcMain);

  getPreferredPrinterMock.mockReturnValueOnce(
    fakeElectronPrinter({ name: 'main printer' }),
  );

  execSyncMock.mockReturnValueOnce({ stdout: '', stderr: '' });

  await ipcRenderer.invoke(printChannel);

  expect(sender.printToPDF).toHaveBeenCalledWith({ printBackground: true });

  expect(execSyncMock).toHaveBeenCalledWith(
    'lpr',
    ['-P', 'main printer', '-o', 'sides=two-sided-long-edge'],
    expect.anything(),
  );
});

test('propagates errors', async () => {
  const sender: Partial<WebContents> = {
    getPrintersAsync: () => Promise.resolve([]),
    printToPDF: jest.fn().mockRejectedValueOnce(new Error('PCLOADLETTER')),
  };
  const { ipcMain, ipcRenderer } = fakeIpc(sender);

  register(ipcMain);
  await expect(ipcRenderer.invoke(printChannel)).rejects.toThrowError(
    'PCLOADLETTER',
  );

  expect(sender.printToPDF).toHaveBeenCalled();
});

test('prints a specified number of copies', async () => {
  const sender: Partial<WebContents> = {
    getPrintersAsync: () => Promise.resolve([]),
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  };
  const { ipcMain, ipcRenderer } = fakeIpc(sender);

  register(ipcMain);

  getPreferredPrinterMock.mockReturnValueOnce(
    fakeElectronPrinter({ name: 'main printer' }),
  );

  execSyncMock.mockReturnValueOnce({ stdout: '', stderr: '' });

  await ipcRenderer.invoke(printChannel, { copies: 123 });

  expect(sender.printToPDF).toHaveBeenCalledWith({ printBackground: true });

  expect(execSyncMock).toHaveBeenCalledWith(
    'lpr',
    ['-P', 'main printer', '-o', 'sides=two-sided-long-edge', '-#', '123'],
    expect.anything(),
  );
});

test('does not allow fractional copies', async () => {
  const sender: Partial<WebContents> = {
    getPrintersAsync: () => Promise.resolve([]),
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  };
  const { ipcMain, ipcRenderer } = fakeIpc(sender);

  register(ipcMain);

  getPreferredPrinterMock.mockReturnValueOnce(
    fakeElectronPrinter({ name: 'main printer' }),
  );

  execSyncMock.mockReturnValueOnce({ stdout: '', stderr: '' });

  await expect(
    ipcRenderer.invoke(printChannel, { copies: 1.23 }),
  ).rejects.toThrowError();

  expect(sender.printToPDF).not.toHaveBeenCalled();
  expect(execSyncMock).not.toHaveBeenCalled();
});

test('allows specifying one-sided duplex', async () => {
  const sender: Partial<WebContents> = {
    getPrintersAsync: () => Promise.resolve([]),
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  };
  const { ipcMain, ipcRenderer } = fakeIpc(sender);

  register(ipcMain);

  getPreferredPrinterMock.mockReturnValueOnce(
    fakeElectronPrinter({ name: 'main printer' }),
  );

  execSyncMock.mockReturnValueOnce({ stdout: '', stderr: '' });

  await ipcRenderer.invoke(printChannel, { sides: PrintSides.OneSided });

  expect(execSyncMock).toHaveBeenCalledWith(
    'lpr',
    ['-P', 'main printer', '-o', 'sides=one-sided'],
    expect.anything(),
  );
});

test('allows specifying two-sided-short-edge duplex', async () => {
  const sender: Partial<WebContents> = {
    getPrintersAsync: () => Promise.resolve([]),
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  };
  const { ipcMain, ipcRenderer } = fakeIpc(sender);

  register(ipcMain);

  getPreferredPrinterMock.mockReturnValueOnce(
    fakeElectronPrinter({ name: 'main printer' }),
  );

  execSyncMock.mockReturnValueOnce({ stdout: '', stderr: '' });

  await ipcRenderer.invoke(printChannel, {
    sides: PrintSides.TwoSidedShortEdge,
  });

  expect(execSyncMock).toHaveBeenCalledWith(
    'lpr',
    ['-P', 'main printer', '-o', 'sides=two-sided-short-edge'],
    expect.anything(),
  );
});
