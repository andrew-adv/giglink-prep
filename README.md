# GigLink Prep

Learn how GigLink works by building one small JavaScript project, one piece at a time. This is a separate educational app. The original `andrew-adv/giglink` repository is read-only reference material.

## Current phase: P1

The existing overview and chapter shell now lead into three connected JavaScript lessons. The learner edits `gig.js`, `validate.js`, and `publish.js` in Sandpack, runs behavioral checks in its browser sandbox, and sees an event card made from the executed code. Code, completion, current lesson, and attempts save to localStorage. Editing a file clears its completion and the completion of later lessons that depend on it.

There is no database, login, real payment service, media upload, or AI service. No identity data is requested. The Express API remains the P0 health-only skeleton; it never receives or executes learner code.

## Run locally

Use Node.js **22.12 or newer** (Node 22.21 was used for P0 verification) and npm. Run all commands from this repository's root unless noted.

```sh
npm ci
npm run dev
```

`npm run dev` starts both services:

- Frontend: **http://localhost:5173**
- Chapter: **http://localhost:5173/chapters/1**
- Lessons: **http://localhost:5173/lessons/1**, `/lessons/2`, `/lessons/3`
- API: **http://localhost:5000/api/health**

Expected health response (HTTP 200):

```json
{"status":"ok","service":"giglink-prep-api","phase":"P0"}
```

The frontend footer checks this endpoint once on page load. The lessons and local saving do not require the API. Reload after restarting the API to check its status again. Press Ctrl+C to stop the services.

**Running code needs an internet connection:** Sandpack loads its remote CodeSandbox bundler and sends the mini-project files to that sandbox. Only fictional event details should be used. No account, API key, or paid API is needed. The app code never evaluates learner JavaScript in the trusted main window or on Express. The hosted bundler is a dependency of execution, so P1 does not promise fully offline runs.

| Root command | What it runs |
| --- | --- |
| `npm run dev` | Vite and the API in watch mode |
| `npm run dev:client` | Only Vite on port 5173 |
| `npm run dev:server` | Only the API on port 5000 |
| `npm run build` | Production frontend build to `client/dist` |
| `npm run preview` | Built frontend on http://localhost:4173 |
| `npm start` | API without watch mode |
| `npm test` | Frontend behavior/persistence/runner tests, then the API integration test |

The dev/preview frontend ports are strict: if a port is occupied, stop the conflicting process or choose an explicit alternate port. The API reports startup errors, including an occupied port.

## Environment

**No environment files or secrets are needed for P0/P1.** Defaults are built in. For optional overrides, copy the examples:

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

## Use the code lab

1. Open lesson 1. On a phone, switch between **Learn**, **Code**, and **Result**. On a wide screen, the panes appear together.
2. Press **Run / Check** before fixing the TODO. Read the failing checks. Type a solution into `gig.js`; a worked example is available under Learn.
3. Try another fictional title and run again. The card must follow the returned object.
4. Continue to lesson 2 and finish `validate.js`. Earlier files are retained and still used. Test an empty title and a paid gig below ₦25,000.
5. Finish `publish.js` in lesson 3. A browser claim alone must leave the gig in draft. Simulated backend verification can publish a valid unpaid draft.
6. Use **Replay all 3 lessons** to run the complete chain with simulated backend proof. It uses all three current files; it does not load a reference answer.

The functional checks also use different inputs from the selected scene. This means your code can pass the checks while an intentionally invalid scenario correctly stays in draft. The scene always shows your code's actual result, including wrong publication behavior; the checks explain why it is wrong.

**Reset this lesson** restores only that lesson's file. It keeps other files and invalidates dependent completion. The editor supports Tab indentation; Escape then Tab lets keyboard users move focus out of the editor. All three files are editable in every lesson.

Local work is saved after changes with a visible status. Saved progress means the current code passed the relevant checks. Results for stale runs are ignored. Browser storage errors are shown; corrupt saves are not overwritten merely by reading them. Files above 50,000 characters cannot be saved. Clearing this site's browser data removes the workspace. Other browsers/devices have separate workspaces; cross-tab merging and export/import are not part of P1.

## Verify P1

```sh
npm test
npm run build
npm start
```

In another terminal:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

Frontend tests execute only repository-authored starter, solution, and deliberately wrong fixtures in isolated Node VM modules. They run the same behavioral checks and scene code as the sandbox, including the DOM runner with a small test DOM. They also test serialization/restoration of local work and result-message validation. This verifies application logic; it does not substitute for a real Sandpack/browser integration run.

See [P1_VERIFICATION.md](P1_VERIFICATION.md) for exact automated coverage, source references, and a short phone/browser checklist. Browser access was not approved in this session, so visual layout, actual Sandpack loading, and persistence across a real page refresh remain **manually unverified**. The build passes with an advisory warning for the lazy-loaded Sandpack chunk exceeding 500 kB before gzip.

## Repository layout

```text
client/
  src/app/          Existing routes, app shell, overview, chapter, API status
  src/content/      Lesson explanations and pinned real source references
  src/features/lab/ Sandpack editor, sandbox runner, behavioral checks, scenes
  src/features/progress/ Local workspace and save/restore
  src/styles/       Mobile-first CSS
  test/             Authored-fixture behavior, runner, progress, report tests
  public/           Local favicon
  vercel.json       SPA fallback to index.html
server/
  src/app.js        Express app and health route
  src/server.js     HTTP listener
  test/             HTTP contract test
```

The root npm workspace shares a single `package-lock.json`. Install with `npm ci` at the repository root. Both packages also expose their own build/start scripts for hosting.

## Deployment groundwork only

P1 is local-only; this phase adds no deployment infrastructure. `client/vercel.json` retains the P0 SPA rewrite needed for a direct chapter or lesson URL. A later Vercel project uses root directory `client`, build `npm run build`, and output `dist`, with the public `VITE_API_BASE_URL` set to the API URL ending in `/api`. A later Render service uses root `server`, start `npm start`, health path `/api/health`, and exact `CLIENT_ORIGIN`; Render supplies `PORT`.

Because the lockfile lives at the workspace root, an install from a subdirectory must retain the root workspace/lockfile context (for example, `cd .. && npm ci` as the Render build command). Do not use `npm ci` on an isolated copy of `server/` without a lockfile.

Follow [SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md) when the later phase is authorized. Atlas and server persistence wait until P3. The next phase is **P2: extend the same project through browsing, applying, acceptance, and CTO preparation** in [CODEX_BUILD_PROMPTS.md](CODEX_BUILD_PROMPTS.md); it has not been started.
