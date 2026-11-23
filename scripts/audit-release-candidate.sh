#!/usr/bin/env bash
set -euo pipefail

EXPECTED_VERSION="${EXPECTED_VERSION:-4.4.21-valve.4}"
PACKAGE_NAME="homebridge-broadlink-rm-valve"
ACTUAL_VERSION="$(node -p "require('./package.json').version")"

if [ "$ACTUAL_VERSION" != "$EXPECTED_VERSION" ]; then
  echo "::error::Expected release candidate $EXPECTED_VERSION, found $ACTUAL_VERSION"
  exit 1
fi

node - <<'NODE'
const pkg = require('./package.json');
if (pkg.name !== 'homebridge-broadlink-rm-valve') throw new Error('Unexpected package name');
if (pkg.dependencies?.js) throw new Error('Unexpected legacy js runtime dependency');
if (!pkg.main || !pkg.exports?.['.']?.import || !pkg.exports?.['.']?.require) {
  throw new Error('Package entry points are incomplete');
}
if (pkg.engines?.homebridge !== '^2.0.0') throw new Error('Homebridge 2 engine declaration missing');
console.log('PASS: release metadata and runtime dependency checks');
NODE

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Packing exact release candidate: ${PACKAGE_NAME}@${ACTUAL_VERSION}"
npm pack --json --pack-destination "$TMP_DIR" > "$TMP_DIR/pack.json"

TARBALL="$(node -e 'const p=require(process.argv[1]); process.stdout.write(p[0].filename)' "$TMP_DIR/pack.json")"
mkdir "$TMP_DIR/unpacked"
tar -xzf "$TMP_DIR/$TARBALL" -C "$TMP_DIR/unpacked"

COUNT=0
while IFS= read -r path; do
  [ -n "$path" ] || continue
  if ! git cat-file -e "HEAD:$path" 2>/dev/null; then
    echo "::error::Candidate tarball contains a file absent from HEAD: $path"
    exit 1
  fi
  git show "HEAD:$path" > "$TMP_DIR/source-file"
  if ! cmp -s "$TMP_DIR/source-file" "$TMP_DIR/unpacked/package/$path"; then
    echo "::error::Candidate tarball differs from HEAD: $path"
    diff -u "$TMP_DIR/source-file" "$TMP_DIR/unpacked/package/$path" || true
    exit 1
  fi
  COUNT=$((COUNT + 1))
done < <(node -e 'const p=require(process.argv[1]); for (const f of p[0].files) console.log(f.path)' "$TMP_DIR/pack.json")

node - "$TMP_DIR/unpacked/package/package.json" "$EXPECTED_VERSION" <<'NODE'
const fs = require('node:fs');
const [file, expected] = process.argv.slice(2);
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
if (pkg.version !== expected) throw new Error(`Packed version mismatch: ${pkg.version}`);
if (pkg.dependencies?.js) throw new Error('Packed artifact contains unexpected js dependency');
for (const entry of ['index.js', 'index.mjs', 'config.schema.json']) {
  if (!fs.existsSync(require('node:path').join(require('node:path').dirname(file), entry))) {
    throw new Error(`Packed artifact is missing ${entry}`);
  }
}
console.log(`PASS: packed metadata is ${pkg.name}@${pkg.version}; entry points and schema present`);
NODE

echo "PASS: all $COUNT files in the release-candidate npm tarball exactly match Git HEAD."
