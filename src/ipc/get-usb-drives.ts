import { IpcMain } from 'electron'
import exec from '../utils/exec'

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

const DEVICE_PATH_PREFIX = '/dev/disk/by-id/'
const USB_REGEXP = RegExp('^usb(.+)part(.*)$')

async function getUsbDrives(): Promise<UsbDrive[]> {
  try {
    const { stdout, stderr } = await exec('ls', [DEVICE_PATH_PREFIX])

    if (stdout.trim() === '' || stderr != '') {
      return []
    }

    // only the USB partitions
    const devicesById = stdout.split('\n').filter((d: string) => {
      return USB_REGEXP.exec(d)
    })

    // follow the symlinks
    const devices = await Promise.all(
      devicesById.map(async (d: string) => {
        const { stdout } = await exec('readlink', [
          '-f',
          DEVICE_PATH_PREFIX + d,
        ])
        return stdout.trim()
      }),
    )

    // get the block device info, including mount point
    const usbDrives = await Promise.all(
      devices.map(async (d: string) => {
        const { stdout } = await exec('lsblk', ['-J', '-n', '-l', d])

        const rawData = JSON.parse(stdout) as RawDataReturn
        return {
          deviceName: rawData.blockdevices[0].name,
          mountPoint: rawData.blockdevices[0].mountpoint,
        }
      }),
    )

    return usbDrives
  } catch (e) {
    return []
  }
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => getUsbDrives())
}
