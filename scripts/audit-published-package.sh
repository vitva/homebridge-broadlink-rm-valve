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

# npm accepts a publish before the version's metadata and tarball are fully
# propagated. Poll the exact version instead of failing the release audit on
# the first transient 404.
MAX_ATTEMPTS=120
RETRY_SECONDS=15
TARBALL=""
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  rm -f "$TMP_DIR/pack.json" "$TMP_DIR/pack-error.log"
  if npm pack "${PACKAGE}@${VERSION}" --json --pack-destination "$TMP_DIR" \
    > "$TMP_DIR/pack.json" 2> "$TMP_DIR/pack-error.log"; then
    TARBALL="$(node -e 'const p=require(process.argv[1]); if (!p[0]?.filename) process.exit(2); process.stdout.write(p[0].filename)' "$TMP_DIR/pack.json")"
    echo "npm tarball is available (attempt $attempt/$MAX_ATTEMPTS)."
    break
  fi

  if grep -Eq 'E404|ETARGET|404 Not Found|not in this registry' "$TMP_DIR/pack-error.log"; then
    if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
      echo "::error::npm version/tarball was still unavailable after $((MAX_ATTEMPTS * RETRY_SECONDS / 60)) minutes."
      cat "$TMP_DIR/pack-error.log"
      exit 1
    fi
    echo "npm version/tarball is not visible yet (attempt $attempt/$MAX_ATTEMPTS); retrying in ${RETRY_SECONDS}s."
    sleep "$RETRY_SECONDS"
  else
    cat "$TMP_DIR/pack-error.log"
    exit 1
  fi
done

if [ -z "$TARBALL" ]; then
  echo "::error::npm pack did not produce a tarball."
  exit 1
fi

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
