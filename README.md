# Customer DB — Vue 3 frontend

The single-page application for the Customer DB API. Vue 3 + Vite + TypeScript, Pinia for state,
Vue Router for navigation, and the Oxc toolchain (oxlint + oxfmt) for linting and formatting.

## Features

- Session handling for the API's access + refresh token model: the access token stays in memory,
  the refresh token lives in an HttpOnly cookie. A single-flight interceptor refreshes on `401` and
  replays the request; when refresh fails the app returns to the login screen.
- Route guards with session bootstrap, guest-only routes and redirect-after-login.
- Customer management: searchable, status-filtered, paginated table, create/edit modal, detail page
  with avatar upload/removal, soft-delete confirmation.
- Import/export workspace: queue CSV exports and imports, poll job progress, download completed
  exports, review per-row import errors and grab a CSV template.
- Dashboard with cached statistics and recently added customers.
- Profile page: display name, password change (revokes other sessions) and account metadata.
- Minimal design system: CSS custom properties for light/dark themes, a small set of accessible
  components and a system-font stack. No UI framework.

## Requirements

- Node.js `^22.18.0` or `>=24.12.0`
- The Customer DB API running (see the sibling `slim4-starter-pack` repository)

## Quick start

```bash
npm install
cp .env.example .env       # set VITE_API_BASE_URL if the API is not on localhost:8080
npm run dev
```

The app runs at http://localhost:5173. Start the API and its worker with `composer run dev` in the
backend repository; the backend `.env.example` already allows the dev origin
(`CORS_ALLOWED_ORIGINS="http://localhost:5173"`, `CORS_ALLOW_CREDENTIALS=true`) so the refresh
cookie works.

Sign in with the seeded administrator (`admin@example.com` / `Admin123!`) or register a staff
account.

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | same origin | Base URL of the API. Empty uses the SPA's own origin, which is the recommended production setup behind one reverse proxy. |

Vite embeds environment variables at build time, so set `VITE_API_BASE_URL` before `npm run build`
in CI.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server with HMR. |
| `npm run build` | Type-check and produce a production build in `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run type-check` | `vue-tsc` project check. |
| `npm run lint` / `lint:fix` | oxlint over the project. |
| `npm run format` / `format:check` | oxfmt formatting. |
| `npm run test:unit` | Vitest suite (jsdom). |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run check` | lint + format check + type-check + unit tests. |

## Project structure

```text
src/
├── api/            fetch client (auth/refresh/retry), endpoint modules and shared types
├── components/     AppButton, AppInput, AppModal, CustomerForm, JobProgress, ...
├── composables/    useTheme, useDebouncedRef
├── layouts/        AppShell (sidebar + topbar), AuthLayout
├── router/         routes and session guards
├── stores/         auth and toast Pinia stores
├── styles/         design tokens, reset and shared utilities
├── utils/          formatting and error helpers
└── views/          Dashboard, Customers, CustomerDetail, Transfer, Profile, auth views
```

## Architecture notes

- **Token handling** lives in `src/api/client.ts`. `apiFetch()` unwraps the backend envelope
  (`status`/`message`/`data` plus `total_page`/`total_data` for lists) and throws `ApiError` with
  field-level validation messages for forms.
- **The auth store** (`src/stores/auth.ts`) owns the session state; `init()` is single-flight and is
  awaited by the router guard so there is no login flash on reload.
- **Unreadable cookies** are expected in development: the refresh cookie is HttpOnly, so the SPA can
  never inspect it; it only calls `/auth/refresh` and reacts to the result.
- **Styling**: add colors and spacing to `src/styles/main.css` tokens instead of hardcoding values;
  dark mode follows the system preference unless the user picks a theme in the sidebar.
- **Types** mirror the API contract in `src/api/types.ts`; update them together with the backend.

## Testing

```bash
npm run test:unit
```

Vitest runs in jsdom. The suite covers the API client (refresh single-flight, retry, error
mapping), the toast store and formatting helpers. The full flow (login, customer CRUD, avatars,
CSV import/export) is exercised end-to-end against the running backend.

## Deployment

`npm run build` emits a static bundle in `dist/`. Serve it with any web server and point
`VITE_API_BASE_URL` at the API. Preferred production topology: one origin, one reverse proxy — the
SPA at `/` and the API under `/api` (or the API at the root with the SPA assets served alongside),
so cookies stay same-site and CORS is unnecessary.

```nginx
server {
    listen 80;
    server_name your_domain;
    root /var/www/customer-db/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## License

Released under the [MIT License](LICENSE).
