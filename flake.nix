{
  description = "A nix package for kiosk-browser";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }: 
   flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.permittedInsecurePackages = [
              "electron-17.4.1"
          ];
        };
        node-modules = pkgs.mkYarnPackage {
          # TODO: figure out why running nix build takes so long with this
          name = "node-modules";
          src = ./.;
            packageJSON = ./package.json;
            yarnLock = ./yarn.lock;
            yarnNix = ./yarn.nix;
            pkgConfig.usb-detection = {
              buildInputs = with pkgs; [ 
                yarn 
                nodejs-16_x
                typescript 
                systemd 
                electron_17 
                python3
              ];
              postInstall = ''
                # We have to rebuild this package to install it properly.
                # Ensure yarn knows where to find nodejs.
                ${pkgs.nodejs-16_x}/bin/npm config set nodedir "${pkgs.nodejs-16_x}"
                yarn rebuild
              '';
            };
        };
        kiosk-browser = pkgs.stdenv.mkDerivation {
          # build env doesn't have internet access
          ELECTRON_SKIP_BINARY_DOWNLOAD = "1";
          name = "kiosk-browser";
          src = ./.;
          buildInputs = with pkgs; [ 
            yarn 
            nodejs-16_x
            node-modules
            typescript 
            systemd 
            electron_17 
            python3
          ];

          buildPhase = ''
            # copy nix-packaged node_modules
            ln -s ${node-modules}/libexec/kiosk-browser/node_modules node_modules

            # run tsc to generate build directory
            tsc
          '';
          installPhase =  ''
            mkdir -p $out/lib/resources/app/build
            mkdir $out/bin

            # copy electron and files to out directory
            # rename electron to package name
            cp -r ${pkgs.electron_17}/lib/electron/* $out/lib/
            mv $out/lib/electron $out/lib/kiosk-browser

            ln -sf $out/lib/kiosk-browser $out/bin/kiosk-browser

            # Copy kiosk-browser source to the right place for electron to find it
            mv build/src $out/lib/resources/app/build/src
            cp -r ${node-modules}/libexec/kiosk-browser/node_modules $out/lib/resources/app/node_modules
            mv package.json $out/lib/resources/app/package.json

            # kill off the default app
            rm $out/lib/resources/default_app.asar
          '';
        };
      in 
        {
          packages = {
            node-modules = node-modules;
            kiosk-browser = kiosk-browser;
            default = kiosk-browser;
          };
         devShell = pkgs.mkShell {
            buildInputs = with pkgs; [
              python3
              yarn
              typescript
              systemd # note we depend on systemd for libudev.h
              fpm
              electron_17
              yarn2nix
              nodejs-16_x
            ];
          };
        }
    );
}
