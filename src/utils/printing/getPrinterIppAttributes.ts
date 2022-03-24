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
  Unknown = 'unknown', // We didn't get a response from the printer
  Idle = 'idle', // 3
  Processing = 'processing', // 4
  Stopped = 'stopped', // 5
}

/**
 * IPP printer-state-reasons explain what's going on with a printer in detail.
 * Spec: https://datatracker.ietf.org/doc/html/rfc2911#section-4.4.12
 * There are more possible reasons than covered in the spec, so we just type as string.
 *
 * Note that the actual printer-state-reasons sent by the printer may have a
 * suffix of either: "-report", "-warning", or "-error" (e.g. "media-jam-error").
 */
export type IppPrinterStateReason = string

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
export type PrinterIppAttributes =
  | { state: IppPrinterState.Unknown }
  | {
      state: IppPrinterState
      stateReasons: IppPrinterStateReason[]
      markerInfos: IppMarkerInfo[]
    }

export const ippAttributesToQuery = [
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
    if (lastAlert == 'Sleep Mode' && state == 'idle') {
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

type IppAttributes = {
  [attribute: string]: string | string[] | number | number[]
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

  const lineRegex = /^(.+) \((.+)\) = (.+)$/
  const attributes = Object.fromEntries(
    lines
      .filter(line => line !== '')
      .map(line => {
        line = line.trim()
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
            return [attribute, parseInt(value, 10)]
          case '1setOf keyword':
          case '1setOf enum':
          case '1setOf nameWithoutLanguage':
          case '1setOf textWithoutLanguage':
            return [attribute, value.split(',')]
          case '1setOf integer':
            return [
              attribute,
              value.split(',').map(number => parseInt(number, 10)),
            ]
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
