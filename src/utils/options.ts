import chalk from 'chalk';
import makeDebug from 'debug';

const debug = makeDebug('kiosk-browser:options');

export type ParseOptionsResult =
  | { options: Options; warnings?: string[] }
  | { help: true; warnings?: string[] }
  | { error: Error; warnings?: string[] };

export interface Options {
  url: URL;
  allowDevtools?: boolean;
}

export interface Help {
  help: true;
}

export interface Invalid {
  error: Error;
}

function parseOptionsWithoutTryCatch(
  argv: typeof process.argv = [],
  env: typeof process.env = {},
): ParseOptionsResult {
  debug('parsing options from argv=%o and env=%O', argv, env);

  let urlArg: string | undefined;
  let helpArg: string | undefined;
  let allowDevtoolsArg: boolean | undefined;
  const warnings: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--url' || arg === '-u') {
      i++;
      urlArg = getOptionValue();
      debug('got option for %s: %s', arg, urlArg);
    } else if (arg === '--allow-devtools') {
      allowDevtoolsArg = true;
      debug('got flag: %s', arg);
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
    allowDevtools:
      allowDevtoolsArg ?? env.KIOSK_BROWSER_ALLOW_DEVTOOLS === 'true',
  };

  debug('parsed options: %O', options);

  return { options, warnings };
}

/**
 * Gets the URL to navigate.
 */
export default function parseOptions(
  argv: typeof process.argv = [],
  env: typeof process.env = {},
): ParseOptionsResult {
  try {
    return parseOptionsWithoutTryCatch(argv, env);
  } catch (error) {
    return { error: error as Error };
  }
}

export function printHelp(
  out: { write(str: string): void } = process.stdout,
): void {
  const b = chalk.bold.underline;
  const text = `
kiosk-browser [OPTIONS] [URL]

${b('Options')}
   -u, --url URL           Visit this URL on load.
       --allow-devtools    Allow devtools to be opened by pressing Ctrl/Cmd+Shift+I.
`.trim();

  for (const line of text.split('\n')) {
    out.write(`${line}\n`);
  }
}
