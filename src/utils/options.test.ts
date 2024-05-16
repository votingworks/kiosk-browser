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

test('file permission with default origin and access', () => {
  const options = parseOptionsWithoutHelp(['--add-file-perm', 'p=/media/**/*']);
  expect(options.originFilePermissions).toEqual([
    { origins: '**/*', paths: '/media/**/*', access: 'rw' },
  ]);
});

test('file permission with default access', () => {
  const options = parseOptionsWithoutHelp([
    '--add-file-perm',
    'o=http://localhost,p=/media/**/*',
  ]);
  expect(options.originFilePermissions).toEqual([
    { origins: 'http://localhost', paths: '/media/**/*', access: 'rw' },
  ]);
});

test('file permission', () => {
  const options = parseOptionsWithoutHelp([
    '--add-file-perm',
    'o=http://localhost:*,p=/media/**/*,ro',
  ]);
  expect(options.originFilePermissions).toEqual([
    { origins: 'http://localhost:*', paths: '/media/**/*', access: 'ro' },
  ]);
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
  expect(help).toContain('-p, --autoconfigure-print-config PATH');
  expect(help).toContain('Auto-Configure Printers');
});
