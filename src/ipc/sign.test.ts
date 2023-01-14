import { mockHandlerContext } from '../../test/mockHandlerContext';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import execScript from '../utils/execScript';
import register, { channel as signChannel } from './sign';

const execScriptMock = mockOf(execScript);
jest.mock('../utils/execScript');

beforeEach(() => {
  execScriptMock.mockReset();
  execScriptMock.mockResolvedValue({ stdout: '', stderr: '' });
});

test('call to sign invokes the right signing script command, but only if signatureType is well-formed', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, mockHandlerContext());

  execScriptMock.mockResolvedValue({
    stderr: '',
    stdout: 'untrusted comment: hello\nFAKESIGNATURERIGHTHERE==\n',
  });

  const signResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execScriptMock).toHaveBeenNthCalledWith(
    1,
    'sign.sh',
    { appScriptsDirectory: '/tmp', sudo: true },
    [],
    'test.hello',
  );

  expect(signResult).toBe('FAKESIGNATURERIGHTHERE==');

  execScriptMock.mockReset();

  const badTypeSignResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'this.hasperiodsandthatisbad',
    payload: 'hello',
  })) as string;

  expect(execScriptMock).not.toHaveBeenCalled();

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

  expect(execScriptMock).not.toHaveBeenCalled();

  expect(signResult).toBeUndefined();
});

test('call to sign when error occurs or exception thrown returns undefined', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, mockHandlerContext());

  execScriptMock.mockResolvedValue({
    stderr: 'oopsie daisy',
    stdout:
      'untrusted comment: hello\nFAKESIGNATURERIGHTHERETHATSHOULDNOTBERETURNEDBECAUSESTDERR==\n',
  });

  const signResult = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execScriptMock).toHaveBeenCalled();

  expect(signResult).toBeUndefined();

  execScriptMock.mockReset();

  execScriptMock.mockRejectedValueOnce('throwing cause I feel like it');

  const signResultWithThrow = (await ipcRenderer.invoke(signChannel, {
    signatureType: 'test',
    payload: 'hello',
  })) as string;

  expect(execScriptMock).toHaveBeenCalled();

  expect(signResultWithThrow).toBeUndefined();
});
