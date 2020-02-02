import parseOptions, { Options } from './options'
import { ok } from './assert'

async function parseOptionsWithoutHelp(
  argv: typeof process.argv = [],
  env: typeof process.env = {},
): Promise<Options> {
  const result = await parseOptions(argv, env)
  ok(!('help' in result))
  ok(!('error' in result))
  return result
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
