import makeDebug from 'debug';
import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import exec, { ExecError } from '../utils/exec';

const debug = makeDebug('kiosk-browser:format-usb-drive');

export const channel = 'formatUsbDrive';

const PARTITION_FORMAT_CODES: Record<KioskBrowser.UsbFormat, string> = {
  fat32: 'c',
  exfat: '7',
};

const FS_MAX_NAME_LENGTH: Record<KioskBrowser.UsbFormat, number> = {
  fat32: 11,
  exfat: 15,
};

const MKFS_ARGS: Record<KioskBrowser.UsbFormat, string[]> = {
  fat32: ['mkfs.fat', '-F', '32'],
  exfat: ['mkfs.exfat'],
};

const DEVICE_REGEXP = /^(sd[a-z])\d*$/;

async function formatUsbDrive(
  device: string,
  options: KioskBrowser.FormatUsbOptions,
): Promise<void> {
  const maxNameLength = FS_MAX_NAME_LENGTH[options.format];
  if (options.name.length > maxNameLength) {
    debug('aborting usb reformat: name is too long');
    throw new Error(
      `Name "${options.name}" is longer than allowed length ${maxNameLength} for ${options.format}.`,
    );
  }

  const deviceRegexpMatch = device.match(DEVICE_REGEXP);
  if (!deviceRegexpMatch) {
    debug('aborting usb reformat: unable to parse the device name');
    throw new Error('Unable to determine disk name from device name.');
  }
  const disk = deviceRegexpMatch[1];
  const diskPath = join('/dev', disk);

  // The partition schema (see sfdisk man page for details) can specify
  // properties of the partition table (e.g. MBR vs. GPT) and of each partition.
  // We are only setting the type of partition but leaving everything else as
  // defaults: MBR, block start = 1 MiB, block size = maximum, not bootable
  const partitionSchema = `type=${PARTITION_FORMAT_CODES[options.format]}`;
  try {
    await exec(
      'sudo',
      [
        '-n',
        'sfdisk',
        '--wipe',
        'always',
        '--wipe-partitions',
        'always',
        diskPath,
      ],
      partitionSchema,
    );
  } catch (e) {
    const error = e as ExecError & Error;
    if (error.stderr.includes('This disk is currently in use')) {
      debug('aborting usb reformat: device is in use');
      throw new Error(
        'Cannot reformat drive while it is in use. Make sure to unmount the drive first.',
      );
    } else {
      debug('aborting usb reformat: unknown error partitioning disk');
      throw new Error(`Failed to partition drive with stderr: ${error.stderr}`);
    }
  }

  const partitionPath = `${diskPath}1`;
  await exec('sudo', [
    '-n',
    ...MKFS_ARGS[options.format],
    '-n',
    options.name,
    partitionPath,
  ]);
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (
      event: IpcMainInvokeEvent,
      device: string,
      options: KioskBrowser.FormatUsbOptions,
    ) => {
      await formatUsbDrive(device, options);
    },
  );
}
