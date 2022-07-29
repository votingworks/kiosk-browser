import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import execSync from '../utils/execSync';
import register, { channel as totpGetChannel, TotpInfo } from './totp-get';

const execSyncMock = mockOf(execSync);
jest.mock('../utils/execSync');

beforeEach(() => {
  execSyncMock.mockReset();
  execSyncMock.mockReturnValue({ stdout: '', stderr: '' });
});

const { ipcMain, ipcRenderer } = fakeIpc();
register(ipcMain);

test('call to totp calls appropriate shell command and returns the right data', async () => {
  execSyncMock.mockReturnValueOnce({
    stdout: '2021-09-10 14:35:02: 932549',
    stderr: '',
  });

  const totpResult = (await ipcRenderer.invoke(totpGetChannel)) as TotpInfo;

  expect(execSyncMock).toHaveBeenNthCalledWith(1, 'sudo', [
    '-n',
    '/usr/local/bin/tpm2-totp',
    '-t',
    'show',
  ]);

  expect(totpResult).toEqual({
    // recomputing the ISO date here because not sure what timezone
    // this code is running in, so controlling for that here.
    isoDatetime: new Date('2021-09-10 14:35:02').toISOString(),
    code: '932549',
  });
});

test('when error in execSync, return undefined', async () => {
  execSyncMock.mockReturnValueOnce({
    stdout: '',
    stderr: 'TPM is nowhere to be found',
  });

  const totpResult = (await ipcRenderer.invoke(totpGetChannel)) as TotpInfo;

  expect(execSyncMock).toHaveBeenNthCalledWith(1, 'sudo', [
    '-n',
    '/usr/local/bin/tpm2-totp',
    '-t',
    'show',
  ]);

  expect(totpResult).toEqual(undefined);
});

test('when execSync throws, return undefined', async () => {
  execSyncMock.mockImplementation(() => {
    throw new Error("I don't know what's going on");
  });

  const totpResult = (await ipcRenderer.invoke(totpGetChannel)) as TotpInfo;

  expect(execSyncMock).toHaveBeenNthCalledWith(1, 'sudo', [
    '-n',
    '/usr/local/bin/tpm2-totp',
    '-t',
    'show',
  ]);

  expect(totpResult).toEqual(undefined);
});
