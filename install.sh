#!/usr/bin/env bash
# piBrick PocketCM5 online installer
# Usage: curl -fsSL https://pibrick.net/install.sh | sudo bash
set -Eeuo pipefail

REPO_URL="https://github.com/amarullz/pibrick-drivers.git"
REPO_BRANCH="${PIBRICK_DRIVERS_BRANCH:-main}"
INSTALL_DIR="${PIBRICK_INSTALL_DIR:-/usr/local/src/pibrick-drivers}"

info() { printf '[piBrick] %s\n' "$*"; }
warn() { printf '[WARNING] %s\n' "$*" >&2; }
die()  { printf '[ERROR] %s\n' "$*" >&2; exit 1; }

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    cat <<EOF
piBrick PocketCM5 installer

Usage:
  curl -fsSL https://pibrick.net/install.sh | sudo bash

Environment:
  PIBRICK_INSTALL_DIR       Repository location (default: $INSTALL_DIR)
  PIBRICK_DRIVERS_BRANCH    Git branch (default: $REPO_BRANCH)
EOF
    exit 0
fi
[[ $# -eq 0 ]] || die "Unknown argument: $1"

[[ $EUID -eq 0 ]] || die "Run with sudo:
  curl -fsSL https://pibrick.net/install.sh | sudo bash"

[[ -r /etc/os-release ]] || die "Cannot identify the operating system."
. /etc/os-release

case "${ID:-}" in
    raspbian|debian|ubuntu|kali) ;;
    *)
        case " ${ID_LIKE:-} " in
            *" debian "*) ;;
            *) warn "Intended for Raspberry Pi OS / Debian-based systems; detected ${PRETTY_NAME:-unknown}." ;;
        esac
        ;;
esac

ARCH="$(dpkg --print-architecture 2>/dev/null || true)"
case "$ARCH" in
    arm64|armhf) ;;
    *) warn "Architecture '$ARCH' is not typical for Raspberry Pi. Continuing." ;;
esac

info "piBrick PocketCM5 driver installer"
info "OS: ${PRETTY_NAME:-unknown}"
info "Kernel: $(uname -r)"
info "Architecture: ${ARCH:-unknown}"
info "Repository: $INSTALL_DIR"
info "Branch: $REPO_BRANCH"

if ! command -v git >/dev/null 2>&1; then
    command -v apt-get >/dev/null 2>&1 || die "Git is missing and apt-get is unavailable."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y git ca-certificates
fi

if [[ -d "$INSTALL_DIR/.git" ]]; then
    info "Updating existing piBrick driver repository"
    [[ -z "$(git -C "$INSTALL_DIR" status --porcelain)" ]] ||
        die "Local changes found in $INSTALL_DIR. Commit/stash them or move the directory; they will not be overwritten."

    git -C "$INSTALL_DIR" fetch --prune origin "$REPO_BRANCH"
    git -C "$INSTALL_DIR" checkout "$REPO_BRANCH"
    git -C "$INSTALL_DIR" merge --ff-only "origin/$REPO_BRANCH"
elif [[ -e "$INSTALL_DIR" ]]; then
    die "$INSTALL_DIR exists but is not a Git repository. Move it or set PIBRICK_INSTALL_DIR."
else
    info "Cloning official piBrick driver repository"
    install -d -m 0755 "$(dirname "$INSTALL_DIR")"
    git clone --depth=1 --branch "$REPO_BRANCH" "$REPO_URL" "$INSTALL_DIR"
fi

INSTALLER="$INSTALL_DIR/scripts/install.sh"
[[ -f "$INSTALLER" ]] || die "Repository installer not found: $INSTALLER"

info "Starting piBrick driver installation"
exec /bin/bash "$INSTALLER"
