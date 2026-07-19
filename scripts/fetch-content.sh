#!/usr/bin/env bash
set -euo pipefail

# Pulls the latest blogs/projects content from themuler-blogs (public, no auth)
# into src/content/{blogs,projects} at build/dev time. Never committed here —
# see .gitignore. Design: https://github.com/bhavanichandra/bytes-of-me/issues/7

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_URL="https://github.com/bhavanichandra/themuler-blogs/archive/refs/heads/main.tar.gz"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl -sfL --retry 3 --retry-delay 1 --connect-timeout 10 --max-time 120 "$REPO_URL" \
  | tar -xz -C "$TMP_DIR" --strip-components=1

# Reject a malicious/compromised archive that symlinks blogs/projects (or
# anything inside them) out of the extracted tree, before it's ever copied in.
for dir in blogs projects; do
  if [[ ! -d "$TMP_DIR/$dir" || -L "$TMP_DIR/$dir" ]]; then
    echo "fetch-content: '$dir' missing or not a plain directory in fetched archive" >&2
    exit 1
  fi
done
if find "$TMP_DIR/blogs" "$TMP_DIR/projects" -type l -print -quit | grep -q .; then
  echo "fetch-content: symlink found inside fetched content, refusing to copy" >&2
  exit 1
fi

# Stage into siblings and swap atomically so a failed copy never leaves
# src/content without usable content.
STAGE_DIR="$ROOT_DIR/src/content/.staging-$$"
trap 'rm -rf "$TMP_DIR" "$STAGE_DIR"' EXIT
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"
cp -R -P "$TMP_DIR/blogs" "$STAGE_DIR/blogs"
cp -R -P "$TMP_DIR/projects" "$STAGE_DIR/projects"

rm -rf "$ROOT_DIR/src/content/blogs" "$ROOT_DIR/src/content/projects"
mv "$STAGE_DIR/blogs" "$ROOT_DIR/src/content/blogs"
mv "$STAGE_DIR/projects" "$ROOT_DIR/src/content/projects"

echo "Fetched content from themuler-blogs@main into src/content/{blogs,projects}"
