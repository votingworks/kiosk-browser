# kiosk-browser

A generic Electron-based kiosk-mode browser that runs our [vxsuite](https://github.com/votingworks/vxsuite) app frontends in production.

## Build & Install

1. Install [NodeJS](https://nodejs.org/en/) and [Yarn](https://www.yarnpkg.com/en/).
1. Install native package dependencies with `make install`.
1. Build a Debian/Ubuntu package with `make build`.
1. Install it with `sudo dpkg -i dist/kiosk-browser_*.deb`.
1. Run with the URL you want to visit as a CLI argument (e.g. `kiosk-browser https://example.com/`) or with an environment variable (e.g. `KIOSK_BROWSER_URL=https://example.com/ kiosk-browser`).

## Kiosk Page API

Web pages loaded by kiosk-browser have an extra API accessible via the global `kiosk` object.

`kiosk.`**`saveAs`**`(): Promise<FileWriter | undefined>`

Presents a file save dialog to the user and, if a file is chosen, resolves to an object with `write(data)` and `end()` methods, similar to `fs.WriteStream` from `NodeJS`. To use this API, the requesting origin must be allowed to write to disk.

We're increasingly moving away from these APIs in [vxsuite](https://github.com/votingworks/vxsuite), but a few last uses remain.

## File Access APIs

To access the file system, a host must be granted access with `--add-file-perm [HOST:]PATH[:ACCESS]`. For example, `--add-file-perm localhost:**/*:rw` grants localhost read-write access anywhere. Access modifiers: `rw` (default, read-write), `ro` (read-only), and `wo` (write-only). Note that the order permissions are added is important. If you add a permission that says access to `/media/**/*` is read-only first, then another that says `/media/usb-stick/**/*` is read-write, access to `/media/usb-stick/file.txt` will be read-only because the first permission matches the path. To fix this, reverse the order.

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

If you're working on a bug fix or feature for kiosk-browser, here's how to build and run it in development:

1. Install [NodeJS](https://nodejs.org/en/) and [Yarn](https://www.yarnpkg.com/en/).
1. Install native package dependencies with `make install`.
1. Run with `yarn start`. Changes will not automatically be picked up, so just Ctrl-C the `yarn start` and run it again.

kiosk-browser has a number of command line arguments you can use if you want the permissions and print config to mimic production while also having access to devtools. You probably want to run kiosk-browser locally with the following command:

```sh
DEBUG=kiosk-browser:* \
  DISPLAY=:0 \
  KIOSK_BROWSER_ALLOW_DEVTOOLS=true \
  KIOSK_BROWSER_FILE_PERMISSIONS='o=http://localhost:3000,p=/**/*,rw' \
  KIOSK_BROWSER_URL=http://localhost:3000 \
  yarn start
```

## License

All files are licensed under GNU GPL v3.0 only. Refer to the [license file](./LICENSE) for
more information.
