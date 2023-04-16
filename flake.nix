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
          name = "node-modules";
          src = ./.;
        };
        kiosk-browser = pkgs.stdenv.mkDerivation {
          name = "kiosk-browser";
          src = ./.;
          buildInputs = [ pkgs.yarn node-modules pkgs.typescript pkgs.systemd pkgs.electron_17 ];
          buildPhase = ''
            # run tsc to generate build directory
            tsc

            yarn add asar
          '';
          installPhase =  ''
            # copy electron and files to out directory
            # rename electron to package name
            # generate asar file for node_modules and src
            # copy asar file to kiosk-browser/resources/app.asar

            mkdir $out
            mv dist $out/lib
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
            ];
          };
        }
    );
}
