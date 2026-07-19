#!/usr/bin/env bash
set -euo pipefail

# Pulls the latest blogs/projects content from themuler-blogs (public, no auth)
# into src/content/{blogs,projects} at build/dev time. Never committed here —
# see .gitignore. Design: https://github.com/bhavanichandra/bytes-of-me/issues/7

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_URL="https://github.com/bhavanichandra/themuler-blogs/archive/refs/heads/main.tar.gz"
TMP_DIR="$(mktemp -d)"
STAGE_DIR="$ROOT_DIR/src/.content-staging-$$"
BACKUP_DIR="$ROOT_DIR/src/.content-backup-$$"
cleanup() { rm -rf "$TMP_DIR" "$STAGE_DIR" "$BACKUP_DIR"; }
trap cleanup EXIT

ARCHIVE="$TMP_DIR/content.tar.gz"
curl -sfL --retry 3 --retry-delay 1 --connect-timeout 10 --max-time 120 "$REPO_URL" -o "$ARCHIVE"

# Validate archive members before extracting anything: refuse absolute paths,
# parent-directory traversal, and symlink/hardlink entries. A compromised
# upstream archive could otherwise write outside $TMP_DIR during extraction
# itself, before any post-extraction check gets a chance to run.
while IFS= read -r entry; do
  case "$entry" in
    /*|*..*)
      echo "fetch-content: unsafe path in archive: $entry" >&2
      exit 1
      ;;
  esac
done < <(tar -tzf "$ARCHIVE")

if tar -tvzf "$ARCHIVE" | awk '{print substr($1, 1, 1)}' | grep -qE '^[lh]$'; then
  echo "fetch-content: archive contains a symlink/hardlink entry, refusing to extract" >&2
  exit 1
fi

tar -xzf "$ARCHIVE" -C "$TMP_DIR" --strip-components=1

for dir in blogs projects; do
  if [[ ! -d "$TMP_DIR/$dir" || -L "$TMP_DIR/$dir" ]]; then
    echo "fetch-content: '$dir' missing or not a plain directory in fetched archive" >&2
    exit 1
  fi
done

# Stage the whole content tree and swap it into place with a single rename,
# so a failure anywhere above never leaves src/content partially replaced.
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"
cp -R -P "$TMP_DIR/blogs" "$STAGE_DIR/blogs"
cp -R -P "$TMP_DIR/projects" "$STAGE_DIR/projects"

rm -rf "$BACKUP_DIR"
if [[ -d "$ROOT_DIR/src/content" ]]; then
  mv "$ROOT_DIR/src/content" "$BACKUP_DIR"
fi
mv "$STAGE_DIR" "$ROOT_DIR/src/content"

echo "Fetched content from themuler-blogs@main into src/content/{blogs,projects}"
