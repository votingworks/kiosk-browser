import { WebContents } from 'electron';
import {
  fakeElectronPrinter,
  fakePrinterInfo,
  fakeIpptoolStdout,
} from '../../test/fakePrinter';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import getConnectedDeviceURIs from '../utils/printing/getConnectedDeviceURIs';
import { IppPrinterState } from '../utils/printing/getPrinterIppAttributes';
import register, {
  channel as getPrinterInfoChannel,
  getPrinterInfo,
} from './get-printer-info';
import exec from '../utils/exec';

jest.mock('../utils/printing/getConnectedDeviceURIs');
jest.mock('../utils/exec');

describe('getPrinterInfo', () => {
  it('expands the printer info with connected=true if lpinfo shows the device', () => {
    mockOf(getConnectedDeviceURIs).mockReturnValueOnce(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    );

    expect(
      getPrinterInfo([
        fakeElectronPrinter(),
        fakeElectronPrinter({
          options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        }),
      ]),
    ).toEqual([
      expect.objectContaining({ connected: false }),
      expect.objectContaining({ connected: true }),
    ]);
  });

  it('expands the printer info with connected=false if lpinfo does not show the device', () => {
    mockOf(getConnectedDeviceURIs).mockReturnValue(new Set());

    expect(
      getPrinterInfo([
        fakeElectronPrinter({
          options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        }),
      ]),
    ).toEqual([expect.objectContaining({ connected: false })]);
  });

  it('expands the printer info with connected=true if lpinfo shows the device after a momentary blip', () => {
    mockOf(getConnectedDeviceURIs).mockReturnValueOnce(new Set());
    mockOf(getConnectedDeviceURIs).mockReturnValueOnce(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    );

    expect(
      getPrinterInfo([
        fakeElectronPrinter(),
        fakeElectronPrinter({
          options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        }),
      ]),
    ).toEqual([
      expect.objectContaining({ connected: false }),
      expect.objectContaining({ connected: true }),
    ]);
  });

  it('adds IPP attributes for connected printers', () => {
    mockOf(getConnectedDeviceURIs).mockReturnValueOnce(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    );
    mockOf(exec).mockReturnValue({
      stdout: fakeIpptoolStdout(),
      stderr: '',
    });

    expect(
      getPrinterInfo([
        fakeElectronPrinter(),
        fakeElectronPrinter({
          name: 'other printer',
          isDefault: false,
          options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        }),
      ]),
    ).toEqual([
      {
        ...fakePrinterInfo(),
        connected: false,
        state: IppPrinterState.Unknown,
        stateReasons: undefined,
        markerInfos: undefined,
      },
      {
        ...fakePrinterInfo(),
        connected: true,
        name: 'other printer',
        description: 'other printer',
        isDefault: false,
        options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
      },
    ]);
  });

  it('adds empty IPP attributes if ipptool fails', () => {
    mockOf(getConnectedDeviceURIs).mockReturnValueOnce(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    );
    mockOf(exec).mockImplementation(() => {
      throw new Error('ipptool failed');
    });

    expect(
      getPrinterInfo([
        fakeElectronPrinter({
          options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        }),
      ]),
    ).toEqual([
      {
        ...fakePrinterInfo(),
        options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        state: IppPrinterState.Unknown,
        markerInfos: undefined,
        stateReasons: undefined,
      },
    ]);
  });

  it('retries if ipptool fails', () => {
    mockOf(getConnectedDeviceURIs).mockReturnValueOnce(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    );
    mockOf(exec)
      .mockImplementationOnce(() => {
        throw new Error('ipptool failed');
      })
      .mockReturnValueOnce({ stdout: fakeIpptoolStdout(), stderr: '' });

    expect(
      getPrinterInfo([
        fakeElectronPrinter({
          options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
        }),
      ]),
    ).toEqual([
      {
        ...fakePrinterInfo(),
        options: { 'device-uri': 'usb://HP/Color%20LaserJet?serial=1234' },
      },
    ]);
  });
});

test('registers an IPC handler for getting printer info', async () => {
  const sender: Partial<WebContents> = {
    getPrintersAsync(): Promise<Electron.PrinterInfo[]> {
      return Promise.resolve([
        fakeElectronPrinter({
          options: {
            'device-uri': 'usb://HP/Color%20LaserJet?serial=1234',
          },
        }),
      ]);
    },
  };
  const { ipcMain, ipcRenderer } = fakeIpc(sender);

  register(ipcMain);

  mockOf(getConnectedDeviceURIs).mockReturnValueOnce(
    new Set(['usb://HP/Color%20LaserJet?serial=1234']),
  );

  expect(await ipcRenderer.invoke(getPrinterInfoChannel)).toEqual([
    expect.objectContaining({ connected: true }),
  ]);
});
