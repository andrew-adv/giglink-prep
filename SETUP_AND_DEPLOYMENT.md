# GigLink Prep — Setup and deployment checklist

Services: **GitHub repo** `giglink-prep` → **Vercel** React site (`client/`) + **Render** Express API (`server/`) → **MongoDB Atlas** Free cluster. Vercel *can* also host Express backend, but we deliberately use Render for consistency with GigLink. Nothing gets deployed into the existing GigLink project.

## A. Create the repository first
1. Open https://github.com/new, select your GitHub owner, name it `giglink-prep`, choose Private or Public, check **Add README** and **Create repository**.
2. In VS Code, clone **this new repo** into its own folder (not inside or on top of `giglink`). Example: `git clone https://github.com/andrew-adv/giglink-prep.git` then `cd giglink-prep` and `code .` (adjust the owner if needed).
3. Download/copy `PRODUCT_PLAN.md`, `CODEX_BUILD_PROMPTS.md`, and this file to repository root.
4. Open Codex in the NEW VS Code workspace. Give it standing instructions and **P0 only** from `CODEX_BUILD_PROMPTS.md`. Let Codex handle project files and run local checks.
5. After P0 passes, follow P1, P2, P3, P4 in order. First run and verify P1 locally before spending time on cloud services.

## B. Local requirements
- Node.js 20 or newer (prefer current LTS), npm, Git, VS Code + Codex.
- Run `npm install` as directed by generated README (monorepo root or separate client/server installs; Codex must document exact commands).
- Run client on `http://localhost:5173` and API on `http://localhost:5000` unless ports are occupied.
- Start backend without secrets for P0/P1; P3 introduces Atlas connection.

## C. MongoDB Atlas — do after playable P1/P2
1. Open https://cloud.mongodb.com/ and sign in; create a **new project** named `giglink-prep` (not the production GigLink database).
2. Create **Free/M0** cluster in a supported region.
3. **Database Access:** create a database user for this project, give it read/write to the application database if possible. Use a long distinct password, store it privately.
4. **Network Access:** allow your current development IP for local testing; Render's outbound IP range may need explicit allowance. For a short demo, `0.0.0.0/0` is an expedient but less secure fallback **only** if absolutely necessary; use a strong unique DB password and narrow the rule later. Do not confuse Atlas login credentials with the separate database user's password.
5. On the cluster choose Connect → Drivers → Node.js; copy the `mongodb+srv://...` string. Substitute *your* DB username/password (URL-encode reserved special characters) and the database name `giglink_prep`.
6. Place it in **local `server/.env` only** (never commit):
```
MONGODB_URI=mongodb+srv://<db_user>:<password>@<host>/giglink_prep?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
NODE_ENV=development
```
7. Follow Codex P3 setup and check the API health endpoint / progress save + reload. Keep the real GigLink database completely separate.

## D. Render backend — after P3 works locally
1. Open https://dashboard.render.com, **New → Web Service**, connect GitHub and choose `giglink-prep`.
2. Service name: `giglink-prep-api`. Branch: `main`. Language: Node. **Root directory:** `server` (assuming Codex follows blueprint).
3. Build command: `npm install` or `npm ci` if lockfile exists. Start command: `npm start` (ensure `server/package.json` defines start). Choose Free if available and acceptable.
4. Environment variables in Render service dashboard:
```
MONGODB_URI=(your Atlas connection string)
CLIENT_ORIGIN=https://<your-vercel-project>.vercel.app
NODE_ENV=production
```
**Do not set `PORT` manually on Render unless needed**; Node server should listen on `process.env.PORT || 5000` and bind `0.0.0.0`.
5. Use health check path `/api/health`. Once deployed copy the real backend URL, e.g. `https://giglink-prep-api.onrender.com`. Verify it responds and reads/writes Atlas.
6. Note: Render Free web services sleep after ~15 minutes idle and may need about a minute to wake. The UI must say “Saved on this device, reconnecting” rather than losing work.

## E. Vercel frontend
1. Open https://vercel.com/new, import `giglink-prep` from GitHub.
2. Framework: Vite. **Root directory:** `client`.
3. Build command: `npm run build` (Vercel normally detects this). Output directory: `dist`.
4. Set Vercel environment variable:
```
VITE_API_BASE_URL=https://<actual-render-service>.onrender.com/api
```
5. Deploy. Copy the resulting `https://<your-project>.vercel.app` URL.
6. Return to Render and update `CLIENT_ORIGIN` with this exact Vercel URL; redeploy/restart backend if necessary. Any Vercel preview URL with a new hostname won't be allowed until added explicitly (avoid broad wildcards in MVP).
7. Confirm `client/vercel.json` has SPA rewrite so refreshing `/lesson/2` loads the app, not 404.

## F. Deployment test: must pass
- Open Vercel URL on phone; open a lesson; type code; press Run; wrong code clearly fails; correct code passes and updates the mini app.
- Advance to next lesson: previous code is still there and used by the new lesson.
- Refresh: code and progress are still present.
- Open backend `/api/health`: API works; check Atlas has progress document.
- Disconnect network temporarily: local work remains, clear offline status is displayed, no silent overwrite on reconnect.
- Tap a real GigLink source link and verify it targets the actual file.
- Check there are no secrets in commits or browser/network code bundles.
- Run core unit tests and frontend build; check small-screen UI and keyboard behavior.

## G. Environment ownership chart
| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Vercel and `client/.env.local` | Frontend API base, **public** |
| `MONGODB_URI` | Render and `server/.env` | Private DB credentials, **never VITE_** |
| `CLIENT_ORIGIN` | Render and `server/.env` | Frontend address allowed by CORS |
| `PORT` | Local server, Render supplies it | Server listening port |
| `NODE_ENV` | Render/local | Runtime mode |

## H. Problems and quick fixes
- **Frontend displays but save fails:** check VITE_API_BASE_URL has `/api`, CORS `CLIENT_ORIGIN` exactly matches Vercel URL, Render service is awake and its logs show no MongoDB error.
- **MongoDB timeout:** check connection string, database user, Atlas Network Access rules; do not paste secrets into ChatGPT.
- **Deep-link refresh 404:** confirm Vercel SPA rewrite in `client/vercel.json` and redeploy.
- **First request slow:** likely Render Free cold start; local code/progress should still be usable.
- **Editor works but chapter always passes:** reject; ask Codex to fix behavioral testing, not mark success by static substring or button clicks.

## I. Basic safety even for a personal prototype
No real credentials in the code workspace, GitHub, screenshots or chat. Never execute typed code on the Express host. Use sandboxed browser preview. Store no identity data. Restrict payload size so public API isn't trivial to overload. These are small guardrails, not a production-hardening project.
