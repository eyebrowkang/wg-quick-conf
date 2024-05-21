# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.go
    pkgs.tinygo
    pkgs.nodejs_20
    pkgs.corepack_20
  ];
  # Sets environment variables in the workspace
  env = { };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # style
      "equinusocio.vsc-material-theme"
      "equinusocio.vsc-material-theme-icons"
      # language
      "golang.go"
      # tool
      "vscodevim.vim"
      # frontend
      "formulahendry.auto-complete-tag"
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "bradlc.vscode-tailwindcss"
      "christian-kohler.npm-intellisense"
      "christian-kohler.path-intellisense"
    ];
    # Enable previews
    previews = {
      enable = true;
    };
    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = { };
      onStart = { };
    };
  };
}
