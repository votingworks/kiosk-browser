import { IpcMainInvokeEvent, IpcMain, PrinterInfo } from 'electron'
//import exec from '../utils/exec'
import { exec as realExec } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(realExec)

export const channel = 'mountUsbDrive'

// stupid little function as I figure out why exec from Brian's utils is not working for me yet
async function exec(cmd: string, params: string[]) {
  return await execAsync(cmd + ' ' + params.join(' '))
}

async function mountUsbDrive(device: string): Promise<void> {
  const { stdout, stderr } = await exec('pmount', [
    '-w',
    '-u',
    '000',
    '-s',
    '/dev/' + device,
    'usb-drive-' + device,
  ])
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, device: string) => {
    await mountUsbDrive(device)
  })
}
