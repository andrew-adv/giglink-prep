# GigLink Prep — P4 setup and release checklist

Work only with `andrew-adv/giglink-prep`. Keep the original GigLink repository and database separate. P4 prepares a release; it does not deploy, create hosting resources, or supply secrets. The user manages the Render, Vercel and Atlas dashboards.

## 1. Record the real addresses before releasing

| Item | Record privately/from your dashboard |
| --- | --- |
| Git branch | `main`, at the reviewed release commit |
| Frontend origin | Your actual Vercel/custom HTTPS origin, with no path or trailing slash |
| API base URL | Your actual Render HTTPS address followed by `/api` |
| Database URI | Your private Atlas Node driver URI; never put it in this table, chat or Git |

Do not release with example domains or localhost values. Obtain/confirm both hosting addresses in your projects' dashboards first; if they are not available, stop at configuration preparation. Keep automatic deployments disabled during preparation. Changing Vercel environment variables requires a new build; changing Render variables requires a restart/deploy that you initiate.

## 2. Understand the two roots

```text
giglink-prep/
  package.json          npm workspaces
  package-lock.json     shared installation lockfile
  shared/progress.mjs   imported by BOTH applications
  client/               Vite frontend
  server/               Express backend
```

**Render must retain the repository root.** Files outside a Render Root Directory are unavailable at build and runtime, so setting it to `server` would remove `shared/`. [Render monorepo documentation](https://render.com/docs/monorepo-support).

**Vercel uses `client` with outside-root source enabled.** This makes the root shared module and workspace context available while building the frontend. [Vercel monorepo documentation](https://vercel.com/docs/monorepos/monorepo-faq).

## 3. Atlas dashboard — database and network access

1. Select/create a separate `giglink-prep` Atlas project and cluster. Choose a suitable free option yourself; this application creates no paid resources.
2. Under **Security → Database & Network Access → Database Users** (or **Database Access**), create a separate database user with read/write access to **`giglink_prep`**. Keep its password private. Atlas account login and database user credentials are different.
3. Use **Connect → Drivers → Node.js** to obtain the driver URI. URL-encode reserved characters in the database password. The API explicitly selects `giglink_prep`, even if the URI names another database. The collection is `learnerprogresses`.
4. For local checks, add your current public IP under **Network Access / IP Access List → Add IP Address**.
5. For Render, open the backend service's **Connect → Outbound** tab. Copy **every CIDR range** shown and add each one to Atlas's IP access list, with a Prep/Render label. Use the selected service's current ranges; it may connect from any address in them. [Render outbound IP instructions](https://render.com/docs/outbound-ip-addresses).
6. Wait for entries to become active. These are Render's outbound ranges, not its inbound website address or Vercel addresses. Do not use `0.0.0.0/0` as the default setup. If the service/region changes, review the list again. [Atlas access-list instructions](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

## 4. Render dashboard — backend web service

Choose **New → Web Service**, repository **andrew-adv/giglink-prep**, or update the existing Prep service. Enter:

| Dashboard field | Value |
| --- | --- |
| Name | `giglink-prep-api` or your chosen unique name |
| Branch | `main` |
| Runtime / Language | Node |
| **Root Directory** | **Leave blank: repository root** |
| **Build Command** | **`npm ci`** |
| **Start Command** | **`npm run start --workspace=server`** |
| **Health Check Path** | **`/api/health`** |
| Auto-Deploy | Off/manual until URLs, secrets and QA are ready |

Set these environment variables in Render only:

| Variable | Value |
| --- | --- |
| `NODE_VERSION` | `22` (latest available patch of Node 22; must be at least 22.12) |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your private Atlas driver URI |
| `CLIENT_ORIGIN` | Your exact frontend HTTPS origin, e.g. the actual value from Vercel Domains; **no trailing slash or path** |
| `PORT` | **Do not set it. Render supplies it.** |

Render supports the `NODE_VERSION` override. [Node version documentation](https://render.com/docs/node-version). The start command switches to the server workspace; its imports can still access root `shared/`. The server binds to `0.0.0.0` and uses `process.env.PORT`. Production startup rejects a missing, wildcard or malformed `CLIENT_ORIGIN` rather than choosing a development origin.

After you initiate a configured deployment, open the actual Render URL plus `/api/health`. A healthy database response is:

```json
{"status":"ok","service":"giglink-prep-api","phase":"P3","database":"connected"}
```

`phase: "P3"` identifies the existing persistence API; P4 does not change its contract. HTTP 200 means the API process is alive. `database: "unavailable"` or `"not-configured"` is **not ready for server saving**, even though local learning still works. Progress reads/writes return 503 until the database is usable. Health exposes no URI, credentials or host details.

## 5. Vercel dashboard — frontend

Import/select the **giglink-prep** project and enter:

| Dashboard field | Value |
| --- | --- |
| Production Branch | `main` |
| Framework Preset | **Vite** |
| **Root Directory** | **`client`** |
| **Include source files outside of the Root Directory in the Build Step** | **Enabled** |
| Install Command | `npm ci` (keep the whole npm workspace and root lockfile available) |
| **Build Command** | **`npm run build`** |
| **Output Directory** | **`dist`** |
| Node.js Version | **22.x**, latest patch, at least 22.12 |
| Production environment variable | `VITE_API_BASE_URL` = your **actual HTTPS Render address ending in `/api`** |

The client package also declares Node `>=22.12.0 <23` so the build stays on Node 22 rather than drifting to a newer default. [Vercel Node version settings](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Do not add `MONGODB_URI`, database passwords or learner tokens to Vercel. Every `VITE_` variable is public. The build rejects a missing, insecure, credential-bearing or incorrectly shaped API URL. Preview environments need their own correct API URL, and their exact origin must be the configured backend origin; arbitrary preview domains are not automatically allowed.

Keep `client/vercel.json` unchanged:

```json
{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

After your manual deployment, directly open and refresh `/lessons/1`, `/replay`, `/questions` and `/chapters/1`. Each must return the app instead of a hosting 404. The retained rewrite is checked locally; actual Vercel edge behavior remains a manual release check.

## 6. Local development and release commands

Use Node 22.12+ within Node 22 and npm. From repository root:

```powershell
npm ci
if (!(Test-Path -LiteralPath server/.env)) { Copy-Item server/.env.example server/.env }
if (!(Test-Path -LiteralPath client/.env.local)) { Copy-Item client/.env.example client/.env.local }
npm run dev
```

Local defaults are frontend `http://localhost:5173` and API `http://localhost:5000/api`. Put your Atlas URI only in ignored `server/.env` if checking real persistence. With `NODE_ENV=development`, CORS accepts the configured origin plus localhost/127.0.0.1 on ports 5173 and 4173. With `NODE_ENV=production`, only the configured exact origin is allowed. No wildcard/subdomain matching is used. CORS is a browser permission check; the secret bearer credential still protects progress requests.

Run tests, then build with your actual public API address (replace the example before using it for a release):

```powershell
npm test
$env:VITE_API_BASE_URL = 'https://YOUR-ACTUAL-RENDER-HOST/api'
npm run build
npm run test:mongo --workspace=server
```

`test:mongo` uses private `server/.env`, writes only its temporary random learner record, checks persistence/revisions/isolation, and removes that record. It prints no credential. `npm run build` from **inside `client/`** is the equivalent Vercel build command. Do not copy only a subdirectory to either host. No hosting CLI invocation is required or performed here.

## 7. Release QA and recovery

Complete [P4_VERIFICATION.md](P4_VERIFICATION.md) on a laptop and phone before marking a release ready. It covers all six lessons, guides, themes, CTO questions, replay, refresh, real API restart, backend sleep, offline changes and explicit conflict resolution.

If the backend sleeps or is unreachable, the UI keeps local work and shows **Saved on this device / Waiting to sync**. It retries after 30 seconds, an online event, or **Try sync now**. It never claims a new server save before confirmation. Do not reset browser storage to fix a cold start.

| Symptom | Check |
| --- | --- |
| Render cannot import `shared/progress.mjs` | Root Directory must be blank; reinstall from the whole root workspace |
| Vercel cannot import shared code | Enable outside-root source; retain root lockfile/workspaces |
| Production build fails with `VITE_API_BASE_URL` | Set the actual HTTPS API address ending in `/api`, then rebuild |
| Progress stays waiting while health responds | Check `database`, Atlas user's database permission and every Render outbound CIDR |
| Browser CORS error | Compare `window.location.origin` with exact Render `CLIENT_ORIGIN`; no slash/path; production blocks localhost and other preview origins |
| Deep-link refresh 404 | Check the Vercel root/output settings and retained SPA rewrite |
| Compiler error in hidden `/index.js` | Refresh/reopen the coding lab; preserve the Babel 7 marker in the hidden sandbox package; see [hotfix report](P2_1_1_VERIFICATION.md) |
| Two progress versions | Download both, then choose Keep device or Load server; no automatic code merge |

Never put real personal data in exercises. Anyone holding a learner token can access that learner's work. Do not log/share request Authorization headers. Clearing site storage loses that token and access to its anonymous server save.
