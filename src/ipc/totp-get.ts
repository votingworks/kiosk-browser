import { IpcMain, IpcMainInvokeEvent } from 'electron'
import exec from '../utils/exec'

export const channel = 'totpGet'

export interface TotpInfo {
  isoDatetime: string
  code: string
}

async function totpGet(): Promise<TotpInfo | undefined> {
  try {
    const { stdout, stderr } = await exec('sudo', [
      '-n',
      '/usr/local/bin/tpm2-totp',
      'show',
    ])

    if (stderr) return undefined

    const [timestamp, code] = stdout.split(': ')

    return {
      isoDatetime: new Date(timestamp).toISOString(),
      code,
    }
  } catch {
    return undefined
  }
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent) => totpGet())
}
