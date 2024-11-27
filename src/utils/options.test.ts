import { ok } from './assert';
import parseOptions, { Options, printHelp } from './options';

function parseOptionsWithoutHelp(
  argv: typeof process.argv = [],
  env: typeof process.env = {},
): Options {
  const result = parseOptions(argv, env);
  ok(!('help' in result));
  ok(
    !('error' in result),
    'error' in result ? result.error.message : undefined,
  );
  return result.options;
}

test('returns the first argument URL if it can be parsed as a URL', () => {
  const options = parseOptionsWithoutHelp(['https://example.com/']);
  expect(options.url.href).toEqual('https://example.com/');
});

test('returns the value of KIOSK_BROWSER_URL if it can be parsed as a URL', () => {
  const options = parseOptionsWithoutHelp([], {
    KIOSK_BROWSER_URL: 'https://example.com/',
  });
  expect(options.url.href).toEqual('https://example.com/');
});

test('prefers the argument URL to the environment URL', () => {
  const options = parseOptionsWithoutHelp(['https://example.com/argv'], {
    KIOSK_BROWSER_URL: 'https://example.com/env',
  });
  expect(options.url.href).toEqual('https://example.com/argv');
});

test('falls back to about:blank if nothing else is given', () => {
  const options = parseOptionsWithoutHelp();
  expect(options.url.href).toEqual('about:blank');
});

test('allow devtools', () => {
  expect(parseOptionsWithoutHelp()).not.toEqual(
    expect.objectContaining({
      allowDevtools: true,
    }),
  );

  expect(parseOptionsWithoutHelp(['--allow-devtools'])).toEqual(
    expect.objectContaining({
      allowDevtools: true,
    }),
  );

  expect(
    parseOptionsWithoutHelp([], { KIOSK_BROWSER_ALLOW_DEVTOOLS: 'true' }),
  ).toEqual(
    expect.objectContaining({
      allowDevtools: true,
    }),
  );
});

class SimpleWriter {
  private buffer = '';

  write(str: string): void {
    this.buffer += str;
  }

  toString(): string {
    return this.buffer;
  }
}

test('help', () => {
  const out = new SimpleWriter();
  printHelp(out);

  const help = out.toString();
  expect(help).toContain('kiosk-browser [OPTIONS] [URL]');
  expect(help).toContain('-u, --url URL');
});
