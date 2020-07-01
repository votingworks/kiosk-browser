# kiosk-browser

Generic kiosk-mode browser.

## Build & Install

1. Install [NodeJS](https://nodejs.org/en/) and [Yarn](https://www.yarnpkg.com/en/).
1. Install native package dependencies with `make install`.
1. Build a Debian/Ubuntu package with `make build`.
1. Copy `out/make/deb/x64/kiosk-browser_*_amd64.deb` wherever you want to install it (note wildcard).
1. Install it with `sudo dpkg -i kiosk-browser_*_amd64.deb` (note wildcard).
1. Run with the URL you want to visit as a CLI argument (e.g. `kiosk-browser http://example.com/`) or with an environment variable (e.g. `KIOSK_BROWSER_URL=http://example.com/ kiosk-browser`).

## Kiosk Page API

Web pages loaded by `kiosk-browser` have an extra API accessible via the global `kiosk` object.

`kiosk.`**`getBatteryInfo`**`(): Promise<{ level: number, discharging: boolean }>`

Gets an object describing the current state of the battery, including level and discharging status.

`kiosk.`**`print`**`(): Promise<void>`

Prints the current page using the default printer. This is different from `window.print` in that it is silent; there are no dialogs or prompts. Resolves if printing succeeds, rejects otherwise.

`kiosk.`**`saveAs`**`(): Promise<FileWriter>`

Presents a file save dialog to the user and, if a file is chosen, resolves to an object with `write(data)` and `end()` methods, similar to `fs.WriteStream` from `NodeJS`. To use this API, the requesting hostname must be allowed explicitly. For example, via `--allowed-save-as-hostname-pattern localhost`. Additionally, file write destination paths must be explicitly allowed. For example, `--allowed-save-as-destination-pattern /media/**/*`. To allow all hosts and paths, use `--allowed-save-as-hostname-pattern '*' --allowed-save-as-destination-pattern '**/*'`.

`kiosk.`**`getUsbDrives`**`(): Promise<{ deviceName: string; mountPoint?: string }>`

Gets a list of USB drives and, if mounted, where. To mount or unmount a drive, pass its device name to `kiosk.mountUsbDrive` or `kiosk.unmountUsbDrive`.

## Auto-Configure Printers

If you need to print, `kiosk-browser` can automatically configure printers for you as they are detected. To do so, build a printer config file as described by `kiosk-browser --help`.

## Debugging

First, check the command-line help:

```
$ kiosk-browser --help
```

If something isn't working as you'd expect it to, try running with debug logging:

```
$ DEBUG=kiosk-browser:* kiosk-browser http://example.com/
```

## Development

If you're working on a bug fix or feature for `kiosk-browser`, here's how to build and run it in development:

1. Install [NodeJS](https://nodejs.org/en/) and [Yarn](https://www.yarnpkg.com/en/).
1. Install native package dependencies with `make install`.
1. Run with `yarn start`. Changes will not automatically be picked up, so just Ctrl-C the `yarn start` and run it again.

## License

GPL-3.0
