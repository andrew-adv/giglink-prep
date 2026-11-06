# P4 — Deployment readiness and release QA

Started on clean `main` at `71c2177e19bcd92deae0530db2b406b02e036dca`. Read the build prompts, setup/product plans, P3 report and Sandpack hotfix report before editing. All work is in GigLink Prep. The original GigLink repository is untouched. **No Vercel/Render resource was created, no dashboard setting was changed, and no deployment was performed.**

## Readiness changes

- Corrected [SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md) and [README.md](README.md): Render repository root (blank field), root `npm ci`, `npm run start --workspace=server`, `/api/health`; Vercel `client`, Vite, `npm run build`, `dist`, outside-root source enabled. Both applications import root `shared/progress.mjs`.
- Client Node engines/lock metadata now select `>=22.12.0 <23`, matching Node 22.x in Vercel. Render instructions use `NODE_VERSION=22`; `PORT` remains supplied by Render.
- One API URL helper is used by health and progress synchronization. Development keeps its localhost fallback. Production builds require an explicit HTTPS API URL ending in `/api`, with no credentials/query/fragment or loopback target; invalid configuration fails before producing release assets.
- Backend production CORS accepts only the exact configured HTTPS origin. Missing/wildcard/non-origin values fail startup before database connection begins. Development additionally permits localhost/127.0.0.1 on ports 5173/4173. No permissive preview-domain match was added.
- Preserved the SPA rewrite, Sandpack Babel 7 marker, all six lesson contracts/checks/scenes, guides, themes, CTO content, local storage/migration format, revision/conflict logic and database model.

## Verification evidence

| Check | Result and scope |
| --- | --- |
| Complete frontend suite | **66 passed**: existing learning/P3/Sandpack compiler regressions plus production API URL and SPA mapping cases |
| API suite | **10 passed**: health, CORS/preflight, credential/payload validation/limits, isolation, revisions, sanitized outages, DB retry/close, real production-mode Node startup |
| Vercel layout | **Production build passed from `client/`** with the whole checkout retained, importing shared code. A public, non-routable `https://giglink-prep-api.example/api` test value was used; it is not a deployment address |
| npm workspace layout | `npm ci --dry-run --ignore-scripts --offline` passed from repository root and from `client/`; no dependency version was changed |
| Render layout / PORT | A real Node API process booted from repository root with a supplied ephemeral `PORT`, production `CLIENT_ORIGIN`, and no DB URI. Shared imports resolved; health returned `not-configured`; progress safely returned 503 |
| Real Atlas | Existing opt-in `npm run test:mongo --workspace=server` passed create/read/update, anonymous isolation, concurrent revision conflict, and HTTP/database reconnection readback; its temporary document was deleted |
| Full API process restart | A separate live check launched the actual `server/src/server.js` in production mode, saved a temporary six-file workspace to Atlas, terminated the Node process, started a new one, and read back the exact workspace/revision/timestamps over HTTP. Production CORS and supplied ports worked; only its temporary document was removed afterward |
| Secret checks | All-branch tracked text history checked for credential URI/private-key/common API-key patterns and the actual configured private URI; no match. No non-example `.env` path found in tracked history. Built frontend checked for the same patterns/URI; no match. Public test API URL was present as expected |
| SPA deep links | Retained routing configuration maps `/lessons/1`, `/lessons/6`, `/replay`, `/questions`, `/chapters/1` to `/index.html`. Actual Vercel edge responses remain manual |
| Whitespace / staged files | `git diff --check` and final staged-file/secret review before commit |

The production build retains the existing >500 kB advisory for deferred Sandpack. Compiler regressions use the actual bundled Babel versions, reproduce the old `(38:19)` failure, then compile/execute authored fixtures with Babel 7: unfinished L1 fails normally; correct L1/L2/L3 pass 4/4, 12/12, 18/18, and full replay passes 42/42. These are Node compiler/DOM checks, not remote browser execution.

## Browser QA status

**Unverified after the hotfix and for hosted production.** The user reported the pre-fix Sandpack error in a real browser; no successful post-fix browser smoke test has been supplied. Earlier automatic approval review rejected Chrome: “Computer Use was not approved to use Google Chrome.” No browser automation, alternative browser route or permission bypass was used.

The tests verify logic, production configuration, local HTTP processes and real Atlas persistence. They cannot establish real Sandpack worker loading, native focus behavior, rendered mobile layout, or Vercel/Render edge behavior. No real production service URLs were provided, so release remains gated on the user-managed setup and checklist below.

## Manual release checklist — laptop AND phone

Use a fresh QA browser profile for deliberate failures and separate checks against an existing P1/P2 profile for preservation. Do not clear real learner storage. Use fictional details only. Keep Authorization headers and private settings out of screenshots. Fill this record for the candidate release:

| Record | Value |
| --- | --- |
| Release commit SHA | To be recorded from GitHub |
| Actual frontend origin / API base | To be recorded after dashboard setup |
| Laptop browser/version / OS | To be recorded |
| Phone browser/version / OS / width | To be recorded; check about 320 and 390 px too |
| Tester / date / failures | To be recorded; leave release blocked on unresolved failures |

Run the following on both devices unless marked laptop-only:

- [ ] **Dashboard gate:** Apply the exact [Render, Vercel and Atlas settings](SETUP_AND_DEPLOYMENT.md). Confirm both real HTTPS URLs, user-managed DB secret, Render's outbound CIDRs, Node 22.x and the outside-root Vercel setting. Do not release with test/example addresses. Check health is API `ok` and DB `connected`; HTTP 200 with DB `unavailable` is insufficient.
- [ ] **Direct route refresh:** Type the real frontend URL with `/lessons/1`, `/replay`, `/questions` and `/chapters/1`. Hard refresh each. Expect the correct screen, loaded assets and no hosting 404.
- [ ] **Start and fail:** From Overview enter chapter 1 and Open coding lab. With unfinished L1 code press Run / Check. Expect clear behavioral FAIL feedback, not a compiler error or invented success. The hidden package should select Babel 7.
- [ ] **Fix L1:** Use your own solution or the worked example. Expect **4/4** and an event card from the returned object. Change the returned title; the card must change and relevant checks may fail. Restore correct code. Confirm files carry forward.
- [ ] **L2 and L3:** Complete validation (**12/12**), then publishing (**18/18**). Blank title/low pay must be rejected. Browser-only payment claim must stay draft; simulated backend verification can publish. Earlier source remains editable and affects later output.
- [ ] **L4:** Complete browsing (**24/24** cumulative checks). Compare New / Required / Active subscription. Board responses hide the exact venue; Free stays available. Later behavior uses the same created gig.
- [ ] **L5:** Complete applications (**32/32**). Try one, two and three samples. Missing, duplicated, extra or mismatched fictional demos must fail; exact matches create pending applications. No real upload occurs.
- [ ] **L6:** Complete review (**42/42**). Wrong owner and full roles must fail acceptance. Accepted talent sees their venue through My Applications; pending/rejected views hide it. First Paid acceptance gates new Paid discovery while Free and existing accepted commitments remain accessible.
- [ ] **Replay:** Run `/replay` with your six authored files. Expect **42/42** and the full connected flow. Break an earlier function: expect the first failing stage and changed actual output. Restore it and rerun successfully.
- [ ] **Guides and CTO prep:** Open all six Show me how dialogs. Next/Back changes active lines and visual state; choices, Replay, Close, Escape and focus return work. Opening/advancing them must not edit code, increment attempts or award completion. Open `/questions`; all 12 cards reveal short/deeper answers and working real-source links.
- [ ] **Themes and mobile:** Switch Dark/Light/System, change OS appearance in System, then refresh. Header, editor, running preview, guides, questions and replay follow the selection. Check keyboard focus, native dialog focus trapping, reduced motion, reachable phone controls and code wrapping without page overflow. Theme/guide interactions cause no progress PUT after reconciliation.
- [ ] **Refresh preservation:** Record all six files, completion, attempts and selected lesson. Wait for **Saved on this device and server**, refresh, and compare. Repeat with an existing P1/P2 save; migration preserves the old files/backup. A new phone/browser/origin has a separate anonymous token and should not magically receive another device's work.
- [ ] **Full backend restart (laptop):** Save a fictional marker, verify it/revision in Atlas `giglink_prep.learnerprogresses`, then manually restart the Render service. Refresh and inspect the progress GET response without sharing its Authorization header. The marker and progress must remain. Confirm a later edit increments the revision in Atlas.
- [ ] **Backend sleep / outage:** Make only the API unavailable while keeping the frontend/bundler available (local API stop or a browser network block for the API domain). Continue editing; expect device saving / waiting status. Refresh during the outage to verify local recovery. Restore the API and use Try sync now or wait for retry. No server-saved claim should appear before confirmation. Global offline mode also blocks Sandpack startup; it must show a useful error, not fake execution.
- [ ] **Revision conflict (two laptop tabs):** Open both at the same confirmed revision. Save distinct edits in A, then B. B must preserve its work and show a choice. Download both copies. Test Keep device, then repeat with Load server. The chosen source must reach the editor; both earlier copies remain downloadable. Recovery must not silently replace newer device code with a stale server snapshot.
- [ ] **CORS and privacy:** Production requests succeed only from the configured frontend origin. Other preview/subdomain/localhost origins are blocked in production. Check public bundles and Vercel variables contain no DB URI/credential; logs/errors do not expose the learner token. Keep token private: anyone holding it can access that saved work.

## Stop conditions and limits

This phase ends with configuration/tests/checklists and a normal Git push. The user initiates hosting changes only after real URLs/secrets are ready and signs off actual browser/phone QA. No new infrastructure automation, accounts/auth provider, analytics, payments, real uploads or paid AI service was added. There is no automatic code merge, account recovery, cross-origin/device login, or complete backup history. Recovery keeps the latest conflict pair. No further phase has started.
