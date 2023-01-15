import { mockHandlerContext } from '../../test/mockHandlerContext';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import execAppScript from '../utils/execAppScript';
import register, { channel as signChannel } from './sign';

const execAppScriptMock = mockOf(execAppScript);
jest.mock('../utils/execAppScript');

beforeEach(() => {
  execAppScriptMock.mockReset();
  execAppScriptMock.mockResolvedValue({ stdout: '', stderr: '' });
});

test('call to sign invokes the right signing script command, but only if signatureType is well-formed', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, mockHandlerContext());

  execAppScriptMock.mockResolvedValue({
    stderr: '',
    stdout: 'untrusted comment: hello\nFAKESIGNATURERIGHTHERE==\n',
  });

  const signResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execAppScriptMock).toHaveBeenNthCalledWith(
    1,
    'sign.sh',
    { appScriptsDirectory: '/tmp', sudo: true },
    [],
    'test.hello',
  );

  expect(signResult).toBe('FAKESIGNATURERIGHTHERE==');

  execAppScriptMock.mockReset();

  const badTypeSignResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'this.hasperiodsandthatisbad',
    payload: 'hello',
  })) as string;

  expect(execAppScriptMock).not.toHaveBeenCalled();

  expect(badTypeSignResult).toBeUndefined();
});

test('call to sign when no script is specified returns undefined', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(
    ipcMain,
    mockHandlerContext({ options: { appScriptsDirectory: undefined } }),
  );

  const signResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execAppScriptMock).not.toHaveBeenCalled();

  expect(signResult).toBeUndefined();
});

test('call to sign when error occurs or exception thrown returns undefined', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, mockHandlerContext());

  execAppScriptMock.mockResolvedValue({
    stderr: 'oopsie daisy',
    stdout:
      'untrusted comment: hello\nFAKESIGNATURERIGHTHERETHATSHOULDNOTBERETURNEDBECAUSESTDERR==\n',
  });

  const signResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execAppScriptMock).toHaveBeenCalled();

  expect(signResult).toBeUndefined();

  execAppScriptMock.mockReset();

  execAppScriptMock.mockRejectedValueOnce('throwing cause I feel like it');

  const signResultWithThrow = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execAppScriptMock).toHaveBeenCalled();

  expect(signResultWithThrow).toBeUndefined();
});
