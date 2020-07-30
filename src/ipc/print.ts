import { IpcMainInvokeEvent, IpcMain, PrinterInfo } from 'electron'
import exec from '../utils/exec'
import { debug } from '../utils/printing'

import getPreferredPrinter from '../utils/getPreferredPrinter'

export const channel = 'print'

/**
 * This function could be easily inlined, except for this:
 * https://github.com/microsoft/TypeScript/issues/36295
 *
 * So once that bug is fixed we can inline this.
 */
function getPreferredPrinterName(printers: PrinterInfo[]): string | undefined {
  return getPreferredPrinter(printers)?.name
}

const availablePaperSources = ['Tray1', 'Tray2', 'Tray3']

interface PrintDataParameters {
  data: Buffer
  deviceName: string
  paperSource: string
}

async function printData({
  data,
  deviceName,
  paperSource,
}: PrintDataParameters): Promise<void> {
  const lprOptions: string[] = []

  if (deviceName) {
    lprOptions.push('-P', deviceName)
  }

  // duplex
  lprOptions.push('-o', 'sides=two-sided-long-edge')

  // -o already pushed, can add inputslot
  if (paperSource && availablePaperSources.includes(paperSource)) {
    lprOptions.push('InputSlot=' + paperSource)
  }

  debug('printing via lpr with args=%o', lprOptions)
  debug('data length is %d', data.length)
  const { stdout, stderr } = await exec('lpr', lprOptions, data)
  debug('`lpr` succeeded with stdout=%s stderr=%s', stdout, stderr)
}

/**
 * Enable directly printing without a prompt.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (
      event: IpcMainInvokeEvent,
      deviceName = getPreferredPrinterName(event.sender.getPrinters()),
      paperSource = '',
    ) => {
      debug('printing to PDF')
      const data = await event.sender.printToPDF({
        printBackground: true,
      })
      debug('printed to PDF, size=%d', data.length)

      await printData({
        data,
        deviceName,
        paperSource,
      })
    },
  )
}
