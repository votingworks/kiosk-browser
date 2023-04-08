{
  description = "A nix package for kiosk-browser";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }: 
   flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        node-modules = pkgs.mkYarnPackage {
          name = "node-modules";
          src = ./.;
        };
        kiosk-browser = pkgs.stdenv.mkDerivation {
          name = "kiosk-browser";
          src = ./.;
          buildInputs = [pkgs.yarn node-modules pkgs.typescript pkgs.systemd ];
          buildPhase = ''
#            ${pkgs.yarn}/bin/yarn tsc
            ${pkgs.yarn}/bin/yarn app:dist
          '';
          installPhase =  ''
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
            ];
          };
        }
    );
}
