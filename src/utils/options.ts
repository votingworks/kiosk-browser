import { PrintConfig } from './printing'
import { promises } from 'fs'
import { isAbsolute, join } from 'path'
import chalk from 'chalk'
import makeDebug from 'debug'

const debug = makeDebug('kiosk-browser:options')

export interface Options {
  url: URL
  autoconfigurePrintConfig?: PrintConfig
  allowDevtools?: boolean
}

export interface Help {
  help: true
}

export interface Invalid {
  error: Error
}

/**
 * Gets the URL to navigate.
 */
export default async function parseOptions(
  argv: typeof process.argv = [],
  env: typeof process.env = {},
): Promise<Options | Help | Invalid> {
  debug('parsing options from argv=%o and env=%O', argv, env)

  let urlArg: string | undefined
  let autoconfiurePrintConfigArg: string | undefined
  let helpArg: string | undefined
  let allowDevtoolsArg: boolean | undefined

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '--url' || arg === '-u') {
      i++
      urlArg = getOptionValue()
      debug('got option for %s: %s', arg, urlArg)
    } else if (arg === '--autoconfigure-print-config' || arg === '-p') {
      i++
      autoconfiurePrintConfigArg = getOptionValue()
      debug('got option for %s: %s', arg, autoconfiurePrintConfigArg)
    } else if (arg === '--allow-devtools') {
      allowDevtoolsArg = true
      debug('got flag: %s', arg)
    } else if (arg === '--help' || arg === '-h') {
      helpArg = arg
    } else if (!arg.startsWith('-')) {
      if (urlArg) {
        return { error: new Error(`duplicate URL argument: ${arg}`) }
      }
      urlArg = arg
      debug('got implicit URL argument: %s', urlArg)
    } else {
      debug('unexpected option: %s', arg)
      return { error: new Error(`unexpected option: ${arg}`) }
    }

    // eslint-disable-next-line no-inner-declarations
    function getOptionValue(): string {
      if (i >= argv.length) {
        throw new Error(`expected value for option: ${arg}`)
      }

      return argv[i]
    }
  }

  if (helpArg ?? env.KIOSK_BROWSER_HELP) {
    return { help: true }
  }

  const options = {
    url: new URL(urlArg ?? env.KIOSK_BROWSER_URL ?? 'about:blank'),
    autoconfigurePrintConfig: await loadPrintConfig(
      autoconfiurePrintConfigArg ??
        env.KIOSK_BROWSER_AUTOCONFIGURE_PRINT_CONFIG,
    ),
    allowDevtools:
      allowDevtoolsArg ?? env.KIOSK_BROWSER_ALLOW_DEVTOOLS === 'true',
  }

  debug('parsed options: %O', options)

  return options
}

export async function loadPrintConfig(
  printConfigPath?: string,
): Promise<PrintConfig | undefined> {
  if (typeof printConfigPath === 'undefined') {
    return
  }

  const printConfigJSON = await promises.readFile(printConfigPath, 'utf8')
  const printConfig: PrintConfig = JSON.parse(printConfigJSON)

  for (const printer of printConfig.printers) {
    if ('path' in printer.ppd) {
      if (!isAbsolute(printer.ppd.path)) {
        printer.ppd.path = join(printConfigPath, '..', printer.ppd.path)
      }
    }
  }

  return printConfig
}

export function printHelp(out = process.stdout): void {
  const b = chalk.bold.underline
  const i = chalk.italic.green
  const c = chalk.dim
  const jK = chalk.cyan
  const jS = chalk.red
  const jN = chalk.yellow
  const str = chalk.blue('string')
  const num = chalk.blue('number')
  const text = `
kiosk-browser [OPTIONS] [URL]

${b('Options')}
  -u, --url URL                          Visit this URL on load.
  -p, --autoconfigure-print-config PATH  Automatically configures connected printers according to the given config.
      --allow-devtools                   Allow devtools to be opened by pressing Ctrl/Cmd+Shift+I.

${b('Auto-Configure Printers')}
kiosk-browser can automatically discover and configure printers. To do so, you
must provide a config file with the following schema:

${i('PrintConfig')} {
  printerName: ${str}   ${c(
    '# What to name the configured printer, passed to `lpadmin`',
  )}
  printers: ${i('Printer')}[]   ${c('# Which printers to look for')}
}

${i('Printer')} {
  ${c('# Find these ids by plugging in the printer and running `lsusb`')}
  ${c('# The line looks like "Bus 001 Device 001: ID VVVV:PPPP …"')}
  vendorId: ${num}      ${c('# VVVV in `lsusb` output')}
  productId: ${num}     ${c('# PPPP in `lsusb` output')}
  baseDeviceURI: ${str} ${c('# Use `lpinfo --include-schemes usb -v`')}
  label: ${str}         ${c('# Pick any label you want for your own purposes')}
  ppd: PPD
}

${c('# PostScript Printer Definition')}
${i('PPD')} {
  ${c('# Exactly one of `model` or `path` may be given')}
  model: ${str}        ${c(
    '# A model string to be given to `lpadmin` `-m` option',
  )}
  path: ${str}         ${c(
    '# A `.ppd` file to be given to `lpadmin` `-P` option',
  )}
                       ${c(
                         '# Must be either relative to the config file or absolute',
                       )}
}

Here's an example:

{
  ${jK('"printerName"')}: ${jS('"VxPrinter"')},
  ${jK('"printers"')}: [
    {
      ${jK('"label"')}: ${jS('"Brother HL-L5100DN"')},
      ${jK('"vendorId"')}: ${jN(1273)},
      ${jK('"productId"')}: ${jN(99999)},
      ${jK('"baseDeviceURI"')}: ${jS('"usb://Brother/HL-L5100DN%20series"')},
      ${jK('"ppd"')}: {
        ${jK('"model"')}: ${jS(
    '"foomatic-db-compressed-ppds:0/ppd/foomatic-ppd/Generic-PCL_6_PCL_XL_Printer-pxlcolor.ppd"',
  )}
      }
    },
    {
      ${jK('"label"')}: ${jS('"HP LaserJet Pro M404"')},
      ${jK('"vendorId"')}: ${jN(1008)},
      ${jK('"productId"')}: ${jN(99999)},
      ${jK('"baseDeviceURI"')}: ${jS('"usb://HP/LaserJet%20Pro%20M404-M405"')},
      ${jK('"ppd"')}: {
        ${jK('"path"')}: ${jS('"hp-laserjet_pro_m404-m405-ps.ppd"')}
      }
    }
  ]
}
`.trim()

  for (const line of text.split('\n')) {
    out.write(`${line}\n`)
  }
}
