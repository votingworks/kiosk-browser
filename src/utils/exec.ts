import { spawn } from 'child_process'
import makeDebug from 'debug'

const debug = makeDebug('kiosk-browser:exec')

/**
 * Like `child_process.exec`, but with easy stdin.
 */
export default async function exec(
  file: string,
  args: readonly string[] = [],
  stdin?: string | Buffer,
): Promise<{ stdout: string; stderr: string }> {
  const child = spawn(file, args)
  let stdout = ''
  let stderr = ''

  debug(
    'running command=%s args=%o stdin=%s pid=%d',
    file,
    args,
    typeof stdin,
    child.pid,
  )

  child.stdout.on('data', chunk => {
    stdout += chunk
  })

  child.stderr.on('data', chunk => {
    stderr += chunk
  })

  if (stdin) {
    debug('stdin passed to exec, feeding it in now.')
    child.stdin.write(stdin)
    child.stdin.end()
  }

  return new Promise((resolve, reject) => {
    child.on('exit', (code, signal) => {
      debug(
        'process %d exited with code=%d, signal=%s (command=%s args=%o)',
        child.pid,
        code,
        signal,
        file,
        args,
      )

      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(
          makeExecError({
            code: code ?? undefined,
            signal,
            stdout,
            stderr,
            cmd: file,
          }),
        )
      }
    })
  })
}

export interface ExecError {
  code: number
  killed: boolean
  signal: string | null
  stdout: string
  stderr: string
  cmd: string
}

export function makeExecError({
  code = 1,
  signal = null,
  killed = false,
  stdout = '',
  stderr = '',
  cmd = '',
}: Partial<ExecError> = {}): ExecError & Error {
  const error = (new Error(
    `Error: Command failed: ${cmd}`,
  ) as unknown) as ExecError & Error

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
  })

  return error
}
