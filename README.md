# zotit_web

Svelte web app for ZotIt — hosted web + Chrome/Edge and Firefox extensions (Manifest V3).

Replaces the Flutter Web extension build; packaging uses manifests and icons under this repo.

## Layout

```
ext_data/manifests/   manifest.json (Chrome), manifest-firefox.json (MV3 + gecko add-on id)
icons/                extension icons (from zotit_flutter/web/icons)
scripts/package-release.sh   builds 3 zips into artifacts/
```

## Development

```bash
npm install
npm run dev
```

Point at local API:

```bash
VITE_API_BASE="http://localhost:4001" npm run dev
```

## Local builds

```bash
npm run build:web          # hosted site → dist/
npm run build:ext          # extension popup → dist/
npm run package:release    # web-dist.zip + chrome-dist.zip + firefox-dist.zip
```

Unpacked load paths after packaging: `build/chrome_ext/`, `build/firefox_ext/`

## GitHub Release

Push a **semver tag** (not staging):

```bash
git tag v1.7.3
git push origin v1.7.3
```

Workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) runs on `v*.*.*` and attaches:

- `artifacts/web-dist.zip` — static web app
- `artifacts/chrome-dist.zip` — Chrome/Edge extension (MV3)
- `artifacts/firefox-dist.zip` — Firefox extension (MV3, `zotit@twobits.in`, built-in data consent)

Upload those zips manually to stores/hosting as needed.

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) — build + typecheck on `main` / PR (no release).
