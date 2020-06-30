import { IpcMainInvokeEvent, IpcMain, PrinterInfo } from 'electron'
//import exec from '../utils/exec'
import { exec as realExec } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(realExec)

export const channel = 'getUsbDrives'

export interface UsbDrive {
  deviceName: string
  mountPoint: string
}

interface BlockDevice {
  name: string
  mountpoint: string
}

interface RawDataReturn {
  blockdevices: BlockDevice[]
}

// stupid little function as I figure out why exec from Brian's utils is not working for me yet
async function exec(cmd: string, params: string[]) {
  return await execAsync(cmd + ' ' + params.join(' '))
}

async function getUsbDrives(): Promise<UsbDrive[]> {
  try {
    const { stdout, stderr } = await exec('ls', ['/dev/disk/by-id/usb*part*'])

    console.log(stdout)

    if (stdout.trim() === '' || stderr != '') {
      return []
    }

    const devicesById = stdout.trim().split('\n')
    const devices = await Promise.all(
      devicesById.map(async (d: string) => {
        const { stdout, stderr } = await exec('readlink', ['-f', d])
        return stdout.trim()
      }),
    )

    console.log('Devices', devices)

    const usbDrives = await Promise.all(
      devices.map(async (d: string) => {
        const { stdout, stderr } = await exec('lsblk', ['-J', '-n', '-l', d])

        const rawData = JSON.parse(stdout) as RawDataReturn
        return {
          deviceName: rawData.blockdevices[0].name,
          mountPoint: rawData.blockdevices[0].mountpoint,
        }
      }),
    )

    return usbDrives
  } catch (e) {
    console.log('oy', e.stack)
    return []
  }
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => getUsbDrives())
}
