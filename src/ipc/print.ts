import { IpcMainInvokeEvent, IpcMain, PrinterInfo } from 'electron'
import { file } from 'tmp-promise'
import * as fs from 'fs'
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

interface PrintFileParameters {
  filePath: string
  deviceName: string
  paperSource: string
}

async function printFile({
  filePath,
  deviceName,
  paperSource,
}: PrintFileParameters): Promise<void> {
  const lprOptions = []

  if (deviceName) {
    lprOptions.push('-P', deviceName)
  }

  if (paperSource && paperSource in availablePaperSources) {
    lprOptions.push('-o', 'InputSlot=' + paperSource)
  }

  lprOptions.push(filePath)

  debug('printing via lpr with args=%o', lprOptions)
  await exec('lpr', lprOptions)
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

      const tmpFile = await file()
      await fs.promises.writeFile(tmpFile.path, data)
      debug('wrote PDF to temporary file: %s', tmpFile.path)

      try {
        await printFile({
          deviceName,
          paperSource,
          filePath: tmpFile.path,
        })
      } finally {
        debug('removing temporary PDF file: %s', tmpFile.path)
        await tmpFile.cleanup()
      }
    },
  )
}
