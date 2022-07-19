import chalk from 'chalk';
import makeDebug from 'debug';
import { promises } from 'fs';
import { isAbsolute, join } from 'path';
import { AccessType, OriginFilePermission } from './access';
import { PrintConfig } from './printing';

const debug = makeDebug('kiosk-browser:options');

export type ParseOptionsResult =
  | { options: Options; warnings?: string[] }
  | { help: true; warnings?: string[] }
  | { error: Error; warnings?: string[] };

export interface Options {
  url: URL;
  autoconfigurePrintConfig?: PrintConfig;
  allowDevtools?: boolean;
  originFilePermissions: OriginFilePermission[];
  signifySecretKey?: string;
  signingScriptPath?: string;
}

export interface Help {
  help: true;
}

export interface Invalid {
  error: Error;
}

async function parseOptionsWithoutTryCatch(
  argv: typeof process.argv = [],
  env: typeof process.env = {},
): Promise<ParseOptionsResult> {
  debug('parsing options from argv=%o and env=%O', argv, env);

  let urlArg: string | undefined;
  let autoconfigurePrintConfigArg: string | undefined;
  let helpArg: string | undefined;
  let allowDevtoolsArg: boolean | undefined;
  let originFilePermissions: OriginFilePermission[] | undefined;
  let signifySecretKey: string | undefined;
  let signingScriptPath: string | undefined;
  const warnings: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--url' || arg === '-u') {
      i++;
      urlArg = getOptionValue();
      debug('got option for %s: %s', arg, urlArg);
    } else if (arg === '--autoconfigure-print-config' || arg === '-p') {
      i++;
      autoconfigurePrintConfigArg = getOptionValue();
      debug('got option for %s: %s', arg, autoconfigurePrintConfigArg);
    } else if (arg === '--allow-devtools') {
      allowDevtoolsArg = true;
      debug('got flag: %s', arg);
    } else if (arg === '--add-file-perm' || arg === '-v') {
      i++;
      const value = argv[i];
      debug('got option for %s: %s', arg, value);
      if (!value || value.startsWith('-')) {
        return { error: new Error(`expected value for option: ${arg}`) };
      }
      originFilePermissions = [
        ...(originFilePermissions ?? []),
        parseOriginFilePermissionString(value),
      ];
    } else if (arg === '--signify-secret-key') {
      i++;
      const value = argv[i];
      debug('got option for %s: %s', arg, value);
      if (!value || value.startsWith('-')) {
        return { error: new Error(`expected value for option: ${arg}`) };
      }
      signifySecretKey = value;
    } else if (arg === '--signing-script-path') {
      i++;
      const value = argv[i];
      debug('got option for %s: %s', arg, value);
      if (!value || value.startsWith('-')) {
        return { error: new Error(`expected value for option: ${arg}`) };
      }
      signingScriptPath = value;
    } else if (arg === '--help' || arg === '-h') {
      helpArg = arg;
    } else if (!arg.startsWith('-')) {
      if (urlArg) {
        return { error: new Error(`duplicate URL argument: ${arg}`) };
      }
      urlArg = arg;
      debug('got implicit URL argument: %s', urlArg);
    } else {
      debug('unexpected option: %s', arg);
      throw new Error(`unexpected option: ${arg}`);
    }

    // eslint-disable-next-line no-inner-declarations
    function getOptionValue(): string {
      if (i >= argv.length) {
        throw new Error(`expected value for option: ${arg}`);
      }

      return argv[i];
    }
  }

  if (helpArg ?? env.KIOSK_BROWSER_HELP) {
    return { help: true, warnings };
  }

  const options: Options = {
    url: new URL(urlArg ?? env.KIOSK_BROWSER_URL ?? 'about:blank'),
    autoconfigurePrintConfig: await loadPrintConfig(
      autoconfigurePrintConfigArg ??
        env.KIOSK_BROWSER_AUTOCONFIGURE_PRINT_CONFIG,
    ),
    allowDevtools:
      allowDevtoolsArg ?? env.KIOSK_BROWSER_ALLOW_DEVTOOLS === 'true',
    originFilePermissions:
      originFilePermissions ??
      env.KIOSK_BROWSER_FILE_PERMISSIONS?.split(';')?.map(
        parseOriginFilePermissionString,
      ) ??
      [],
    signifySecretKey: signifySecretKey ?? env.KIOSK_BROWSER_SIGNIFY_SECRET_KEY,
    signingScriptPath:
      signingScriptPath ?? env.KIOSK_BROWSER_SIGNING_SCRIPT_PATH,
  };

  debug('parsed options: %O', options);

  return { options, warnings };
}

function isAccessType(value: string): value is AccessType {
  return value === 'ro' || value === 'wo' || value === 'rw';
}

function parseOriginFilePermissionString(value: string): OriginFilePermission {
  let origins = '**/*';
  let paths: string | undefined;
  let access: AccessType = 'rw';

  for (const part of value.split(',', 3)) {
    if (part.startsWith('o=')) {
      origins = part.slice('o='.length);
    } else if (part.startsWith('p=')) {
      paths = part.slice('p='.length);
    } else if (isAccessType(part)) {
      access = part;
    } else {
      throw new Error(`unknown file permission format '${value}'`);
    }
  }

  if (!paths) {
    throw new Error(`paths missing in file permissions: '${value}'`);
  }

  return { access, origins, paths };
}

/**
 * Gets the URL to navigate.
 */
export default async function parseOptions(
  argv: typeof process.argv = [],
  env: typeof process.env = {},
): Promise<ParseOptionsResult> {
  try {
    return await parseOptionsWithoutTryCatch(argv, env);
  } catch (error) {
    return { error: error as Error };
  }
}

export async function loadPrintConfig(
  printConfigPath?: string,
): Promise<PrintConfig | undefined> {
  if (typeof printConfigPath === 'undefined') {
    return;
  }

  const printConfigJSON = await promises.readFile(printConfigPath, 'utf8');
  const printConfig = JSON.parse(printConfigJSON) as PrintConfig;

  for (const printer of printConfig.printers) {
    if ('path' in printer.ppd) {
      if (!isAbsolute(printer.ppd.path)) {
        printer.ppd.path = join(printConfigPath, '..', printer.ppd.path);
      }
    }
  }

  return printConfig;
}

export function printHelp(
  out: { write(str: string): void } = process.stdout,
): void {
  const b = chalk.bold.underline;
  const i = chalk.italic.green;
  const c = chalk.dim;
  const jK = chalk.cyan;
  const jS = chalk.red;
  const jN = chalk.yellow;
  const str = chalk.blue('string');
  const num = chalk.blue('number');
  const text = `
kiosk-browser [OPTIONS] [URL]

${b('Options')}
   -u, --url URL                           Visit this URL on load.
   -p, --autoconfigure-print-config PATH   Automatically configures connected printers according to the given config.
   -v, --add-file-perm PERM                Adds a permission for an origin to read or write certain paths.
       --allow-devtools                    Allow devtools to be opened by pressing Ctrl/Cmd+Shift+I.

${b('Examples')}
${c('# Allow localhost to read and write all files.')}
$ kiosk-browser -v ${jS(
    'o=http://localhost:*,p=**/*,rw',
  )} http://localhost:3000/

${c('# Allow localhost to read–not write–all files.')}
$ kiosk-browser -v ${jS(
    'o=http://localhost:*,p=**/*,ro',
  )} http://localhost:3000/

${c('# Allow any origin to write to a drop box.')}
$ kiosk-browser -v ${jS('o=**/*,p=/dropbox,wo')} http://localhost:3000/

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
`.trim();

  for (const line of text.split('\n')) {
    out.write(`${line}\n`);
  }
}
