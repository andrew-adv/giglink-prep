# GigLink Prep

Learn how GigLink works by building one small JavaScript project, one piece at a time. This is a separate educational app. The original `andrew-adv/giglink` repository is read-only reference material.

## Current phase: P0

The responsive React app has an overview, a three-lesson journey illustration, and a chapter preview at `/chapters/1`. All lesson-play controls are disabled and explicitly marked as previews. The Express API exposes a health endpoint. There is no editor, game execution, saved progress, database, login, payment service, media upload, or AI service yet. No personal data is collected or stored.

## Run locally

Use Node.js **22.12 or newer** (Node 22.21 was used for P0 verification) and npm. Run all commands from this repository's root unless noted.

```sh
npm ci
npm run dev
```

`npm run dev` starts both services:

- Frontend: **http://localhost:5173**
- Chapter preview: **http://localhost:5173/chapters/1**
- API: **http://localhost:5000/api/health**

Expected health response (HTTP 200):

```json
{"status":"ok","service":"giglink-prep-api","phase":"P0"}
```

The frontend footer checks this endpoint once on page load. If the API is unavailable, the static preview still works. Reload after restarting the API to check again. No backend dependency is required to read the chapter preview. Press Ctrl+C to stop the services.

| Root command | What it runs |
| --- | --- |
| `npm run dev` | Vite and the API in watch mode |
| `npm run dev:client` | Only Vite on port 5173 |
| `npm run dev:server` | Only the API on port 5000 |
| `npm run build` | Production frontend build to `client/dist` |
| `npm run preview` | Built frontend on http://localhost:4173 |
| `npm start` | API without watch mode |
| `npm test` | Node API integration test (health, CORS, JSON 404) |

The dev/preview frontend ports are strict: if a port is occupied, stop the conflicting process or choose an explicit alternate port. The API reports startup errors, including an occupied port.

## Environment

**No environment files or secrets are needed for P0.** Defaults are built in. For optional overrides, copy the examples:

```powershell
Copy-Item client/.env.example client/.env.local
Copy-Item server/.env.example server/.env
```

| Variable | Location | P0 default / purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `client/.env.local` | `http://localhost:5000/api`; public browser API URL |
| `PORT` | `server/.env` | `5000`; API binds to `0.0.0.0` |
| `CLIENT_ORIGIN` | `server/.env` | `http://localhost:5173`; exact browser origin allowed by CORS |
| `NODE_ENV` | `server/.env` | Example uses `development`; hosting can set `production` |

Restart the affected process after changing environment files. For `npm run preview`, set `CLIENT_ORIGIN=http://localhost:4173` and restart the API to allow the preview footer's health request. Use `localhost` consistently in the browser; a `127.0.0.1` origin is different for CORS. Never put secrets in `VITE_` variables. `.env` files are ignored; only the examples belong in Git.

## Verify P0

```sh
npm test
npm run build
npm start
```

In another terminal:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

Open the frontend with `npm run dev:client`. Check the overview and chapter preview at a narrow phone width, follow both navigation links, refresh `/chapters/1`, and confirm that the lesson/Run controls are disabled. When both services are running, the footer should say “API connected.” Stop the API and reload: it should say the API is unavailable while the page remains usable.

## Repository layout

```text
client/
  src/app/          Routes, app shell, preview pages, API status
  src/content/      Planned connected lessons
  src/styles/       Mobile-first CSS
  public/           Local favicon
  vercel.json       SPA fallback to index.html
server/
  src/app.js        Express app and health route
  src/server.js     HTTP listener
  test/             HTTP contract test
```

The root npm workspace shares a single `package-lock.json`. Install with `npm ci` at the repository root. Both packages also expose their own build/start scripts for hosting.

## Deployment groundwork only

P0 is local-only; nothing has been deployed. `client/vercel.json` provides the SPA rewrite needed for a direct chapter URL. A later Vercel project uses root directory `client`, build `npm run build`, and output `dist`, with the public `VITE_API_BASE_URL` set to the API URL ending in `/api`. A later Render service uses root `server`, start `npm start`, health path `/api/health`, and exact `CLIENT_ORIGIN`; Render supplies `PORT`.

Because the lockfile lives at the workspace root, an install from a subdirectory must retain the root workspace/lockfile context (for example, `cd .. && npm ci` as the Render build command). Do not use `npm ci` on an isolated copy of `server/` without a lockfile.

Follow [SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md) when the later phase is authorized. Atlas and persistence wait until P3. The next phase is **P1: the three connected, playable lessons** in [CODEX_BUILD_PROMPTS.md](CODEX_BUILD_PROMPTS.md); it has not been started.
