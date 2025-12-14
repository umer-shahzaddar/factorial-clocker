# Copilot Instructions for factorial-clocker

## Project Overview

**factorial-clocker** is an automated timekeeping system that clocks in work hours (9-17) for a Factorial HR account. It consists of:
- **Playwright automation** (`tests/clock-in.spec.js`): Logs into Factorial, navigates the UI, and auto-fills missing 8-hour days
- **Express server** (`server.js`): Provides a web UI and triggers GitHub Actions workflows
- **Web UI** (`public/index.html`): Form to submit credentials and monitor test execution status

## Architecture & Data Flow

1. **Browser Automation** → **Factorial HR Website**: Playwright headless browser logs in with credentials from `.env.local` and fills clock-in records
2. **Server** ↔ **GitHub Actions**: The Express server spawns `gh workflow run clocker.yaml` to execute tests in CI/CD
3. **Web UI** ↔ **Server**: Frontend POST requests to `/run-test` trigger workflows; communicates status via `/cancel-test`

## Key Files & Patterns

### Playwright Test (`tests/clock-in.spec.js`)
- **Selectors**: XPath-based selectors for Italian HR interface (e.g., `//span[@title="-8 ore"]` for "missing 8 hours")
- **State Management**: Writes `status.json` to track login failures and days remaining across test runs
- **Environment**: Loads credentials from `.env.local` (USERNAME, PASSWORD) via `dotenv`
- **Iteration Pattern**: Dynamically generates 31 test cases (one per day) that skip once all days are processed
- **Cookie Injection**: Pre-sets consent cookies to bypass GDPR prompts

### Express Server (`server.js`)
- **Core Endpoint**: `POST /run-test` spawns `gh` CLI command with username/password workflow inputs
- **Process Management**: Handles `req.on('aborted')` to kill spawned processes; `/cancel-test` terminates any active Playwright process
- **Static Files**: Serves `public/` at root (e.g., `/` serves `index.html`)

### Frontend (`public/index.html`)
- **Form Fields**: Username (text) and Password (password input)
- **Status Display**: Classes `.success` (green), `.error` (red), `.in-progress` (orange) indicate test state
- **API Integration**: Submits to `POST /run-test`; disabled state during execution

## Critical Developer Workflows

### Local Testing
```bash
npm install                    # Install Express + Playwright deps
cp template.env.local .env.local  # Create credentials file
npx playwright test            # Run tests locally (iterates 31 days)
node server.js                 # Start Express server on :3000
```

### CI/CD Trigger
GitHub Actions workflow (`clocker.yaml`) accepts `username` and `password` as inputs, called by server's `gh workflow run` command.

### Debugging
- Check `status.json` for login failure state (`LOGIN_FAILED: true` stops execution)
- Playwright timeout: 30s locally, 60s in CI (configurable in `playwright.config.js`)
- Selectors may break if Factorial UI changes (all hardcoded XPaths in test file)

## Project-Specific Conventions

1. **Credentials**: Always sourced from `.env.local` (never hardcoded); `template.env.local` is the template
2. **State File**: `status.json` persists across runs to avoid re-processing completed days
3. **Single Worker**: `playwright.config.js` enforces `workers: 1` to prevent race conditions on Factorial
4. **Italian UI**: Selectors use Italian labels (`"Invia"`, `"Salvato con successo"`) - required for stability
5. **Fixed Time Input**: Hardcoded as 9:17 (9am to 5pm) via keyboard input to hour/minute fields

## Integration & Dependencies

- **Express 4.21**: REST API; static file serving
- **Playwright 1.49**: Browser automation; runs only on Chromium
- **dotenv**: Loads `.env.local` for credentials (must exist)
- **GitHub CLI**: `gh` binary required on server machine for workflow triggering
- **Node.js 22.10+**: Required version (check `package.json` devDependencies)

## Common Tasks

**Adding a new selector**: Update XPath in `tests/clock-in.spec.js` and test with `await page.locator(selector).isVisible()` before committing.

**Modifying hours**: Change hardcoded key presses in `fill8HourDays()` (currently `Digit9`, `Digit0`, `Digit1`, etc. for 9:17).

**Changing iteration count**: Modify `utils.MISSING_DAYS` constant (default 31 days) in test file.
