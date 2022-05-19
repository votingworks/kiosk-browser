import exec from '../exec';
import mockOf from '../../../test/mockOf';
import getConnectedDeviceURIs from './getConnectedDeviceURIs';

jest.mock('../exec', () => jest.fn());

const execMock = mockOf(exec);

describe('getConnectedDeviceURIs', () => {
  it('calls out to lpinfo without any schemes', async () => {
    execMock.mockResolvedValue({
      stdout: 'direct usb://HP/Color%20LaserJet?serial=1234',
      stderr: '',
    });

    expect(await getConnectedDeviceURIs()).toEqual(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    );

    expect(execMock).toHaveBeenCalledWith('lpinfo', ['-v']);
  });

  it('calls out to lpinfo with schemes', async () => {
    execMock.mockResolvedValue({
      stdout: 'direct usb://HP/Color%20LaserJet?serial=1234',
      stderr: '',
    });

    expect(await getConnectedDeviceURIs(new Set(['usb', 'ippusb']))).toEqual(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    );

    expect(execMock).toHaveBeenCalledWith('lpinfo', [
      '--include-schemes',
      'usb,ippusb',
      '-v',
    ]);
  });
});
