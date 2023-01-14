import exec from './exec';
import execScript from './execScript';
import mockOf from '../../test/mockOf';

const execMock = mockOf(exec);
jest.mock('./exec');

test('execScript with sudo', async () => {
  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  await execScript(
    'script.sh',
    { appScriptsDirectory: '/tmp', sudo: true },
    ['arg'],
    'stdin',
  );
  expect(execMock).toHaveBeenCalledTimes(1);
  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    ['-n', '/tmp/script.sh', 'arg'],
    'stdin',
  );
});

test('execScript without sudo', async () => {
  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  await execScript(
    'script.sh',
    { appScriptsDirectory: '/tmp' },
    ['arg'],
    'stdin',
  );
  expect(execMock).toHaveBeenCalledTimes(1);
  expect(execMock).toHaveBeenCalledWith('/tmp/script.sh', ['arg'], 'stdin');
});

test('no appScriptsDirectoryProvided', async () => {
  await execScript('script.sh', {}, []);
  expect(execMock).not.toHaveBeenCalled();
});
