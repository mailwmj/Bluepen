<p align="center">
  <img src="docs/screenshots/preview.svg" alt="Bluepen" width="700">
</p>

<h1 align="center">Bluepen</h1>

<p align="center">
  <b>Wireframe at the speed of thought.</b><br>
  A fast, local-first wireframing tool for modern interfaces — sketch,
  prototype and hand off product ideas before a single pixel is polished.
</p>

<p align="center">
  <a href="https://bluepen.app">Website</a> ·
  <a href="https://bluepen.app/demo">Live demo</a> ·
  <a href="https://bluepen.app/download">Download</a> ·
  <a href="https://github.com/mailwmj/Bluepen/releases">Releases</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License: AGPL-3.0">
  <img src="https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey.svg" alt="Platforms">
  <img src="https://img.shields.io/badge/version-0.1.0-0a84ff.svg" alt="Version 0.1.0">
</p>

---

## Features

- **Infinite canvas** with frames, layers and smart guides
- **Drag-and-drop UI library** — buttons, inputs, navbars, text blocks and more
- **Frames as containers** — drag elements in and out, auto-nested layers
- **Style inspector** — fills, borders, radius, shadows, typography
- **Multi-page projects** with preview (prototype) mode
- **PNG export**
- **Local-first** — projects are stored as `.bluepen` files on your machine

## Repository layout

```
apps/app/         Tauri shell + editor entry page
  src-tauri/      Rust backend, window config, capabilities
packages/editor/  Shared editor: canvas, layers, inspector, UI kit
scripts/          release tooling
```

## Tech stack

- [Tauri 2](https://tauri.app) + Rust backend
- [Next.js](https://nextjs.org) 16 + React 19
- [Tailwind CSS](https://tailwindcss.com) v4 + [Base UI](https://base-ui.com)
- [pnpm](https://pnpm.io) workspaces

## Requirements

- Node.js 20+ and pnpm
- Rust (stable) with the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/). On Fedora:

  ```bash
  sudo dnf install webkit2gtk4.1-devel openssl-devel gcc gcc-c++ glib2-devel gtk3-devel libayatana-appindicator-gtk3-devel librsvg2-devel
  ```

## Development

```bash
pnpm install
pnpm app:dev    # runs the desktop app with hot reload
```

## Build a local bundle

```bash
pnpm app:build
```

The command builds for the current host platform. The bundles are written below
`apps/app/src-tauri/target/release/bundle/`.

## Publish installers with GitHub Actions

Installers are built and published from this repository. There is no separate
web repository or synchronization step.

1. Push the commit to release and confirm it is available on GitHub.
2. Open the repository's **Actions** tab and select **Build Release**.
3. Select **Run workflow**, enter a release tag such as `v0.1.1`, and enter
   the Git ref to build, such as `main` or a commit SHA.
4. Wait for the Linux, macOS, and Windows build jobs to finish. A successful
   run publishes or updates the GitHub Release for the chosen tag.

The workflow creates the following installer types:

| Platform | Installer formats |
| --- | --- |
| Linux | `.deb`, `.rpm` |
| macOS | `.dmg` |
| Windows | NSIS `.exe` |

If a build fails, open the failed job in the same workflow run. Each platform's
unpublished build outputs are retained as workflow artifacts for seven days,
which allows inspection without creating a partial GitHub Release.

## Contributing

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and report vulnerabilities via
[SECURITY.md](SECURITY.md).

## License

[GNU Affero General Public License v3.0](LICENSE) — © 2026 Bluepen.
