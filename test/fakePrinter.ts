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

export const fakeMarkerInfo = {
  color: '#000000',
  highLevel: 100,
  level: 100,
  lowLevel: 2,
  name: 'black cartridge',
  type: 'toner-cartridge',
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
    markerInfos: [fakeMarkerInfo],
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
        printer-state ${attributes['printer-state'] ?? '(enum) = idle'}
        printer-state-reasons ${attributes['printer-state-reasons'] ??
          '(keyword) = none'}
        printer-alert-description ${attributes['printer-alert-description'] ??
          '(1setOf textWithoutLanguage) = ,Sleep Mode,Ready'}
        marker-names ${attributes['marker-names'] ??
          '(nameWithoutLanguage) = black cartridge'}
        marker-colors ${attributes['marker-colors'] ??
          '(nameWithoutLanguage) = #000000'}
        marker-types ${attributes['marker-types'] ??
          '(keyword) = toner-cartridge'}
        marker-low-levels ${attributes['marker-low-levels'] ?? '(integer) = 2'}
        marker-high-levels ${attributes['marker-high-levels'] ??
          '(integer) = 100'}
        marker-levels ${attributes['marker-levels'] ?? '(integer) = 100'}
`
}
