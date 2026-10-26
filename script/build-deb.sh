#!/bin/bash

set -euo pipefail

cd "$( dirname "${BASH_SOURCE[0]}" )/.."

name=kiosk-browser
version=$( node -p "require('./package.json').version" )
packager_out=dist/packager
deb_root=dist/deb-root
deb_path="dist/${name}_${version}_amd64.deb"

rm -rf build "${packager_out}" "${deb_root}" "${deb_path}"

tsc -p tsconfig.build.json

# Set ELECTRON_ZIP_DIR to package from a cached Electron zip instead of downloading one.
electron-packager . "${name}" \
  --platform=linux \
  --arch=x64 \
  --out="${packager_out}" \
  --ignore='^/(?!(build|node_modules|package\.json)(/|$))' \
  --ignore='^/node_modules/\.(pnpm|modules\.yaml|pnpm-workspace-state)' \
  --quiet \
  ${ELECTRON_ZIP_DIR:+--electron-zip-dir="${ELECTRON_ZIP_DIR}"}

mkdir -p "${deb_root}/opt" "${deb_root}/DEBIAN"
cp -a "${packager_out}/${name}-linux-x64" "${deb_root}/opt/${name}"
chmod -R u=rwX,go=rX "${deb_root}/opt"
install -m 0755 script/deb/postinst script/deb/prerm "${deb_root}/DEBIAN/"
( cd "${deb_root}" && find opt -type f -exec md5sum {} + ) > "${deb_root}/DEBIAN/md5sums"

cat > "${deb_root}/DEBIAN/control" <<CONTROL
Package: ${name}
Version: ${version}
Architecture: amd64
Maintainer: VotingWorks <eng@voting.works>
Installed-Size: $( du -sk "${deb_root}/opt" | cut -f1 )
Depends: libgtk-3-0, libnotify4, libnss3, libxss1, libxtst6, xdg-utils, libatspi2.0-0, libuuid1, libsecret-1-0
Section: web
Priority: optional
Homepage: https://github.com/votingworks/kiosk-browser
Description: Generic kiosk-mode browser.
CONTROL

dpkg-deb --root-owner-group --build "${deb_root}" "${deb_path}"
