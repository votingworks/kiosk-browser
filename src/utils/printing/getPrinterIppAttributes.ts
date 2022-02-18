import exec from '../exec'
import { debug } from '.'

/**
 * IPP printer-state identifies the basic status of a printer.
 * Spec: https://datatracker.ietf.org/doc/html/rfc2911#section-4.4.11
 */
export enum IppPrinterState {
  Idle = 3,
  Processing = 4,
  Stopped = 5,
}

/**
 * IPP printer-state-reasons explain what's going on with a printer in detail.
 * Here, we map them to a human-readable explanation, both for user-friendliness
 * and developer documentation.
 * Spec: https://datatracker.ietf.org/doc/html/rfc2911#section-4.4.12
 *
 * Note that the actual printer-state-reasons sent by the printer may have a
 * suffix of either: "-report", "-warning", or "-error" (e.g. "media-jam-error").
 */
export const IppPrinterStateReasonMessage = {
  other: 'An unknown error occurred.',
  none: 'The printer is ready.',
  'media-needed': 'The printer is out of paper.',
  'media-jam': 'The printer has a paper jam.',
  'moving-to-paused': 'The printer is pausing.',
  paused: 'The printer is paused',
  shutdown: 'The printer is turned off or disconnected.',
  'timed-out': 'The printer is not responding.',
  stopping: 'The printer is stopping.',
  'stopped-partly': 'The printer is stopped.',
  'toner-low': 'The printer is low on toner.',
  'toner-empty': 'The printer is out of toner.',
  'spool-area-full': 'The spool area is full.',
  'cover-open': "The printer's cover is open.",
  'interlock-open': "The printer's interlock device is open.",
  'door-open': "The printer's door is open.",
  'input-tray-missing': "The printer's input tray is missing.",
  'media-low': 'The printer is low on paper.',
  'media-empty': 'The printer is out of paper.',
  'output-tray-missing': "The printer's output tray is missing.",
  'output-area-almost-full': "The printer's output tray is almost full.",
  'output-area-full': "The printer's output tray is full.",
  'marker-supply-low': 'The printer is low on ink.',
  'marker-supply-empty': 'The printer is out of ink.',
  'marker-waste-almost-full':
    "The printer's ink waste receptacle is almost full.",
  'marker-waste-full': "The printer's ink waste receptacle is full.",
  'fuser-over-temp': "The printer's fuser temperature is above normal.",
  'fuser-under-temp': "The printer's fuser temperature is below normal.",
  'opc-near-eol': "The printer's optical photo conductor is near end of life.",
  'opc-life-over':
    "The printer's optical photo conductor is no longer functioning.",
  'developer-low': 'The printer is low on developer.',
  'developer-empty': 'The printer is out of developer.',
  'interpreter-resource-unavailable': 'An interpreter resource is unavailable.',
}
// IppPrinterStateReason only covers the basic RFC spec reasons - there may be
// others, so we can't type them all.
export type IppPrinterStateReason =
  | keyof typeof IppPrinterStateReasonMessage
  | string

/**
 * "Marker" is a general name for ink/toner/etc. CUPS implements a variety of
 * marker-related IPP attributes prefixed with "marker-", e.g. "marker-levels".
 * Each attribute is a comma-delimated list of values, since a printer may have
 * multiple marker supplies (e.g. black and color ink cartridges). Here, we
 * represent the marker info for a single marker supply.
 * Spec: https://www.cups.org/doc/spec-ipp.html
 */
export interface IppMarkerInfo {
  name: string // e.g. "black cartridge"
  color: string // e.g. "#000000"
  type: string // e.g. "toner-cartridge"
  lowLevel: number // e.g. 2
  highLevel: number // e.g. 100
  level: number // e.g. 83
}

/**
 * A collection of status attributes we can get from a printer via IPP.
 */
export interface PrinterIppAttributes {
  state: IppPrinterState
  stateReason: IppPrinterStateReason
  markerInfos: IppMarkerInfo[]
}

/**
 * Query the printer for its status via IPP.
 */
export async function getPrinterIppAttributes(
  printerIppUri: string,
): Promise<PrinterIppAttributes> {
  const ippAttributesToQuery = [
    'printer-state',
    'printer-state-reasons',
    'marker-names',
    'marker-colors',
    'marker-types',
    'marker-low-levels',
    'marker-high-levels',
    'marker-levels',
  ]
  const ippQuery = `{
    OPERATION Get-Printer-Attributes
    GROUP operation-attributes-tag
    ATTR charset attributes-charset utf-8
    ATTR language attributes-natural-language en
    ATTR uri printer-uri $uri
    ATTR keyword requested-attributes all
  }`
  // ${ippAttributesToQuery.join(',')}
  // Tricky business: ipptool takes a query in file form, so we feed the query
  // string to stdin, and then pass /dev/stdin as the "file"
  const ipptoolArgs = ['-tv', printerIppUri, '/dev/stdin']
  // const ipptoolArgs = ['-tv', printerIppUri, 'get-printer-attributes.test']
  debug(
    'getting printer IPP attributes from ipptool, args=%o, query=%O',
    ipptoolArgs,
    ippQuery,
  )
  // TODO add a timeout
  const { stdout, stderr } = await exec(`ipptool`, ipptoolArgs, ippQuery)
  debug('ipptool stdout:\n%s', stdout)
  debug('ipptool stderr:\n%s', stderr)

  return {
    state: IppPrinterState.Idle,
    stateReason: 'none',
    markerInfos: [],
  }
}
