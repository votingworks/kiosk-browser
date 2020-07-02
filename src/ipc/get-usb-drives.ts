import { IpcMain } from 'electron'
import { promises as fs } from 'fs'
import exec from '../utils/exec'
import { join } from 'path'

export const channel = 'getUsbDrives'

export interface UsbDrive {
  deviceName: string
  mountPoint?: string
}

interface BlockDevice {
  name: string
  mountpoint: string | null
}

interface RawDataReturn {
  blockdevices: BlockDevice[]
}

const DEVICE_PATH_PREFIX = '/dev/disk/by-id/'
const USB_REGEXP = /^usb(.+)part(.*)$/

async function getUsbDrives(): Promise<UsbDrive[]> {
  try {
    // only the USB partitions
    const devicesById = (await fs.readdir(DEVICE_PATH_PREFIX)).filter(name =>
      USB_REGEXP.test(name),
    )

    // follow the symlinks
    const devices = await Promise.all(
      devicesById.map(async deviceId =>
        join(
          DEVICE_PATH_PREFIX,
          await fs.readlink(join(DEVICE_PATH_PREFIX, deviceId)),
        ),
      ),
    )

    // get the block device info, including mount point
    const usbDrives = await Promise.all(
      devices.map(async device => {
        const { stdout } = await exec('lsblk', ['-J', '-n', '-l', device])

        const rawData = JSON.parse(stdout) as RawDataReturn
        return {
          deviceName: rawData.blockdevices[0].name,
          mountPoint: rawData.blockdevices[0].mountpoint ?? undefined,
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
