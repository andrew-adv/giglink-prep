# P2 verification and handoff

## Preflight and scope

Started from clean `main` at P1 commit `1ecf50c76588c1f8ff1b1f4fb55797f0c8a9a417`. Read the product plan, deployment guide, P2 prompt, P1 verification report, and current code. Before P2 edits, all 16 P1 frontend tests, the API test, and the frontend build passed. Browser access was denied earlier in this conversation. That limitation was reported before continuing; no alternate browser automation was used.

The same project now contains six editable files. The original three starter files and their behavioral checks remain; `browse.js`, `apply.js`, and `review.js` extend their output. The root scripts, dependencies, health-only Express server, environment examples, and hosting configuration are unchanged. No P3 work is included.

## Automated coverage

Run `npm test` from the root: **31 frontend tests plus 1 API test**. The sandbox's cumulative check totals are **4, 12, 18, 24, 32, 42** for lessons 1–6.

| Requirement | Evidence |
| --- | --- |
| P1 remains functional | Original lesson 1–3 fail/pass, changed-input, validation, trust-boundary, connected scene, and runner tests still pass |
| Six genuine exercises | Each file's unfinished TODO fails; authored completed code passes behavioral checks. No source-string matching awards completion |
| Private browsing | Published-only cards; new/required/active talent states; Free always visible; no location or nested private notes; input venue preserved |
| Demo matching | Valid sets of 1–3, order independence and trimming; missing/duplicate/extra/mismatch rejected; malformed metadata and active duplicate applications rejected |
| Review | Owning customer only; pending state; matching gig/position/talent; positive slots; sequential capacity; counts scoped to this gig and role; unauthorized/full failures cannot mutate inputs |
| Subscription consequences | Paid acceptance sets requirement; Free/rejection preserves old flag without creating one; an active simulated subscription restores Paid discovery |
| Existing commitments | Accepted venue remains readable through My Applications without Paid discovery; pending/rejected/withdrawn views and other talent cannot reveal it |
| Shared replay | All six authored modules execute together; earlier title changes reach board and accepted view; each unfinished file is identified as the first failing lesson |
| Rendered output | The same DOM runner renders full acceptance, venue, and gate from actual fixture outputs; unsafe board data is flagged without rendering the exact venue |
| Save migration | A v1 fixture keeps all three exact source strings, completion, attempts, and selected lesson; new files append; v2 reload works; original v1 backup stays intact |
| Completion | Six-stage reports must be current and complete; a three-stage report cannot award full completion; edits invalidate dependent lessons |
| Existing backend | Health JSON, CORS, and JSON 404 test remains passing |

`npm run build` verifies the frontend compilation. Vite retains its advisory warning for the lazy-loaded Sandpack chunk over 500 kB before gzip. Test fixtures execute in isolated Node VM modules, and the DOM runner uses a small test DOM. These tests do not claim that a real browser loaded the remote Sandpack service or successfully refreshed its localStorage.

## How the flow stays connected

P2 supplies event identity, owner, and one position before calling the learner's `createGig`; it does not add those fields after learner execution. The learner's `validateGig` and `publishGig` produce the event used by `browseGigs`. The actual safe board card is passed into `applyForGig`. The resulting pending application and original host event go into `reviewApplication`. Its returned talent drives a second call to `browseGigs`, and its returned application drives `myApplications`.

The full replay route `/replay` uses the same saved files. It selects new talent, matching demos, an owning host, acceptance, and simulated backend proof. It reports the earliest failed behavioral stage and shows the executed scene trace. No reference solution is loaded by Run or Replay. Normal lessons also allow deliberately invalid scenarios; correct rejection can stop a scene while the broader checks pass. Parse errors stop bundling before the journey executes and are reported as code errors rather than a fictional passed stage.

## Backward-compatible storage

- Old key: `giglink-prep.workspace.v1`; new key: `giglink-prep.workspace.v2`.
- When v2 is absent, valid v1 work is copied into a v2-shaped in-memory workspace, with the three new TODO files and zero new attempt counts.
- P1 source strings, completed lesson IDs, attempts, and selected lesson are preserved exactly. The original key is never removed or rewritten by P2.
- Later changes save only to v2. Reading a corrupt newer save warns rather than silently reverting to an old save. Existing per-file size limits and storage errors remain.
- If old code manually listed event fields rather than copying all details, it may need to retain the newly supplied id/owner/position fields. This is a visible code task, not an automatic replacement or migration reset.

## Manual QA gaps and procedure

**Not verified in a real browser:** Sandpack loading/execution, visual desktop/phone layout, keyboard interaction, answer reveals, and persistence after a real page refresh. Prior automatic approval review rejected Chrome access with “Computer Use was not approved to use Google Chrome.” No permission bypass was attempted.

1. Run `npm ci`, then `npm run dev`; open `http://localhost:5173`. With an existing P1 browser profile, confirm the migration notice and retained code/completion. Do not clear site storage before this check. After making a change, refresh and confirm v2 work restores while the old v1 key remains.
2. At about 390 px width, check all six lesson links, Learn / Code / Result tabs, six editor file tabs, scenario controls, and scrolling within the result iframe. Verify the original three lessons and their 4/12/18 cumulative checks still work.
3. In lesson 4, first run the TODO and see failure. Type your solution (a worked example is available). Expect 24/24 checks. New talent sees Paid and Free; a required talent without subscription sees Free only; active subscription restores Paid. No exact venue should be visible on any board. Switch Zara/Kai.
4. In lesson 5, run the unfinished code, then implement the rules. Expect 32/32 checks. Try counts 1, 2, 3 and matching/missing/duplicate/extra/wrong demos. Only matching metadata should create a pending application. No real video selector or network upload should exist.
5. In lesson 6, run unfinished code, then implement both exports. Expect 42/42 checks. Obi or a talent reviewing must fail. Ada accepting a full role must fail; rejection can still work. Acceptance reveals the venue in My Applications, sets the requirement for a Paid gig, and leaves new discovery Free-only. Free acceptance must not create a requirement. Switch to active subscription and compare discovery again.
6. Open `/replay` and Run. Expect the executed create → check → verify/publish → browse → apply → accept → reveal → gate trace and an accepted Paid commitment alongside Free-only discovery. Edit an earlier file; the later output or first failing lesson must change. Fix it and rerun.
7. Confirm code, attempts, and 6/6 completion after refresh. Reset lesson 5: only `apply.js` should reset, lessons 1–4 stay checked, and later completion clears. Restore/recheck it. Navigate away during a run; stale results must not complete another lesson.
8. Open `/questions`. All 12 questions must invite a pause, hide answers initially, reveal short answers before deeper explanations, and link the named real files. Review the simulation differences, especially transactions and subscriptions.
9. Stop only the API: local work should remain. Disconnect the bundler: execution should show a start/timeout error and never invent success. Check storage failure messages and Escape then Tab keyboard exit from the editor.

## Real source evidence and limits

All teaching links are pinned to reviewed commit `9c98a93950454c6c8a7b491794ef29727edbf15c` of the original repository, read through GitHub only. The original checkout is untouched.

- [talentDiscovery.service.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/talent/talentDiscovery.service.js): accessFor, listGigs, getGig, and publicGig. Real board always redacts; permitted detail reads may reveal after acceptance. Mini board uses the same conservative always-redacted list rule.
- [application.service.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/applications/application.service.js): validateDemos, submitApplication, changeStatus, listApplicationsForTalent, applicationView. Mini uses a single position, fictional clip IDs, arrays, immutable returns, and no deadlines. Different clip IDs are a stated extra simulation rule.
- [Application.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/applications/Application.js) and [application.repository.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/applications/application.repository.js): real schema, active unique index, conditional pending update, session/transaction wrapper. Mini sequential capacity checks do not prove concurrency safety.
- [integration.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/app/integration.js) and [subscription-requirement.service.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/payments/services/subscription-requirement.service.js): real hook wiring and requirement update. The shown callback does not forward the application transaction into the User update; the questions do not claim those consequences are atomically committed together.
- [auth.middleware.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/auth/auth.middleware.js), [customer.router.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/customer/customer.router.js), [talent/routes.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/talent/routes.js), and [app.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/app/app.js): role/identity checks and API registrations used as evidence for presentation questions, not implemented in Prep.

No real payment, upload, identity, MongoDB, transactions, expiry clock, or cross-device sync is implemented. Fictional private data is available to learner code inside the sandbox; the exercise teaches safe response shaping rather than enforcing real-world secrecy. Checks are learning feedback, not tamper-proof grading. P3 is next and has not been started.
