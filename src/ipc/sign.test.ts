import { Subject } from 'rxjs';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import exec from '../utils/exec';
import register, { channel as signChannel } from './sign';

const execMock = mockOf(exec);
jest.mock('../utils/exec');

beforeEach(() => {
  execMock.mockReset();
  execMock.mockReturnValue({ stdout: '', stderr: '' });
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

  execMock.mockReturnValue({
    stderr: '',
    stdout: 'untrusted comment: hello\nFAKESIGNATURERIGHTHERE==\n',
  });

  const signResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execMock).toHaveBeenNthCalledWith(1, '/tmp/sign.sh', [], 'test.hello');

  expect(signResult).toBe('FAKESIGNATURERIGHTHERE==');

  execMock.mockReset();

  const badTypeSignResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'this.hasperiodsandthatisbad',
    payload: 'hello',
  })) as string;

  expect(execMock).not.toHaveBeenCalled();

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

  expect(execMock).not.toHaveBeenCalled();

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

  execMock.mockReturnValue({
    stderr: 'oopsie daisy',
    stdout:
      'untrusted comment: hello\nFAKESIGNATURERIGHTHERETHATSHOULDNOTBERETURNEDBECAUSESTDERR==\n',
  });

  const signResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execMock).toHaveBeenCalled();

  expect(signResult).toBeUndefined();

  execMock.mockReset();

  execMock.mockImplementationOnce(() => {
    throw new Error('throwing cause I feel like it');
  });

  const signResultWithThrow = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execMock).toHaveBeenCalled();

  expect(signResultWithThrow).toBeUndefined();
});
