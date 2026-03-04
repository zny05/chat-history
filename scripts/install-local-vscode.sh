#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

log() {
  printf "[install-local-vscode] %s\n" "$1"
}

ensure_node() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    log "Using existing Node.js: $(node -v), npm: $(npm -v)"
    return
  fi

  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    log "nvm not found. Installing nvm..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  fi

  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"

  log "Installing Node.js LTS via nvm..."
  nvm install --lts >/dev/null
  nvm use --lts >/dev/null
  log "Using Node.js: $(node -v), npm: $(npm -v)"
}

install_extension() {
  local vsix_path="$1"

  if command -v code >/dev/null 2>&1; then
    code --install-extension "$vsix_path" --force
    return
  fi

  if command -v code-insiders >/dev/null 2>&1; then
    code-insiders --install-extension "$vsix_path" --force
    return
  fi

  log "Neither 'code' nor 'code-insiders' command was found in PATH."
  log "Please open VS Code and run: Shell Command: Install 'code' command in PATH"
  exit 2
}

main() {
  cd "$PROJECT_ROOT"

  ensure_node

  if [ -f package-lock.json ]; then
    log "Installing dependencies with npm ci..."
    npm ci
  else
    log "Installing dependencies with npm install..."
    npm install
  fi

  log "Packaging VSIX..."
  npm run package

  local version
  version="$(node -p "require('./package.json').version")"
  local vsix
  vsix="chat-history-${version}.vsix"

  if [ ! -f "$vsix" ]; then
    log "Expected VSIX not found: $vsix"
    exit 3
  fi

  log "Installing VSIX into local VS Code..."
  install_extension "$PROJECT_ROOT/$vsix"

  log "Done. Installed: $vsix"
}

main "$@"
