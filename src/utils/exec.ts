import { spawnSync } from 'child_process';
import makeDebug from 'debug';

const debug = makeDebug('kiosk-browser:exec');

/**
 * Like `child_process.exec`, but with easy stdin.
 */
export default function exec(
  file: string,
  args: readonly string[] = [],
  input?: string | Buffer,
): { stdout: string; stderr: string } {
  debug('running command=%s args=%o stdin=%s', file, args, typeof input);
  const {
    stdout: stdoutBuffer,
    stderr: stderrBuffer,
    status,
    signal,
    error,
    pid,
  } = spawnSync(file, args, {
    input,
  });
  debug(
    'process %d exited with code=%d, signal=%s (command=%s args=%o)',
    pid,
    status,
    signal,
    file,
    args,
  );
  const stdout = stdoutBuffer.toString();
  const stderr = stderrBuffer.toString();
  if (error) {
    throw error;
  } else if (status !== 0) {
    throw makeExecError({
      code: status ?? undefined,
      signal,
      stdout,
      stderr,
      cmd: `${file} ${args.join(' ')}`,
    });
  }
  return { stdout, stderr };
}

export interface ExecError {
  code: number;
  killed: boolean;
  signal: string | null;
  stdout: string;
  stderr: string;
  cmd: string;
}

export function makeExecError({
  code = 1,
  signal = null,
  killed = false,
  stdout = '',
  stderr = '',
  cmd = '',
}: Partial<ExecError> = {}): ExecError & Error {
  const error = new Error(
    `Error: Command failed: ${cmd} (stdout=${stdout} stderr=${stderr})`,
  ) as unknown as ExecError & Error;

  Object.defineProperties(error, {
    killed: {
      value: killed,
    },

    code: {
      value: code,
    },

    signal: {
      value: signal,
    },

    cmd: {
      value: cmd,
    },

    stdout: {
      value: stdout,
    },

    stderr: {
      value: stderr,
    },
  });

  return error;
}
