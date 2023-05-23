import { IpcMain, IpcMainInvokeEvent, PrinterInfo } from 'electron';
import * as z from 'zod';
import exec from '../utils/exec';
import getPreferredPrinter from '../utils/getPreferredPrinter';
import { debug } from '../utils/printing';

export const channel = 'print';

/**
 * This function could be easily inlined, except for this:
 * https://github.com/microsoft/TypeScript/issues/36295
 *
 * So once that bug is fixed we can inline this.
 */
function getPreferredPrinterName(printers: PrinterInfo[]): string | undefined {
  return getPreferredPrinter(printers)?.name;
}

const availablePaperSources = ['Tray1', 'Tray2', 'Tray3'];

export enum PrintSides {
  /**
   * One page per sheet, aka simplex or "Duplex=None".
   */
  OneSided = 'one-sided',

  /**
   * Two pages per sheet, aka "Duplex=DuplexNoTumble". This option prints such
   * that a right-side up portrait sheet flipped over on the long edge remains
   * right-side up, i.e. a regular left-to-right book.
   */
  TwoSidedLongEdge = 'two-sided-long-edge',

  /**
   * Two pages per sheet, aka "Duplex=DuplexTumble". This option prints such
   * that a right-side up portrait sheet flipped over on the short edge remains
   * right-side up, i.e. a bound-at-the-top ring binder.
   */
  TwoSidedShortEdge = 'two-sided-short-edge',
}

interface PrintOptions {
  deviceName?: string;
  paperSource?: string;
  copies?: number;
  sides?: PrintSides;
}

const PrintOptionsSchema = z.object({
  deviceName: z.string().nonempty().optional(),
  paperSource: z.string().nonempty().optional(),
  copies: z.number().positive().int().optional(),
  sides: z
    .enum(Object.values(PrintSides) as [PrintSides, ...PrintSides[]])
    .optional(),
});

interface PrintDataParameters extends PrintOptions {
  data: Buffer;
}

async function printData({
  data,
  deviceName,
  paperSource,
  copies,
  sides = PrintSides.TwoSidedLongEdge,
}: PrintDataParameters): Promise<void> {
  const lprOptions: string[] = [];

  if (deviceName) {
    lprOptions.push('-P', deviceName);
  }

  // duplex
  lprOptions.push('-o', `sides=${sides}`);

  // collate
  lprOptions.push('-o', 'collate=true');

  // -o already pushed, can add inputslot
  if (paperSource && availablePaperSources.includes(paperSource)) {
    lprOptions.push('InputSlot=' + paperSource);
  }

  if (typeof copies !== 'undefined') {
    lprOptions.push('-#', copies.toString());
  }

  debug('printing via lpr with args=%o', lprOptions);
  debug('data length is %d', data.length);
  const { stdout, stderr } = await exec('lpr', lprOptions, data);
  debug('`lpr` succeeded with stdout=%s stderr=%s', stdout, stderr);
}

/**
 * Enable directly printing without a prompt.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, options: PrintOptions = {}) => {
      const { deviceName, paperSource, copies, sides } =
        PrintOptionsSchema.parse(options);

      debug('printing to PDF');
      const data = await event.sender.printToPDF({
        printBackground: true,
      });
      debug('printed to PDF, size=%d', data.length);

      await printData({
        data,
        deviceName:
          deviceName ??
          getPreferredPrinterName(await event.sender.getPrintersAsync()),
        paperSource,
        copies,
        sides,
      });
    },
  );
}
