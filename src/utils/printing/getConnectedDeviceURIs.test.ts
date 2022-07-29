import execSync from '../execSync';
import mockOf from '../../../test/mockOf';
import getConnectedDeviceURIs from './getConnectedDeviceURIs';

jest.mock('../execSync', () => jest.fn());

const execSyncMock = mockOf(execSync);

describe('getConnectedDeviceURIs', () => {
  it('calls out to lpinfo without any schemes', () => {
    execSyncMock.mockReturnValue({
      stdout: 'direct usb://HP/Color%20LaserJet?serial=1234',
      stderr: '',
    });

    expect(getConnectedDeviceURIs()).toEqual(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    );

    expect(execSyncMock).toHaveBeenCalledWith('lpinfo', ['-v']);
  });

  it('calls out to lpinfo with schemes', () => {
    execSyncMock.mockReturnValue({
      stdout: 'direct usb://HP/Color%20LaserJet?serial=1234',
      stderr: '',
    });

    expect(getConnectedDeviceURIs(new Set(['usb', 'ippusb']))).toEqual(
      new Set(['usb://HP/Color%20LaserJet?serial=1234']),
    );

    expect(execSyncMock).toHaveBeenCalledWith('lpinfo', [
      '--include-schemes',
      'usb,ippusb',
      '-v',
    ]);
  });
});
