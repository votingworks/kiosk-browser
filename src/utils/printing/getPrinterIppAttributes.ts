import exec from '../exec'
import { debug } from '.'
import assert from 'assert'
import tmp from 'tmp-promise'
import fs from 'fs'

/**
 * IPP printer-state identifies the basic status of a printer.
 * Spec: https://datatracker.ietf.org/doc/html/rfc2911#section-4.4.11
 */
export enum IppPrinterState {
  Idle = 'idle', // 3
  Processing = 'processing', // 4
  Stopped = 'stopped', // 5
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
  other: 'An unknown error occurred.', // Custom reason added by us
  'sleep-mode': 'The printer is in sleep mode.', // Custom reason added by us
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
  state: IppPrinterState | null
  stateReasons: IppPrinterStateReason[]
  markerInfos: IppMarkerInfo[]
}

const ippAttributesToQuery = [
  'printer-state',
  'printer-state-reasons',
  'marker-names',
  'marker-colors',
  'marker-types',
  'marker-low-levels',
  'marker-high-levels',
  'marker-levels',
  'printer-alert-description',
]
const ippQuery = `{
  OPERATION Get-Printer-Attributes
  GROUP operation-attributes-tag
  ATTR charset attributes-charset utf-8
  ATTR language attributes-natural-language en
  ATTR uri printer-uri $uri
  ATTR keyword requested-attributes ${ippAttributesToQuery.join(',')}
}`

/**
 * Query the printer for its status via IPP.
 */
export async function getPrinterIppAttributes(
  printerIppUri: string,
): Promise<PrinterIppAttributes> {
  // ipptool takes a file to specify the query to make, so we write a temporary
  // file with the query text
  const queryFile = await tmp.file()
  await fs.promises.writeFile(queryFile.path, ippQuery)

  const ipptoolArgs = ['-T', '1', '-tv', printerIppUri, queryFile.path]
  debug('getting printer IPP attributes from ipptool, args=%o', ipptoolArgs)
  let ipptoolResult: { stdout: string; stderr: string }
  try {
    ipptoolResult = await exec(`ipptool`, ipptoolArgs)
    debug('ipptool stdout:\n%s', ipptoolResult.stdout)
    debug('ipptool stderr:\n%s', ipptoolResult.stderr)

    const attributes = parseIpptoolOutput(ipptoolResult.stdout)
    debug('parsed ipptool attributes: %O', attributes)

    const state = attributes['printer-state'] as IppPrinterState
    let stateReasons = wrapWithArray(
      attributes['printer-state-reasons'],
    ) as IppPrinterStateReason[]

    // On HP printers, printer-alert-description contains a list of the last few
    // status messages shown on the printer screen. When sleep mode is on, this
    // is the only place it shows up, and the printer appears idle (any errors -
    // e.g. "cover open" - are not returned in printer-state-reasons).
    const lastAlert = wrapWithArray(
      attributes['printer-alert-description'],
    ).pop()
    const isSleepModeOn = lastAlert == 'Sleep Mode'
    if (isSleepModeOn && state == 'idle') {
      stateReasons = ['sleep-mode']
    }

    const markerInfos = zip(
      wrapWithArray(attributes['marker-names']),
      wrapWithArray(attributes['marker-colors']),
      wrapWithArray(attributes['marker-types']),
      wrapWithArray(attributes['marker-low-levels']),
      wrapWithArray(attributes['marker-high-levels']),
      wrapWithArray(attributes['marker-levels']),
    ).map(
      ([name, color, type, lowLevel, highLevel, level]) =>
        ({
          name,
          color,
          type,
          lowLevel,
          highLevel,
          level,
        } as IppMarkerInfo),
    )

    return { state, stateReasons, markerInfos }
  } catch (error) {
    debug('ipptool error: %o', error)
    throw error
  } finally {
    queryFile.cleanup()
  }
}

/**
 * Parse the output of ipptool. It looks like this:
 *  query-filename:
 *      Get-Printer-Attributes:
 *          attributes-charset (charset) = utf-8
 *          attributes-natural-language (naturalLanguage) = en
 *          printer-uri (uri) = ipp://localhost:60000/ipp/print
 *          requested-attributes (1setOf keyword) = printer-state,printer-state-reasons
 *      query-filename                                                           [PASS]
 *          RECEIVED: 183 bytes in response
 *          status-code = successful-ok (successful-ok)
 *          attributes-charset (charset) = utf-8
 *          attributes-natural-language (naturalLanguage) = en
 *          printer-state (enum) = stopped
 *          printer-state-reasons (1setOf keyword) = media-empty-error,media-needed-error,media-empty-error
 */
type IppAttributes = {
  [attribute: string]: string | string[] | number | number[]
}
function parseIpptoolOutput(output: string): IppAttributes {
  let lines = output.split('\n')
  assert(lines.length > 0, 'ipptool output is empty')
  lines = lines.slice(
    lines.findIndex(line => line.trim().startsWith('RECEIVED')) + 1,
  )
  const statusLine = lines.shift()?.trim()
  assert(
    statusLine === 'status-code = successful-ok (successful-ok)',
    `Unsuccessful ipptool response: ${statusLine}`,
  )
  assert(lines.shift()?.trim() === 'attributes-charset (charset) = utf-8')
  assert(
    lines.shift()?.trim() ===
      'attributes-natural-language (naturalLanguage) = en',
  )

  const lineRegex = /^\s*(.+) \((.+)\) = (.*)$/
  const attributes = Object.fromEntries(
    lines
      .filter(line => line !== '')
      .map(line => {
        const matches = lineRegex.exec(line)
        if (!matches) {
          throw Error(`Unable to parse ipptool output line: ${line}`)
        }
        const [, attribute, type, value] = matches
        switch (type) {
          case 'keyword':
          case 'enum':
          case 'nameWithoutLanguage':
          case 'textWithoutLanguage':
            return [attribute, value]
          case 'integer':
            return [attribute, parseInt(value)]
          case '1setOf keyword':
          case '1setOf enum':
          case '1setOf nameWithoutLanguage':
          case '1setOf textWithoutLanguage':
            return [attribute, value.split(',')]
          case '1setOf integer':
            return [attribute, value.split(',').map(parseInt)]
          default:
            throw Error(`Unrecognized ipptool attribute type: ${type}`)
        }
      }),
  )
  return attributes
}

function wrapWithArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

function zip(...arrays: unknown[][]): unknown[][] {
  return arrays[0].map((_, i) => arrays.map(a => a[i]))
}
