import { ok } from './assert'
import parseOptions, { Options, printHelp } from './options'

async function parseOptionsWithoutHelp(
  argv: typeof process.argv = [],
  env: typeof process.env = {},
): Promise<Options> {
  const result = await parseOptions(argv, env)
  ok(!('help' in result))
  ok(!('error' in result), 'error' in result ? result.error.message : undefined)
  return result.options
}

test('returns the first argument URL if it can be parsed as a URL', async () => {
  const options = await parseOptionsWithoutHelp(['http://example.com/'])
  expect(options.url.href).toEqual('http://example.com/')
})

test('returns the value of KIOSK_BROWSER_URL if it can be parsed as a URL', async () => {
  const options = await parseOptionsWithoutHelp([], {
    KIOSK_BROWSER_URL: 'http://example.com/',
  })
  expect(options.url.href).toEqual('http://example.com/')
})

test('prefers the argument URL to the environment URL', async () => {
  const options = await parseOptionsWithoutHelp(['http://example.com/argv'], {
    KIOSK_BROWSER_URL: 'http://example.com/env',
  })
  expect(options.url.href).toEqual('http://example.com/argv')
})

test('falls back to about:blank if nothing else is given', async () => {
  const options = await parseOptionsWithoutHelp()
  expect(options.url.href).toEqual('about:blank')
})

test('allow devtools', async () => {
  expect(await parseOptionsWithoutHelp()).not.toEqual(
    expect.objectContaining({
      allowDevtools: true,
    }),
  )

  expect(await parseOptionsWithoutHelp(['--allow-devtools'])).toEqual(
    expect.objectContaining({
      allowDevtools: true,
    }),
  )

  expect(
    await parseOptionsWithoutHelp([], { KIOSK_BROWSER_ALLOW_DEVTOOLS: 'true' }),
  ).toEqual(
    expect.objectContaining({
      allowDevtools: true,
    }),
  )
})

test('file permission with default hostname and access', async () => {
  const options = await parseOptionsWithoutHelp([
    '--add-file-perm',
    '/media/**/*',
  ])
  expect(options.hostFilePermissions).toEqual([
    { hostnames: '*', paths: '/media/**/*', access: 'rw' },
  ])
})

test('file permission with default access', async () => {
  const options = await parseOptionsWithoutHelp([
    '--add-file-perm',
    'localhost:/media/**/*',
  ])
  expect(options.hostFilePermissions).toEqual([
    { hostnames: 'localhost', paths: '/media/**/*', access: 'rw' },
  ])
})

test('file permission', async () => {
  const options = await parseOptionsWithoutHelp([
    '--add-file-perm',
    'localhost:/media/**/*:ro',
  ])
  expect(options.hostFilePermissions).toEqual([
    { hostnames: 'localhost', paths: '/media/**/*', access: 'ro' },
  ])
})

class SimpleWriter {
  private buffer = ''

  write(str: string): void {
    this.buffer += str
  }

  toString(): string {
    return this.buffer
  }
}

test('help', () => {
  const out = new SimpleWriter()
  printHelp(out)

  const help = out.toString()
  expect(help).toContain('kiosk-browser [OPTIONS] [URL]')
  expect(help).toContain('-u, --url URL')
  expect(help).toContain('-p, --autoconfigure-print-config PATH')
  expect(help).toContain('Auto-Configure Printers')
})
