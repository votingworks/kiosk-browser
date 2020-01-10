/**
 * Gets the URL to navigate.
 */
export default function getURL(): URL {
  try {
    return new URL(process.argv[1])
  } catch {}

  const fromEnv = process.env.KIOSK_BROWSER_URL

  if (fromEnv) {
    try {
      return new URL(fromEnv)
    } catch {}
  }

  return new URL('about:blank')
}
