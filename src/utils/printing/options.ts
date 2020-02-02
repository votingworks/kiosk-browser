import exec from '../exec'
import { debug } from '.'

export interface PrinterOption {
  readonly key: string
  readonly label: string
  readonly values: readonly string[]
  readonly defaultValue?: string
}

export interface PrinterOptionMap {
  [key: string]: PrinterOption
}

const LpoptionsLinePattern = /^(.+)\/(.+): (.+)$/

/**
 * Parses `lpoptions -l` output.
 */
export function parsePrinterOptions(lptionsOutput: string): PrinterOptionMap {
  const options: PrinterOptionMap = {}

  for (const line of lptionsOutput.split('\n')) {
    if (!line) {
      continue
    }

    const match = LpoptionsLinePattern.exec(line)

    if (match) {
      const [key, label, valuesString] = match.slice(1)
      const values = valuesString.split(/\s+/)
      let defaultValue: string | undefined

      for (const [i, annotatedValue] of values.entries()) {
        if (annotatedValue.startsWith('*')) {
          const value = annotatedValue.slice(1)
          values[i] = value
          defaultValue = value
          break
        }
      }

      options[key] = { key, label, values, defaultValue }
    }
  }

  return options
}

/**
 * Gets printer options for a given printer, or the default printer.
 *
 * @param deviceName the name of the printer as understood by `lpoptions`
 */
export async function getPrinterOptions(
  deviceName?: string,
): Promise<PrinterOptionMap> {
  const lpoptionsArgs: string[] = []

  if (deviceName) {
    lpoptionsArgs.push('-p', deviceName)
  }

  lpoptionsArgs.push('-l') // -l == list

  debug('calling lpoptions with args=%o', lpoptionsArgs)
  const { stdout, stderr } = await exec('lpoptions', lpoptionsArgs)
  debug('lpoptions returned stdout=%s, stderr=%s', stdout, stderr)

  const options = parsePrinterOptions(stdout)
  debug('parsed as options=%O', options)
  return options
}
