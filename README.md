# kiosk-browser

Generic kiosk-mode browser.

## Build & Install

1. Install [NodeJS](https://nodejs.org/en/) and [Yarn](https://www.yarnpkg.com/en/).
1. Install dependencies with `yarn install`.
1. Build a Debian/Ubuntu package with `yarn make`.
1. Copy `out/make/deb/x64/kiosk-browser_*_amd64.deb` wherever you want to install it (note wildcard).
1. Install it with `sudo dpkg -i kiosk-browser_*_amd64.deb` (note wildcard).
1. Run with the URL you want to visit as a CLI argument (e.g. `kiosk-browser http://example.com/`) or with an environment variable (e.g. `KIOSK_BROWSER_URL=http://example.com/ kiosk-browser`).

## License

GPL-3.0
