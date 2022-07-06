import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import exec from '../utils/exec';
import register, { channel as totpGetChannel, TotpInfo } from './totp-get';

const execMock = mockOf(exec);
jest.mock('../utils/exec');

beforeEach(() => {
  execMock.mockReset();
  execMock.mockReturnValue({ stdout: '', stderr: '' });
});

const { ipcMain, ipcRenderer } = fakeIpc();
register(ipcMain);

test('call to totp calls appropriate shell command and returns the right data', async () => {
  execMock.mockReturnValueOnce({
    stdout: '2021-09-10 14:35:02: 932549',
    stderr: '',
  });

  const totpResult = (await ipcRenderer.invoke(totpGetChannel)) as TotpInfo;

  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
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

test('when error in exec, return undefined', async () => {
  execMock.mockReturnValueOnce({
    stdout: '',
    stderr: 'TPM is nowhere to be found',
  });

  const totpResult = (await ipcRenderer.invoke(totpGetChannel)) as TotpInfo;

  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    '-n',
    '/usr/local/bin/tpm2-totp',
    '-t',
    'show',
  ]);

  expect(totpResult).toEqual(undefined);
});

test('when exec throws, return undefined', async () => {
  execMock.mockImplementation(() => {
    throw new Error("I don't know what's going on");
  });

  const totpResult = (await ipcRenderer.invoke(totpGetChannel)) as TotpInfo;

  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    '-n',
    '/usr/local/bin/tpm2-totp',
    '-t',
    'show',
  ]);

  expect(totpResult).toEqual(undefined);
});
