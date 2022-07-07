import exec, { makeExecError } from '../exec';
import mockOf from '../../../test/mockOf';
import getPrinterDeviceURI from './getPrinterDeviceURI';

jest.mock('../exec');

const execMock = mockOf(exec);

test('missing printer', () => {
  execMock.mockImplementationOnce(() => {
    throw makeExecError({
      cmd: 'lpstat -v missing-printer',
      stderr: 'lpstat: Invalid destination name in list "missing-printer".',
    });
  });

  expect(getPrinterDeviceURI('missing-printer')).toBeUndefined();
  expect(execMock).toHaveBeenCalledWith('lpstat', ['-v', 'missing-printer']);
});

test('printer configured with valid destination', () => {
  execMock.mockReturnValueOnce({
    stdout: 'device for valid-printer: usb://HP/Something\n',
    stderr: '',
  });

  expect(getPrinterDeviceURI('valid-printer')).toEqual('usb://HP/Something');
  expect(execMock).toHaveBeenCalledWith('lpstat', ['-v', 'valid-printer']);
});

test('different printer returned from `lpstat`', () => {
  execMock.mockReturnValueOnce({
    stdout: 'device for another-printer: usb://HP/Something\n',
    stderr: '',
  });

  expect(() => getPrinterDeviceURI('a-printer')).toThrowError(
    'lpstat returned a different printer than requested: another-printer != a-printer',
  );
  expect(execMock).toHaveBeenCalledWith('lpstat', ['-v', 'a-printer']);
});

test('`lpstat` gibberish', () => {
  execMock.mockReturnValueOnce({
    stdout: 'abba gazabba',
    stderr: '',
  });

  expect(getPrinterDeviceURI('a-printer')).toBeUndefined();
});
