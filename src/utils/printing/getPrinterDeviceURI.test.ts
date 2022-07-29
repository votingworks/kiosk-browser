import execSync from '../execSync';
import { makeExecError } from '../execTypes';
import mockOf from '../../../test/mockOf';
import getPrinterDeviceURI from './getPrinterDeviceURI';

jest.mock('../execSync');

const execSyncMock = mockOf(execSync);

test('missing printer', () => {
  execSyncMock.mockImplementationOnce(() => {
    throw makeExecError({
      cmd: 'lpstat -v missing-printer',
      stderr: 'lpstat: Invalid destination name in list "missing-printer".',
    });
  });

  expect(getPrinterDeviceURI('missing-printer')).toBeUndefined();
  expect(execSyncMock).toHaveBeenCalledWith('lpstat', [
    '-v',
    'missing-printer',
  ]);
});

test('printer configured with valid destination', () => {
  execSyncMock.mockReturnValueOnce({
    stdout: 'device for valid-printer: usb://HP/Something\n',
    stderr: '',
  });

  expect(getPrinterDeviceURI('valid-printer')).toEqual('usb://HP/Something');
  expect(execSyncMock).toHaveBeenCalledWith('lpstat', ['-v', 'valid-printer']);
});

test('different printer returned from `lpstat`', () => {
  execSyncMock.mockReturnValueOnce({
    stdout: 'device for another-printer: usb://HP/Something\n',
    stderr: '',
  });

  expect(() => getPrinterDeviceURI('a-printer')).toThrowError(
    'lpstat returned a different printer than requested: another-printer != a-printer',
  );
  expect(execSyncMock).toHaveBeenCalledWith('lpstat', ['-v', 'a-printer']);
});

test('`lpstat` gibberish', () => {
  execSyncMock.mockReturnValueOnce({
    stdout: 'abba gazabba',
    stderr: '',
  });

  expect(getPrinterDeviceURI('a-printer')).toBeUndefined();
});
