#!/usr/bin/env bash
set -euo pipefail

PACKAGE="homebridge-broadlink-rm-valve"
RAW_VERSION="${EXPECTED_VERSION:-$(node -p "require('./package.json').version")}"
VERSION="${RAW_VERSION#v}"
TAG="${EXPECTED_TAG:-v${VERSION}}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if [ -z "$VERSION" ] || [ "$TAG" != "v$VERSION" ]; then
  echo "::error::Version/tag mismatch: version=$VERSION tag=$TAG"
  exit 1
fi

echo "Auditing exact published npm artifact: ${PACKAGE}@${VERSION}"
echo "Comparing against Git tag: ${TAG}"

npm pack "${PACKAGE}@${VERSION}" --json --pack-destination "$TMP_DIR" > "$TMP_DIR/pack.json"
TARBALL="$(node -e 'const p=require(process.argv[1]); if (!p[0]?.filename) process.exit(2); process.stdout.write(p[0].filename)' "$TMP_DIR/pack.json")"

mkdir "$TMP_DIR/unpacked"
tar -xzf "$TMP_DIR/$TARBALL" -C "$TMP_DIR/unpacked"

COUNT=0
while IFS= read -r path; do
  [ -n "$path" ] || continue
  if ! git cat-file -e "${TAG}:${path}" 2>/dev/null; then
    echo "::error::Published tarball contains a file absent from source tag: $path"
    exit 1
  fi
  git show "${TAG}:${path}" > "$TMP_DIR/tag-file"
  if ! cmp -s "$TMP_DIR/tag-file" "$TMP_DIR/unpacked/package/$path"; then
    echo "::error::Published tarball differs from source tag: $path"
    diff -u "$TMP_DIR/tag-file" "$TMP_DIR/unpacked/package/$path" || true
    exit 1
  fi
  COUNT=$((COUNT + 1))
done < <(node -e 'const p=require(process.argv[1]); for (const f of p[0].files) console.log(f.path)' "$TMP_DIR/pack.json")

echo "PASS: all $COUNT published files exactly match Git tag $TAG."
