import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { DateTime } from 'luxon'
import { KioskBrowser } from '../../types/kiosk-window'
import exec from '../utils/exec'

export const channel = 'setClock'

async function clockSet({
  isoDatetime,
  IANAZone,
}: KioskBrowser.SetClockParams): Promise<void> {
  const datetimeString = DateTime.fromISO(isoDatetime, {
    zone: IANAZone,
  }).toFormat('yyyy-LL-dd TT')
  await exec('sudo', ['-n', '/usr/bin/timedatectl', 'set-time', datetimeString])
  await exec('sudo', ['-n', '/usr/bin/timedatectl', 'set-timezone', IANAZone])
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, params: KioskBrowser.SetClockParams) => {
      await clockSet(params)
    },
  )
}
