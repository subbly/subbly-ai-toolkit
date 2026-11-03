#!/usr/bin/env bash
# Builds dist/subbly-<version>.zip: the plugin as you upload it to Claude, ChatGPT and others.
# The archive holds the files the hosts read, at its root. Repo tooling stays out.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
version="$(node -p "require('$root/package.json').version")"
out="$root/dist/subbly-$version.zip"

mkdir -p "$root/dist"
rm -f "$out"
cd "$root"
zip -qr "$out" \
  .claude-plugin .codex-plugin .cursor-plugin \
  .mcp.json plugin.json gemini-extension.json server.json \
  skills assets README.md LICENSE CHANGELOG.md \
  -x '*.DS_Store'
echo "$out"
