# Repository Guidelines

## Project Structure

This is a small CommonJS Node/Express POS and Khata ledger app. `server.js` configures the app; `routes/` contains Express routers; `lib/` contains pricing, tax, inventory, order, ledger, storage, date, invoice, and reporting logic. `config.js` holds shop, tax, coupon, and inventory settings. `public/` contains the browser UI (`index.html`, `js/app.js`, `css/style.css`). `data/db.json` is persistent application data, `test/` contains Node's built-in test-runner tests, and `docs/architecture.svg` diagrams the main flows.

## Development Commands

- `npm start` — runs the Express server on port 3000, or `PORT` if set.
- `npm test` — currently a placeholder that exits with “Error: no test specified”; it does not run a test suite.

There is no build, lint, or formatting script configured. Dependencies are declared in `package.json` and pinned by `package-lock.json`.

## Style & Naming

Match the existing CommonJS and ES5-style JavaScript: `var`, `require()`, and exported functions such as `exports.computeTotals`. Use two-space indentation, semicolons, and single-quoted strings. Name files in lowercase, using short descriptive names (for example, `lib/pricing.js`); use camelCase for functions and variables. Keep route handlers thin and put reusable business rules in `lib/`.

## Testing

Tests use Node's built-in `node:test` and `node:assert`; run them with `node --test`. `npm test` is still a placeholder and does not execute them. Add focused tests for behavior changes and manually verify affected API and browser flows. Check pricing, GST, coupon, and invoice changes together because invoice figures must match order totals.

## Commits & Pull Requests

Recent commits use short, lowercase, descriptive summaries (for example, `invoice page for accountant`). Follow that style; no stricter convention is configured. Include a concise change summary and verification notes in pull requests. For UI changes, add screenshots; for accounting or pricing changes, describe expected total/tax behavior and include representative cases.

## Data & Configuration

Treat `data/db.json` as live app data: avoid unrelated edits and preserve valid JSON and existing records. Keep environment-specific values and credentials out of source changes; `config.js` currently contains shop settings and an admin key, so handle those values carefully.
