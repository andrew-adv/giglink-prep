# GigLink Prep

Learn how GigLink works by building one small JavaScript project, one piece at a time. This is a separate educational app. The original `andrew-adv/giglink` repository is read-only reference material.

## Current phase: P2

The existing overview and chapter shell lead into six connected JavaScript lessons. The same Sandpack workspace keeps `gig.js`, `validate.js`, and `publish.js`, then adds `browse.js`, `apply.js`, and `review.js`. The learner's actual functions create the event, validate/publish it, build the talent board, match fictional demos, and review an application. Code, completion, current lesson, and attempts save locally. Editing a file clears its completion and the completion of later lessons that depend on it.

The full replay at `/replay` executes all six files and reports the first failing lesson. `/questions` offers 12 presentation questions with answers hidden until requested, deeper source-based explanations, and explicit simulation differences.

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
- Lessons: **http://localhost:5173/lessons/1** through `/lessons/6`
- Full replay: **http://localhost:5173/replay**
- Presentation practice: **http://localhost:5173/questions**
- API: **http://localhost:5000/api/health**

Expected health response (HTTP 200):

```json
{"status":"ok","service":"giglink-prep-api","phase":"P0"}
```

The frontend footer checks this endpoint once on page load. The lessons and local saving do not require the API. Reload after restarting the API to check its status again. Press Ctrl+C to stop the services.

**Running code needs an internet connection:** Sandpack loads its remote CodeSandbox bundler and sends the mini-project files to that sandbox. Only fictional event details should be used. No account, API key, or paid API is needed. The app code never evaluates learner JavaScript in the trusted main window or on Express. The hosted bundler is a dependency of execution; fully offline runs are not promised.

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

**No environment files or secrets are needed for P0–P2.** Defaults are built in. For optional overrides, copy the examples:

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
6. **Replay all 3 lessons** remains available in lesson 3. Continue to lesson 4 and implement safe browsing. Change talent/subscription status and compare which events appear. The board always omits exact venues.
7. Finish lesson 5's demo matching for 1–3 requested samples. Try missing, duplicate, extra, and mismatched fictional clips. No file is uploaded.
8. Finish lesson 6's ownership, capacity, review, and My Applications rules. Try Ada (the owner), Obi (another customer), a full role, acceptance, and rejection. Paid acceptance closes future Paid discovery without a subscription, but the accepted commitment and venue remain in My Applications. Free gigs stay visible.
9. Open `/replay` and press Run / Check. This uses canonical valid demo inputs and your six current files, never reference answers. It shows the first failing lesson, or the complete create → validate → verify/publish → browse → apply → review → venue → discovery sequence.
10. Open `/questions`, think out loud, then reveal each answer. Compare real GigLink behavior with the deliberately smaller simulation.

The functional checks also use different inputs from the selected scene. Your code can pass all checks while an intentionally invalid scenario stays in draft or correctly rejects an action. Each failed scene says where it stopped. The event board blocks rendering the exact venue if incorrect learner code returns it and flags a privacy failure; tests inspect the returned data as well.

**Reset this lesson** restores only that lesson's file. It keeps other files and invalidates dependent completion. The editor supports Tab indentation; Escape then Tab lets keyboard users move focus out of the editor. All six files are editable in every lesson.

Local work is saved after changes with a visible status. Saved progress means the current code passed the relevant checks. Results for stale runs are ignored. Browser storage errors are shown; corrupt saves are not overwritten merely by reading them. Files above 50,000 characters cannot be saved. Clearing this site's browser data removes the workspace. Other browsers/devices have separate workspaces; cross-tab merging and export/import are not part of P2.

### Existing P1 work is retained

P2 reads `giglink-prep.workspace.v1` when no v2 save exists. It preserves the three original source strings, completion, selected lesson, and attempts, then appends the new TODO files with zero attempts. New changes save under `giglink-prep.workspace.v2`; the original v1 key is left intact as a backup. An existing v2 save takes priority. A corrupt v2 save produces a warning rather than silently loading older work.

Lessons 1–3 keep their original starter code and checks. P2 supplies additional `id`, `customerId`, and single `position` fields **before** calling your `createGig`. If your P1 implementation copied individual fields, extend it to retain the added fields too. The lesson 1 contract already explains `...details`; your code is preserved, not silently replaced.

## Verify P2

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

See [P2_VERIFICATION.md](P2_VERIFICATION.md) for coverage, migration details, source references, and manual phone/browser checks. [P1_VERIFICATION.md](P1_VERIFICATION.md) remains the historical P1 report. Browser access was denied earlier in this session; no bypass was attempted. Visual layout, actual Sandpack loading, and persistence across a real browser refresh remain **manually unverified**. The build passes with the existing advisory warning for the lazy-loaded Sandpack chunk exceeding 500 kB before gzip.

## Repository layout

```text
client/
  src/app/          Existing routes, app shell, overview, chapter, API status
  src/content/      Lesson explanations and pinned real source references
  src/features/lab/ Sandpack editor, sandbox runner, behavioral checks, scenes
  src/features/progress/ Local workspace and save/restore
  src/features/questions/ Answer-reveal presentation practice
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

P2 adds no deployment infrastructure. `client/vercel.json` retains the P0 SPA rewrite needed for a direct chapter, lesson, replay, or question URL. A later Vercel project uses root directory `client`, build `npm run build`, and output `dist`, with the public `VITE_API_BASE_URL` set to the API URL ending in `/api`. A later Render service uses root `server`, start `npm start`, health path `/api/health`, and exact `CLIENT_ORIGIN`; Render supplies `PORT`.

Because the lockfile lives at the workspace root, an install from a subdirectory must retain the root workspace/lockfile context (for example, `cd .. && npm ci` as the Render build command). Do not use `npm ci` on an isolated copy of `server/` without a lockfile.

Follow [SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md) when the later phase is authorized. The next phase is **P3: anonymous server persistence with MongoDB and local fallback** in [CODEX_BUILD_PROMPTS.md](CODEX_BUILD_PROMPTS.md); it has not been started.
