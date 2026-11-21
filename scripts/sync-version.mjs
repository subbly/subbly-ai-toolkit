#!/usr/bin/env node
// Copies the version in package.json to every platform manifest.
// --check: change nothing, exit 1 when a manifest has a different version.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

// Each entry: a manifest file and the objects in it that hold a `version`.
const targets = [
  ['plugin.json', (m) => [m]],
  ['.claude-plugin/plugin.json', (m) => [m]],
  ['.claude-plugin/marketplace.json', (m) => m.plugins],
  ['.codex-plugin/plugin.json', (m) => [m]],
  ['.cursor-plugin/plugin.json', (m) => [m]],
  ['gemini-extension.json', (m) => [m]],
  ['server.json', (m) => [m]],
]

let stale = 0
for (const [file, holders] of targets) {
  const path = join(root, file)
  const manifest = JSON.parse(readFileSync(path, 'utf8'))
  const wrong = holders(manifest).filter((h) => h.version !== version)
  if (!wrong.length) continue
  stale++
  if (check) {
    console.error(`${file}: ${wrong.map((h) => h.version).join(', ')} != ${version}`)
    continue
  }
  wrong.forEach((h) => (h.version = version))
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`${file} -> ${version}`)
}

if (check && stale) process.exit(1)
if (!stale) console.log(`All manifests at ${version}`)
