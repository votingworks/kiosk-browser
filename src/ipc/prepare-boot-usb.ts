import makeDebug from 'debug';
import { IpcMain } from 'electron';
import exec from '../utils/exec';
import { RawDataReturn } from './get-usb-drives';

export const channel = 'prepare-boot-usb';
const debug = makeDebug('kiosk-browser:prepare-boot-usb');

const BootableOptionPattern = /^Boot([0-9a-fA-F]+)\*?\s+(.+)\s+(.+)$/;
const HardDriveDetailsPattern = /^HD\(.+,.+,(.+),.+,.+\).+$/;
const CurrentBootPattern = /^BootCurrent:\s*(.+)$/;
const BOOT_MENU_OPTION = 'Boot Menu';

export interface BootOption {
  bootNumber: string; // The string representing the boot number i.e. `0001`
  bootLabel: string; // The label for the bootable device i.e. 'Linpus Lite'
  partitionUUID?: string; // For bootable hard drives, the partition UUID of the bootable partition.
  isCurrentBoot: boolean;
}

function parseEfiBootMgrOutput(output: string): BootOption[] {
  const options: BootOption[] = [];
  const outputLines = output.split('\n');
  let currentBootNumber = '';
  for (const line of outputLines) {
    if (!line) {
      continue;
    }
    const match = CurrentBootPattern.exec(line);
    if (match) {
      currentBootNumber = match.slice(1)[0];
    }
  }

  for (const line of outputLines) {
    if (!line) {
      continue;
    }
    const match = BootableOptionPattern.exec(line);

    if (match) {
      const [bootNumber, bootLabel, verboseDetails] = match.slice(1);
      const partUUIDMatch = HardDriveDetailsPattern.exec(verboseDetails);
      const partitionUUID = partUUIDMatch
        ? partUUIDMatch.slice(1)[0]
        : undefined;
      debug(
        `Parsed bootable option with bootNumber: ${bootNumber} and label: ${bootLabel}`,
      );
      if (partitionUUID) {
        debug(
          `Bootable Device ${bootLabel} has partition UUID: ${partitionUUID}`,
        );
      }
      options.push({
        bootNumber,
        bootLabel,
        partitionUUID,
        isCurrentBoot: currentBootNumber === bootNumber,
      });
    }
  }
  return options;
}

/**
 * Attempts to update set the boot manager to boot from a usb device. Returns true
 * if successful, returns false if there are either 0 or more then 1 bootable usb drives available.
 */
function prepareToBootFromUsb(): boolean {
  const { stdout: bootStdout } = exec('efibootmgr', ['-v']);
  const bootOptions = parseEfiBootMgrOutput(bootStdout);
  const { stdout: lsblkStdout } = exec('lsblk', [
    '-o',
    'partuuid,name',
    '-J',
    '-l',
  ]);
  const rawData = JSON.parse(lsblkStdout) as RawDataReturn;
  let bootableUsbOption = undefined;
  for (const { name, partuuid } of rawData.blockdevices) {
    if (name.startsWith('sd') && partuuid) {
      const matchingBootOption = bootOptions.find(
        (bootOption) =>
          !bootOption.isCurrentBoot &&
          bootOption.partitionUUID === `0x${partuuid.split('-')[0]}`,
      );
      if (matchingBootOption !== undefined) {
        if (
          bootableUsbOption !== undefined &&
          bootableUsbOption !== matchingBootOption
        ) {
          // There are more then one bootable usb drives connected to the machine.
          debug('More then one bootable usb device was found.');
          return false;
        }
        bootableUsbOption = matchingBootOption;
      }
    }
  }
  bootableUsbOption ??= bootOptions.find(
    (bootOption) => bootOption.bootLabel === BOOT_MENU_OPTION,
  );
  if (!bootableUsbOption) {
    debug('No bootable usb device was found.');
    return false;
  }
  debug(
    'The USB boot option was properly located setting it to be next in the boot order…',
  );
  exec('sudo', ['-n', '/bin/efibootmgr', '-n', bootableUsbOption.bootNumber]);
  return true;
}

/**
 * Registers a handler to set the boot order to boot from the given usb device next.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => prepareToBootFromUsb());
}
