# E2E Tests

Playwright test suite for Liveblog.

## Structure

```
client/e2e/
├── playwright.config.ts
├── fixtures/
│   └── index.ts              # Auth fixtures (authenticatedPage, contributorPage, resetDb)
├── api/
│   └── client.ts             # HTTP client for data seeding
├── pages/                    # Page objects — one file per feature area
└── tests/
    ├── auth/
    ├── blogs/
    ├── editor/
    ├── syndication/
    ├── timeline/
    └── managers/
```

## Running

Before running the tests, make sure all services are up:

- Docker services (MongoDB, Redis, Elasticsearch)
- Backend server
- Frontend client (served on port 9000)

```bash
cd client/e2e
npm ci
npx playwright install chromium
npx playwright test          # run all tests
npx playwright test --ui     # interactive UI mode
npx playwright test tests/editor/drafts.spec.ts  # single spec
```

## Conventions

- Never use `waitForTimeout`. Use explicit conditions (`waitFor`, `toBeVisible`, `toHaveCount`).
- `fill()` over `type()` for inputs.
- DB is reset automatically before every test via the `resetDb` auto fixture — no `beforeEach` prepopulate calls in specs.
- Sidebar nav uses `.dispatchEvent('click')` — not `.click()` — due to blog image overlays intercepting pointer events.
- The embed test (`editor/embed.spec.ts`) is skipped automatically if `IFRAMELY_KEY` is not set.

## Gotchas

- **Sir Trevor content race** — after loading an existing post into the editor, `.st-text-block` appears before content is populated. Always `waitFor({ hasText })` before interacting.
- **Sequential saves** — notification-based waits resolve on the previous notification still in the DOM. Use `waitForResponse` set up before the click instead.
- **`saveAsDraft` / `saveAsContribution`** — updating an existing post uses `PATCH`, not `POST`. The response filter must accept both.
- **Freetype scorecard selectors** — `freetypeService.transform()` uses a module-level counter. On a fresh page load, home scorers → `iterator__1`, away scorers → `iterator__2`. The counter resets on `page.reload()`.
- **`.scorecard-top` ambiguity** — renders in both the editor panel and timeline post previews. Always scope to `.panel--editor .scorecard-top`.
- **AngularJS `reloadOnSearch: false`** — navigating to the same hash path with different query params does not re-run the controller. Navigate away first, then to the target URL with params.
- **Poll clamping** — hours max 24, minutes max 60, enforced in `onChange`. `fill()` triggers the handler correctly.
