import Electron from 'electron'
import {
  IppPrinterState,
  ippAttributesToQuery,
} from '../src/utils/printing/getPrinterIppAttributes'
import { PrinterInfo } from '../src/ipc/get-printer-info'

export function fakeElectronPrinter(
  printer: Partial<Electron.PrinterInfo> = {},
): Electron.PrinterInfo {
  return {
    description: printer.name ?? 'main printer',
    isDefault: true,
    name: 'main printer',
    status: 0,
    ...printer,
  }
}

export function fakePrinterInfo(
  printer: Partial<Electron.PrinterInfo> = {},
): PrinterInfo {
  const electronPrinter = fakeElectronPrinter(printer)
  return {
    name: electronPrinter.name,
    description: electronPrinter.description,
    isDefault: electronPrinter.isDefault,
    state: IppPrinterState.Idle,
    connected: true,
    stateReasons: ['none'],
    markerInfos: [
      {
        color: '#000000',
        highLevel: 100,
        level: 100,
        lowLevel: 2,
        name: 'black cartridge',
        type: 'toner-cartridge',
      },
    ],
  }
}

export function fakeIpptoolStdout(
  attributes: {
    [attribute in typeof ippAttributesToQuery[number]]?: string
  } = {},
): string {
  return `"/tmp/tmp-122141-YkVU4ekfP1Eg":
    Get-Printer-Attributes:
        attributes-charset (charset) = utf-8
        attributes-natural-language (naturalLanguage) = en
        printer-uri (uri) = ipp://localhost:60000/ipp/print
        requested-attributes (1setOf keyword) = printer-state,printer-state-reasons,marker-names,marker-colors,marker-types,marker-low-levels,marker-high-levels,marker-levels,printer-alert-description
    /tmp/tmp-122141-YkVU4ekfP1Eg                                         [PASS]
        RECEIVED: 395 bytes in response
        status-code = successful-ok (successful-ok)
        attributes-charset (charset) = utf-8
        attributes-natural-language (naturalLanguage) = en
        printer-state (enum) = ${attributes['printer-state'] ?? 'idle'}
        printer-state-reasons (keyword) = ${attributes[
          'printer-state-reasons'
        ] ?? 'none'}
        printer-alert-description (1setOf textWithoutLanguage) = ${attributes[
          'printer-alert-description'
        ] ?? ',Sleep Mode,Ready'}
        marker-names (nameWithoutLanguage) = ${attributes['marker-names'] ??
          'black cartridge'}
        marker-colors (nameWithoutLanguage) = ${attributes['marker-colors'] ??
          '#000000'}
        marker-types (keyword) = ${attributes['marker-types'] ??
          'toner-cartridge'}
        marker-low-levels (integer) = ${attributes['marker-low-levels'] ?? '2'}
        marker-high-levels (integer) = ${attributes['marker-high-levels'] ??
          '100'}
        marker-levels (integer) = ${attributes['marker-levels'] ?? '100'}
`
}
