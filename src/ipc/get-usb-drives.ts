import makeDebug from 'debug'
import { IpcMain } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import exec from '../utils/exec'

const debug = makeDebug('kiosk-browser:get-usb-drives')

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

interface MountedDevice {
  target: string
  source: string
}

interface FindMntRawDataReturn {
  filesystems: MountedDevice[]
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

    // Find any phantom usb drives that were improperly removed and need to be unmounted
    const { stdout } = await exec('findmnt', ['--json', '--list'])
    if (stdout !== '') {
      const rawData = JSON.parse(stdout) as FindMntRawDataReturn
      await Promise.all(
        rawData.filesystems.map(async ({ source, target }) => {
          if (source.startsWith('/')) {
            try {
              await fs.access(source)
            } catch {
              debug(
                'cleaning up phantom mount at %s missing its disk %s',
                target,
                source,
              )
              await exec('pumount', [target])
            }
          }
        }),
      )
    }

    return usbDrives
  } catch (e) {
    return []
  }
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => getUsbDrives())
}
