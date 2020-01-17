# kiosk-browser

Generic kiosk-mode browser.

## Build & Install

1. Install [NodeJS](https://nodejs.org/en/) and [Yarn](https://www.yarnpkg.com/en/).
1. Install dependencies with `yarn install`.
1. Build a Debian/Ubuntu package with `yarn make`.
1. Copy `out/make/deb/x64/kiosk-browser_*_amd64.deb` wherever you want to install it (note wildcard).
1. Install it with `sudo dpkg -i kiosk-browser_*_amd64.deb` (note wildcard).
1. Run with the URL you want to visit as a CLI argument (e.g. `kiosk-browser http://example.com/`) or with an environment variable (e.g. `KIOSK_BROWSER_URL=http://example.com/ kiosk-browser`).

## Kiosk Page API

Web pages loaded by `kiosk-browser` have an extra API accessible via the global `kiosk` object.

`kiosk.`**`getBatteryInfo`**`(): Promise<{ level: number, discharging: boolean }>`

Gets an object describing the current state of the battery, including level and discharging status.

`kiosk.`**`print`**`(): Promise<void>`

Prints the current page using the default printer. This is different from `window.print` in that it is silent; there are no dialogs or prompts. Resolves if printing succeeds, rejects otherwise.

## License

GPL-3.0