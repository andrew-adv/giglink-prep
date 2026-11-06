# GigLink Prep

Learn how GigLink works by building one small JavaScript project, one piece at a time. This is a separate educational app. The original `andrew-adv/giglink` repository is read-only reference material.

## Current phase: P3

The existing overview and chapter shell lead into six connected JavaScript lessons. The same Sandpack workspace keeps `gig.js`, `validate.js`, and `publish.js`, then adds `browse.js`, `apply.js`, and `review.js`. The learner's actual functions create the event, validate/publish it, build the talent board, match fictional demos, and review an application. Code, completion, current lesson, and attempts save locally. Editing a file clears its completion and the completion of later lessons that depend on it.

The full replay at `/replay` executes all six files and reports the first failing lesson. `/questions` offers 12 presentation questions with answers hidden until requested, deeper source-based explanations, and explicit simulation differences.

Every lesson now has an optional **Show me how** walkthrough with commented JavaScript, changing line highlights, a changing visual demonstration, short explanations, and Back / Next / Replay / Close controls. Lesson 1 explains the basics without assuming JavaScript knowledge. Later guides offer authored choices about payment, browsing, auditions, and reviews. Demos never edit code, award completion, increment attempts, or change the selected saved lesson.

The global header offers **Dark**, **Light**, and **System** themes. New visitors start in Dark. A saved preference takes priority; System follows OS changes. The preference uses a separate `giglink-prep.theme.v1` key; the workspace v2 format and P1 backup remain unchanged. The app, guided demos, editor, and simulation preview share palette tokens.

Progress now saves locally first and can synchronize to MongoDB through Express. There is no login, personal profile, real payment service, media upload, or AI service. Express stores validated code strings and progress; it never executes learner code. Lessons, grading, guides, questions, themes, and the Sandpack runner retain their P2.1 behavior.

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
{"status":"ok","service":"giglink-prep-api","phase":"P3","database":"not-configured"}
```

`database` is `connected`, `unavailable`, or `not-configured`. Health stays HTTP 200 when the API itself works; progress requests return 503 while the database is unavailable. No URI, host, credential or driver error is exposed. The footer checks API availability once; the progress banner separately reports actual synchronization. Lessons and local saving do not require the API. Press Ctrl+C to stop the services.

**Running learner code needs an internet connection:** Sandpack loads its remote CodeSandbox bundler and sends the mini-project files to that sandbox. The lesson explanation and guided walkthrough load independently; Sandpack is loaded only after **Open coding lab** (or **Open replay lab**). Once the app assets are available, guides need no bundler connection. This does not add an offline installation/service worker. Only fictional event details should be used. No account, API key, or paid API is needed. The app code never evaluates learner JavaScript in the trusted main window or on Express.

| Root command | What it runs |
| --- | --- |
| `npm run dev` | Vite and the API in watch mode |
| `npm run dev:client` | Only Vite on port 5173 |
| `npm run dev:server` | Only the API on port 5000 |
| `npm run build` | Production frontend build to `client/dist` |
| `npm run preview` | Built frontend on http://localhost:4173 |
| `npm start` | API without watch mode |
| `npm test` | Frontend behavior/persistence/runner tests, then database-independent API tests |
| `npm run test:mongo --workspace=server` | Opt-in real MongoDB save/read/update/conflict/reconnection check; removes its temporary document |

The dev/preview frontend ports are strict: if a port is occupied, stop the conflicting process or choose an explicit alternate port. The API reports startup errors, including an occupied port.

## Environment

**Local learning works without MongoDB.** To enable server saving, use Node 22.12+ and configure a separate Prep database. Copy each example only if that local file does not already exist; preserve existing private settings:

```powershell
if (!(Test-Path -LiteralPath client/.env.local)) { Copy-Item client/.env.example client/.env.local }
if (!(Test-Path -LiteralPath server/.env)) { Copy-Item server/.env.example server/.env }
```

| Variable | Location | Default / purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `client/.env.local` | `http://localhost:5000/api`; public browser API URL |
| `PORT` | `server/.env` | `5000`; API binds to `0.0.0.0` |
| `CLIENT_ORIGIN` | `server/.env` | `http://localhost:5173`; exact browser origin allowed by CORS |
| `NODE_ENV` | `server/.env` | Example uses `development`; hosting can set `production` |
| `MONGODB_URI` | **Only** `server/.env` | Empty means local saving only; your private Atlas driver connection string |

Restart the affected process after changing environment files. For `npm run preview`, set `CLIENT_ORIGIN=http://localhost:4173` and restart the API to allow the preview footer's health request. Use `localhost` consistently in the browser; a `127.0.0.1` origin is different for CORS. Never put secrets in `VITE_` variables. `.env` files are ignored; only the examples belong in Git.

### Configure MongoDB locally

1. In MongoDB Atlas, use a separate `giglink-prep` project/cluster and database user. Grant that user read/write access to `giglink_prep`, and allow your current IP in Network Access. Do not reuse the original GigLink database. No Atlas resource creation or deployment is performed by this app.
2. Put your own Atlas Node driver URI in ignored `server/.env` as `MONGODB_URI=...`. Use URL-encoded database credentials in that private file. Do not paste it into chat, commit it, or put it in `client/.env.local`. The server explicitly selects **`giglink_prep`**, regardless of the database path in the URI, to avoid writing into another database. Its collection is `learnerprogresses`.
3. Run `npm ci`, then `npm run dev` from the repository root. Open `http://localhost:5173`. Check `http://localhost:5000/api/health` for `database: "connected"`. A failed initial connection retries every 30 seconds; the API remains available and the UI continues locally.
4. Run `npm run test:mongo --workspace=server` for an explicit real-database check. It creates only a random temporary learner document in `giglink_prep`, checks isolation and concurrent revision conflicts, closes/reopens the HTTP API and MongoDB connection, verifies the saved work, and deletes that document. No tokens or URI values are printed. A successful script is not a real-browser Sandpack test.
5. Follow the restart/Atlas procedure in [P3_VERIFICATION.md](P3_VERIFICATION.md) to inspect your own browser's persistent save and verify a full API process restart.

### How anonymous saving works

The browser generates a 32-byte random token with `crypto.getRandomValues` and stores it at `giglink-prep.learner.v1`. **Anyone who obtains this token can read or replace that learner's saved work.** It is a bearer credential, not a public learner number. The app never displays or logs it; do not share it, screenshot request headers, or paste it into a URL. Use fictional code/data. Clearing browser storage loses the token and access to that server copy; there is no account recovery or cross-device login.

The existing workspace v2 and P1 backup keys are unchanged. Synchronization stores its last acknowledged workspace/revision and latest conflict recovery pair separately at `giglink-prep.sync.v1`. The theme still uses its own key. Work loads from this device immediately. A background GET reconciles the server copy before any PUT. Empty starter work is not uploaded over an existing save.

- Local edits save immediately through the existing localStorage path. Remote changes debounce for 900 ms. Only changed workspace content is uploaded; theme changes and guided interactions do not write progress.
- An unchanged device may load a newer remote copy before the coding lab opens. An already-open editor requires a choice, protecting pending edits. Unsynced device edits may upload only when the server still matches the acknowledged baseline. A stale/missing server revision or two different edited copies pauses synchronization.
- On conflict, download either copy and choose **Keep device version** or **Load server version**. Both earlier copies are kept in a recovery backup before replacement; the backup can be downloaded under **About anonymous saving**. It contains code, never the bearer token. Only the latest conflict pair is retained; this is not a version-history system.
- The server conditionally writes at the expected revision. A mismatch returns 409 and requires another choice. No automatic code merge is attempted. Loading a server copy also refreshes an already-open editor.
- A sleeping API, failed database, timeout, or lost response leaves device work usable and says **Waiting to sync**. It retries after 30 seconds, on the browser's online event, or via **Try sync now**. Reconnection reads the server before retrying a write. A cloud-saved message appears only after a confirming API response.
- If local storage is blocked/full, keep the tab open and copy/download work. The app refuses to replace code when it cannot first save recovery/local data, and will not upload memory-only edits as a durable synchronization baseline.

### Progress API

`GET /api/progress` and `PUT /api/progress` use `Authorization: Bearer <64 lowercase hex characters>`. This deliberately replaces the blueprint's token-in-URL proposal: credentials do not belong in ordinary URL/access logs. The database key is a SHA-256 digest of the token, not the token itself. Responses use `Cache-Control: no-store` and never return that key or credential. CORS permits only `CLIENT_ORIGIN`; use HTTPS when hosting is addressed in P4.

GET returns `{ "progress": null }` if no save exists, otherwise `{ "progress": { "workspace": ..., "revision": 1, "createdAt": "...", "updatedAt": "..." } }`. PUT accepts only `{ "workspace": ..., "expectedRevision": 0 }`, where 0 creates a document and subsequent saves use the last confirmed revision. A successful write increments it. Timestamps are assigned by the server, not accepted from clients.

Workspace fields are exactly `version` (2), `codeFiles`, `completed`, `attempts`, and `currentLesson` (1–6). Exactly `/gig.js`, `/validate.js`, `/publish.js`, `/browse.js`, `/apply.js`, `/review.js` are accepted, each at most 50,000 characters. Completion IDs must be unique integers 1–6; all six attempt counts must be integers 0–1,000,000. The JSON body is limited to 512 KiB, including encoding overhead. Unknown keys, operators, invalid credentials and malformed JSON are rejected. Statuses: 201 create, 200 read/update, 400 invalid data, 401 invalid credential, 409 revision conflict, 413 oversized body, 503 unavailable storage. The server does not evaluate code or independently re-grade completion.

## Use the code lab

1. Open lesson 1. Try **Show me how**, or choose **Open coding lab** to work on your own files. In the coding lab, phone users switch between **Learn**, **Code**, and **Result**; wide screens show panes together. Show me how remains available near the explanation inside the coding lab.
2. Press **Run / Check** before fixing the TODO. Read the failing checks. Type a solution into `gig.js`; a worked example is available under Learn.
3. Try another fictional title and run again. The card must follow the returned object.
4. Continue to lesson 2 and finish `validate.js`. Earlier files are retained and still used. Test an empty title and a paid gig below ₦25,000.
5. Finish `publish.js` in lesson 3. A browser claim alone must leave the gig in draft. Simulated backend verification can publish a valid unpaid draft.
6. **Replay all 3 lessons** remains available in lesson 3. Continue to lesson 4 and implement safe browsing. Change talent/subscription status and compare which events appear. The board always omits exact venues.
7. Finish lesson 5's demo matching for 1–3 requested samples. Try missing, duplicate, extra, and mismatched fictional clips. No file is uploaded.
8. Finish lesson 6's ownership, capacity, review, and My Applications rules. Try Ada (the owner), Obi (another customer), a full role, acceptance, and rejection. Paid acceptance closes future Paid discovery without a subscription, but the accepted commitment and venue remain in My Applications. Free gigs stay visible.
9. Open `/replay`, choose **Open replay lab**, and press Run / Check. This uses canonical valid demo inputs and your six current files, never reference answers. It shows the first failing lesson, or the complete create → validate → verify/publish → browse → apply → review → venue → discovery sequence.
10. Open `/questions`, think out loud, then reveal each answer. Compare real GigLink behavior with the deliberately smaller simulation.

The functional checks also use different inputs from the selected scene. Your code can pass all checks while an intentionally invalid scenario stays in draft or correctly rejects an action. Each failed scene says where it stopped. The event board blocks rendering the exact venue if incorrect learner code returns it and flags a privacy failure; tests inspect the returned data as well.

**Reset this lesson** restores only that lesson's file. It keeps other files and invalidates dependent completion. The editor supports Tab indentation; Escape then Tab lets keyboard users move focus out of the editor. All six files are editable in every lesson.

Local work is saved after changes with a visible status. Saved progress means the current code passed the relevant checks. Results for stale runs are ignored. Browser storage errors are shown; corrupt saves are not overwritten merely by reading them. Files above 50,000 characters cannot be saved. Other browsers/devices generate separate credentials. Conflict downloads provide manual backups; automatic cross-tab merging and import are not implemented.

### Existing P1 work is retained

P2 reads `giglink-prep.workspace.v1` when no v2 save exists. It preserves the three original source strings, completion, selected lesson, and attempts, then appends the new TODO files with zero attempts. New changes save under `giglink-prep.workspace.v2`; the original v1 key is left intact as a backup. An existing v2 save takes priority. A corrupt v2 save produces a warning rather than silently loading older work.

Lessons 1–3 keep their original starter code and checks. P2 supplies additional `id`, `customerId`, and single `position` fields **before** calling your `createGig`. If your P1 implementation copied individual fields, extend it to retain the added fields too. The lesson 1 contract already explains `...details`; your code is preserved, not silently replaced.

## Verify P3

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

See [P2_1_VERIFICATION.md](P2_1_VERIFICATION.md) for guided/theme coverage and manual phone/browser checks. [P2_VERIFICATION.md](P2_VERIFICATION.md) and [P1_VERIFICATION.md](P1_VERIFICATION.md) remain historical reports. The new DOM interaction tests use jsdom and Vite's JSX loader; they launch no browser or preview server. Browser access was denied earlier in this session; no bypass was attempted. Native dialog focus trapping, visual layout, actual Sandpack loading, live OS appearance changes, and persistence across a real browser refresh remain **manually unverified**. The build retains its advisory warning for the deferred Sandpack chunk exceeding 500 kB before gzip.

See [P3_VERIFICATION.md](P3_VERIFICATION.md) for synchronization tests, the real MongoDB result, and the restart/Atlas/manual browser checklist. `npm test` needs no database and never reads `server/.env`; `test:mongo` explicitly loads it.

## Repository layout

```text
client/
  src/app/          Existing routes, app shell, overview, chapter, API status
  src/content/      Lesson explanations and pinned real source references
  src/features/lab/ Sandpack editor, sandbox runner, behavioral checks, scenes
  src/features/progress/ Local workspace, background sync, conflicts, save status
  src/features/questions/ Answer-reveal presentation practice
  src/features/guided/ Authored walkthrough data, navigation, and dialog
  src/features/theme/ Separate theme preference and shared palette tokens
  src/styles/       Mobile-first CSS
  test/             Authored-fixture behavior, runner, progress, report tests
  public/           Local favicon
  vercel.json       SPA fallback to index.html
server/
  src/app.js        Express health/progress routes and safe errors
  src/server.js     HTTP listener and graceful shutdown
  src/db.js         Private connection handling and retry
  src/models/      LearnerProgress document
  scripts/         Opt-in real MongoDB verification
  test/             HTTP contracts, validation, revision and database tests
shared/
  progress.mjs     Public bounded workspace contract; no secrets/configuration
```

The root npm workspace shares a single `package-lock.json`. Install with `npm ci` at the repository root. Both packages also expose their own build/start scripts for hosting.

## Deployment groundwork only

P3 adds no deployment infrastructure. `client/vercel.json` retains the P0 SPA rewrite needed for a direct chapter, lesson, replay, or question URL. The whole repository, including `shared/`, must remain available to both workspaces. Hosting configuration and release QA belong to P4.

Because the lockfile lives at the workspace root, an install from a subdirectory must retain the root workspace/lockfile context (for example, `cd .. && npm ci` as the Render build command). Do not use `npm ci` on an isolated copy of `server/` without a lockfile.

Follow [SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md) when the later phase is authorized. The next phase is **P4 — Not started.**
