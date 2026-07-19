#!/usr/bin/env bash
set -euo pipefail

# Pulls the latest blogs/projects content from themuler-blogs (public, no auth)
# into src/content/{blogs,projects} at build/dev time. Never committed here —
# see .gitignore. Design: https://github.com/bhavanichandra/bytes-of-me/issues/7

REPO_URL="https://github.com/bhavanichandra/themuler-blogs/archive/refs/heads/main.tar.gz"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl -sfL "$REPO_URL" | tar -xz -C "$TMP_DIR" --strip-components=1

rm -rf src/content/blogs src/content/projects
mkdir -p src/content
cp -r "$TMP_DIR/blogs" src/content/blogs
cp -r "$TMP_DIR/projects" src/content/projects

echo "Fetched content from themuler-blogs@main into src/content/{blogs,projects}"
