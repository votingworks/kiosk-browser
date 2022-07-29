import { Subject } from 'rxjs';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import execSync from '../utils/execSync';
import register, { channel as signChannel } from './sign';

const execSyncMock = mockOf(execSync);
jest.mock('../utils/execSync');

beforeEach(() => {
  execSyncMock.mockReset();
  execSyncMock.mockReturnValue({ stdout: '', stderr: '' });
});

const changedDevices = new Subject<Iterable<KioskBrowser.Device>>();
const autoconfiguredPrinter = new Subject<void>();

test('call to sign invokes the right signing script command, but only if signatureType is well-formed', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, {
    changedDevices,
    autoconfiguredPrinter,
    options: {
      signingScriptPath: '/tmp/sign.sh',
      url: new URL('about:blank'),
      originFilePermissions: [],
    },
  });

  execSyncMock.mockReturnValue({
    stderr: '',
    stdout: 'untrusted comment: hello\nFAKESIGNATURERIGHTHERE==\n',
  });

  const signResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execSyncMock).toHaveBeenNthCalledWith(
    1,
    '/tmp/sign.sh',
    [],
    'test.hello',
  );

  expect(signResult).toBe('FAKESIGNATURERIGHTHERE==');

  execSyncMock.mockReset();

  const badTypeSignResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'this.hasperiodsandthatisbad',
    payload: 'hello',
  })) as string;

  expect(execSyncMock).not.toHaveBeenCalled();

  expect(badTypeSignResult).toBeUndefined();
});

test('call to sign when no key is registered returns undefined', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, {
    changedDevices,
    autoconfiguredPrinter,
    options: {
      url: new URL('about:blank'),
      originFilePermissions: [],
    },
  });

  const signResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execSyncMock).not.toHaveBeenCalled();

  expect(signResult).toBeUndefined();
});

test('call to sign when error occurs or exception thrown returns undefined', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, {
    changedDevices,
    autoconfiguredPrinter,
    options: {
      signingScriptPath: '/tmp/sign.sh',
      url: new URL('about:blank'),
      originFilePermissions: [],
    },
  });

  execSyncMock.mockReturnValue({
    stderr: 'oopsie daisy',
    stdout:
      'untrusted comment: hello\nFAKESIGNATURERIGHTHERETHATSHOULDNOTBERETURNEDBECAUSESTDERR==\n',
  });

  const signResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execSyncMock).toHaveBeenCalled();

  expect(signResult).toBeUndefined();

  execSyncMock.mockReset();

  execSyncMock.mockImplementationOnce(() => {
    throw new Error('throwing cause I feel like it');
  });

  const signResultWithThrow = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execSyncMock).toHaveBeenCalled();

  expect(signResultWithThrow).toBeUndefined();
});
