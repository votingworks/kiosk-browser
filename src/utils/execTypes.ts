export interface ExecResult {
  stdout: string;
  stderr: string;
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
