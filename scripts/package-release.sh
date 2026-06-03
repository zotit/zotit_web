#!/usr/bin/env bash
# Build web + Chrome + Firefox extension zips for GitHub Release.
# Usage: ./scripts/package-release.sh [v1.7.2]   (version optional, strips leading v)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TAG="${1:-}"
if [[ -n "$TAG" ]]; then
  VERSION="${TAG#v}"
else
  VERSION="$(node -p "require('./package.json').version" 2>/dev/null || echo '0.0.0')"
fi

ARTIFACTS="$ROOT/artifacts"
rm -rf "$ARTIFACTS"
mkdir -p "$ARTIFACTS"

patch_manifest_version() {
  local file="$1"
  if command -v jq >/dev/null 2>&1; then
    jq --arg v "$VERSION" '.version = $v' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
  else
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" "$file"
    rm -f "${file}.bak"
  fi
}

echo "==> Building web (hosted)…"
npm run build:web
(
  cd "$ROOT/dist"
  zip -qr "$ARTIFACTS/web-dist.zip" .
)

package_extension() {
  local target="$1"   # chrome | firefox
  local manifest_src="$2"

  echo "==> Building ${target} extension…"
  npm run build:ext

  local stage="$ROOT/build/${target}_ext"
  rm -rf "$stage"
  mkdir -p "$stage"
  cp -R "$ROOT/dist/"* "$stage/"
  cp "$manifest_src" "$stage/manifest.json"
  cp -R "$ROOT/icons" "$stage/icons"
  patch_manifest_version "$stage/manifest.json"

  (
    cd "$stage"
    zip -qr "$ARTIFACTS/${target}-dist.zip" .
  )
  echo "    → $ARTIFACTS/${target}-dist.zip"
}

package_extension "chrome" "$ROOT/ext_data/manifests/manifest3.json"
package_extension "firefox" "$ROOT/ext_data/manifests/manifest2.json"

echo ""
echo "Done. Version: ${VERSION}"
ls -lh "$ARTIFACTS"/*.zip
