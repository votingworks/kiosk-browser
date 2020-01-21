import getURL from './getURL'

beforeEach(() => {
  process.argv = []
  process.env = {}
})

test('returns the first argument URL if it can be parsed as a URL', () => {
  process.argv = ['', 'http://example.com/']
  expect(getURL().href).toEqual('http://example.com/')
})

test('returns the value of KIOSK_BROWSER_URL if it can be parsed as a URL', () => {
  process.env.KIOSK_BROWSER_URL = 'http://example.com/'
  expect(getURL().href).toEqual('http://example.com/')
})

test('prefers the argument URL to the environment URL', () => {
  process.argv = ['', 'http://example.com/argv']
  process.env.KIOSK_BROWSER_URL = 'http://example.com/env'
  expect(getURL().href).toEqual('http://example.com/argv')
})

test('falls back to about:blank if nothing else is given', () => {
  expect(getURL().href).toEqual('about:blank')
})
