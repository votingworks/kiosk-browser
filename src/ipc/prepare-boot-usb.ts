import makeDebug from 'debug';
import { IpcMain } from 'electron';
import execSync from '../utils/execSync';

export const channel = 'prepare-boot-usb';
const debug = makeDebug('kiosk-browser:prepare-boot-usb');

const BootableOptionPattern = /^Boot([0-9a-fA-F]+)\*?\s+(.+)$/;
const CurrentBootPattern = /^BootCurrent:\s*(.+)$/;

export interface BootOption {
  bootNumber: string; // The string representing the boot number i.e. `0001`
  restOfEntry: string; // The label for the bootable device i.e. 'Linpus Lite'
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
      const [bootNumber, restOfEntry] = match.slice(1);
      options.push({
        bootNumber,
        restOfEntry,
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
  const { stdout: bootStdout } = execSync('efibootmgr', ['-v']);
  const bootOptions = parseEfiBootMgrOutput(bootStdout);
  const linpusBootOption = bootOptions.find((bootOption) =>
    bootOption.restOfEntry.includes('Linpus'),
  );
  const usbHddBootOption = bootOptions.find((bootOption) =>
    bootOption.restOfEntry.includes('USB HDD'),
  );
  const bootMenuBootOption = bootOptions.find((bootOption) =>
    bootOption.restOfEntry.includes('Boot Menu'),
  );

  const nextBoot = linpusBootOption || usbHddBootOption || bootMenuBootOption;
  if (!nextBoot) {
    debug('No bootable usb device was found.');
    return false;
  }
  debug(
    'The USB boot option was properly located setting it to be next in the boot order…',
  );
  execSync('sudo', ['-n', '/bin/efibootmgr', '-n', nextBoot.bootNumber]);
  return true;
}

/**
 * Registers a handler to set the boot order to boot from the given usb device next.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => prepareToBootFromUsb());
}
