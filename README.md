# kiosk-browser

Generic kiosk-mode browser.

## Build & Install

1. Install [NodeJS](https://nodejs.org/en/) and [Yarn](https://www.yarnpkg.com/en/).
1. Install native package dependencies with `make install`.
1. Build a Debian/Ubuntu package with `make build`.
1. Copy `out/make/deb/x64/kiosk-browser_*.deb` wherever you want to install it (note wildcard).
1. Install it with `sudo dpkg -i kiosk-browser_*.deb` (note wildcard).
1. Run with the URL you want to visit as a CLI argument (e.g. `kiosk-browser https://example.com/`) or with an environment variable (e.g. `KIOSK_BROWSER_URL=https://example.com/ kiosk-browser`).

## Kiosk Page API

Web pages loaded by `kiosk-browser` have an extra API accessible via the global `kiosk` object.

`kiosk.`**`getBatteryInfo`**`(): Promise<{ level: number, discharging: boolean } | undefined>`

Gets an object describing the current state of the battery, including level and discharging status.

`kiosk.`**`getPrinterInfo`**`(): Promise<PrinterInfo[]>`

Gets a list of printers that kiosk-browser detects and includes various info about their status (e.g. whether they are connected, their ink levels, and any error messages).

`kiosk.`**`print`**`(options?: PrintOptions): Promise<void>`

Prints the current page using the default printer. This is different from `window.print` in that it is silent; there are no dialogs or prompts. Resolves if printing succeeds, rejects otherwise. Optionally accepts `deviceName: string`, `paperSource: string`, and `copies: number` options.

`kiosk.`**`saveAs`**`(): Promise<FileWriter | undefined>`

Presents a file save dialog to the user and, if a file is chosen, resolves to an object with `write(data)` and `end()` methods, similar to `fs.WriteStream` from `NodeJS`. To use this API, the requesting origin must be allowed to write to disk.

`kiosk.`**`getUsbDrives`**`(): Promise<{ deviceName: string; mountPoint?: string }>`

Gets a list of USB drives and, if mounted, where. To mount or unmount a drive, pass its device name to `kiosk.mountUsbDrive` or `kiosk.unmountUsbDrive`.

## File Access APIs

To access the file system, a host must be granted access with `--add-file-perm [HOST:]PATH[:ACCESS]`. For example, `--add-file-perm localhost:**/*:rw` grants localhost read-write access anywhere. Access modifiers: `rw` (default, read-write), `ro` (read-only), and `wo` (write-only). Note that the order permissions are added is important. If you add a permission that says access to `/media/**/*` is read-only first, then another that says `/media/usb-stick/**/*` is read-write, access to `/media/usb-stick/file.txt` will be read-only because the first permission matches the path. To fix this, reverse the order.

## Auto-Configure Printers

If you need to print, `kiosk-browser` can automatically configure printers for you as they are detected. To do so, build a printer config file as described by `kiosk-browser --help`.

## Debugging

First, check the command-line help:

```
$ kiosk-browser --help
```

If something isn't working as you'd expect it to, try running with debug logging:

```
$ DEBUG=kiosk-browser:* kiosk-browser https://example.com/
```

## Development

If you're working on a bug fix or feature for `kiosk-browser`, here's how to build and run it in development:

1. Install [NodeJS](https://nodejs.org/en/) and [Yarn](https://www.yarnpkg.com/en/).
1. Install native package dependencies with `make install`.
1. Run with `yarn start`. Changes will not automatically be picked up, so just Ctrl-C the `yarn start` and run it again.

Kiosk browser has a number of command line arguments if you want the permissions and print config to mimic production but have access to devtools you probably want to run `kiosk-browser` locally with the following command:

```sh
DEBUG=kiosk-browser:* DISPLAY=:0 KIOSK_BROWSER_ALLOW_DEVTOOLS=true KIOSK_BROWSER_URL=http://localhost:3000/ KIOSK_BROWSER_FILE_PERMISSIONS='o=http://localhost:3000,p=/**/*,rw' KIOSK_BROWSER_AUTOCONFIGURE_PRINT_CONFIG=../vxsuite-complete-system/printing/printer-autoconfigure.json yarn start
```

## License

GPL-3.0
