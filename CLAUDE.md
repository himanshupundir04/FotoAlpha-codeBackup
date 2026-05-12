# FotoAlpha Desktop — CLAUDE.md

## Project Overview

React + Electron desktop application for FotoAlpha. Electron wraps the React web app and exposes native desktop capabilities: local filesystem access, tray, auto-updater, chokidar file watching, and IPC between the renderer and main process.

State: Redux Toolkit. UI: MUI v7 + Tailwind CSS. API: Axios. Desktop layer: Electron (`electron/main.js` + `electron/preload.js`).

**Entry point:** `src/index.js` → `src/App.js` (renderer) | `electron/main.js` (main process)

## Directory Structure

```
src/
  App.js                  # Router root — route definitions only
  Component/
    Common/               # Shared UI components
    Photographer/         # Photographer-role screens
    Organization/         # Organization screens
    Guest/                # Guest screens
    Auth/                 # Login/auth flows
    Landing/              # Landing pages
    ForgetPassword/       # Password recovery flow
    CoinPurchase/         # Coin purchase UI
    Context/              # React Context providers
    image/                # Static assets only
  services/               # All API + business logic
electron/
  main.js                 # Electron main process — window management, IPC handlers, native integrations
  preload.js              # Context bridge — only expose what the renderer strictly needs
```

## Architecture Rules

### DO

- **Strict IPC boundary.** All communication between the Electron main process and the React renderer must go through the context bridge (`electron/preload.js`). Expose only the minimum needed API surface via `contextBridge.exposeInMainWorld`.
- **Main process handles native concerns only** — filesystem ops, tray, auto-update, shell, dialog, chokidar watchers. Never put UI logic or API calls in `electron/main.js`.
- **Renderer process is the React app** — it must not call `require('fs')` or any Node.js built-ins directly. Route all native needs through the IPC bridge.
- **All API calls go in `src/services/`.** Components never call `axios` directly.
- **File-system watching logic** (chokidar) lives in `electron/main.js` and emits events to the renderer via IPC, not in React components.
- **Shared components in `Component/Common/`** — if two roles use the same UI, it belongs there.
- **Desktop-specific features** (local folder picker, native file open, tray menu) are wrapped in a dedicated service file (e.g., `src/services/desktopService.js`) that abstracts the IPC calls so components stay clean.
- **Use `electron-store`** for persisted desktop settings — never localStorage for Electron-only config.

### DO NOT

- **Do not write monolithic Electron main process files.** Split by concern: window management, IPC handlers, tray, updater. Import each from `electron/main.js` rather than writing everything inline.
- **Do not expose Node.js / Electron APIs broadly in `preload.js`.** Exposing `require` or the entire `ipcRenderer` object is a security vulnerability — expose only named, typed methods.
- **Do not duplicate React components from the web app** — desktop layout may differ but service logic should be shared from `src/services/`.
- **Do not hardcode paths** (`C:\Users\...`, `/home/...`) — use Electron's `app.getPath()` APIs.
- **Do not call native APIs from React components directly.** Always proxy through the IPC bridge.
- **Do not add console.log in committed code.**
- **Do not create `_old` or backup copies of files inside the repo** — use git branches for that.
- **Do not put business logic inside `electron/main.js`** — it belongs in services called from the renderer.
- **Do not hardcode API URLs or keys** — use `process.env.REACT_APP_*` for renderer, and `.env` for main process values.

## Security Rules (Electron-specific)

- `nodeIntegration: false` and `contextIsolation: true` must remain enabled in `BrowserWindow` options.
- Never disable `webSecurity` in production.
- Validate all data received via IPC in `main.js` before acting on it.
- Never load remote URLs in `BrowserWindow` without explicit CSP headers.

## Code Style

- **Components:** Functional + hooks only.
- **File naming:** PascalCase for components, camelCase for services and utils.
- **Async:** `async/await` only. No callback-style async in new code.
- **IPC naming convention:** `kebab-case` channel names (e.g., `'watch:folder'`, `'dialog:open-directory'`).
- **No inline comments** explaining what the code does — only *why* when non-obvious.

## DRY Checklist (before committing)

- Is this IPC call already abstracted in `desktopService.js` (or equivalent)? → reuse it.
- Is this UI component already in `Component/Common/`? → use it.
- Is this API call already in a service? → import it.
- Is this electron main-process pattern repeated in two places? → extract to a helper module.

## Cross-Repo Sync Rule — MANDATORY

FotoAlpha has three sibling repos that share ~90% of their React component tree:

| Repo | Purpose | UploadPhoto folder name |
|------|---------|------------------------|
| `fotoalpha/` | Web app | `UploadPhoto/` |
| `fotoAlpha-APK/` | Mobile / Capacitor APK | `UploadPhoto/` |
| `FotoAlpha-codeBackup/` | Desktop / Electron (this repo) | `UploadPhotos/` (plural) |

**Every component fix or refactor applied here MUST be applied to the same component in the other two repos** if that component exists there in the same or equivalent form.

### How to apply a change across repos

1. Make and verify the change in this repo first.
2. Find the equivalent file(s) in `fotoalpha/` and `fotoAlpha-APK/`.
3. Apply the same change — adapting only for path differences (e.g. `UploadPhotos/` vs `UploadPhoto/`) or platform-specific imports.
4. Do **not** skip a repo just because the file looks slightly different — if the pattern is the same, the fix applies.

### What counts as "the same pattern"

- Duplicate component files across Photographer/Organization roles
- API calls using `axios` directly instead of a service file
- Form logic, validation schemas, or state management repeated verbatim
- Dialogs, modals, or UI blocks copy-pasted across role folders
- Bug fixes (a bug in one repo is almost certainly present in the others)

### Common/ shared components

When a component is extracted into `Component/Common/` in one repo, create the identical file in all repos' `Component/Common/` folders and update all role-specific wrappers there too.

## Running Locally

```bash
npm start                          # Start React dev server
npm run electron-dev               # (if script exists) Start Electron with hot reload
CI=true npm run build              # Lint-as-errors build — run only when needed (see workspace CLAUDE.md)
npm run build && npx electron .    # Production build + launch
npm run package-win                # Full Windows installer (packaging only)
```
