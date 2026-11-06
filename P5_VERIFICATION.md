# P5 — Project Story & Presentation verification

## Scope

P5 adds public `/presentation` and `/presentation/practice` to GigLink Prep. Work began from clean `main` at `2cee6c0e234bf2dfff9ca934476f72b0c6cb3f4a`. The original GigLink repository was researched read-only. No backend, database schema, lesson contract, grading rule, sandbox compiler, guided example, theme storage or sync mechanism was changed.

## Delivered

- Ten selectable chapters: problem/idea; team; MVP; architecture; timeline; integration; achievements; refinements; current version/limits; lessons/conclusion.
- Global navigation plus home, chapter and CTO-area entry links. Direct chapter links use `/presentation?chapter=6` and survive route reload selection.
- Four-workstream diagram, five-step request visualization, twelve evidence milestones, ten-stage product journey and ten before/change/reason/result comparisons. Mobile selectors and manual Previous/Next use the same state as desktop choices.
- Each chapter includes revision summary, a question, hidden short answer and optional deeper explanation, plus pinned original source links.
- Quick, standard and full practice outlines; natural speaking suggestions, reminders, follow-up questions/responses and source references. A local timer pauses/resumes/resets without advancing sections. Copy with selection fallback and print-only speaker notes.
- Source registry, dated branch snapshot and single personal-details configuration. Instructor-provided C00 is user-reported; Captain C00 is a documented assignment. No student identities inferred from Git authors.
- Presentation content is bundled static content and needs no API or MongoDB connection. It does not load Sandpack or touch learner progress.

## Automated checks

Baseline before P5 changes: **66 frontend / 10 API tests passed**.

Final `npm test`: **82 frontend tests passed, 10 API tests passed; 0 failures**. `npm test` uses Node/VM, Vite and jsdom, not a real browser. Original GigLink test source was inspected, not run. Two initial new DOM assertions were corrected to use React Router’s resolved link and the nested details element; the final complete run passed.

Final production build: **passed**, 134 modules transformed. The presentation is lazy-loaded (about 67.5 kB / 22.2 kB gzip JavaScript, 7.6 kB / 2.0 kB gzip CSS); opening it does not load the coding editor. The existing deferred Sandpack chunk warning above 500 kB remains advisory.

`git diff --cached --check` passed. The staged file list contains exactly the fifteen P5 files below, with no server/shared/environment changes. Secret-pattern checks of staged content and checks for configured private values in the generated frontend JavaScript passed without printing those values. `main` and `origin/main` matched before the normal commit/push; no force-push or deployment was used.

New checks cover content completeness, exact role/branch mapping, chronological SHA-linked evidence, separate unconfirmed details, source registry consistency, speaking word ranges, clock arithmetic, public routes/deep-link rewrites, chapter and explorer navigation, answer reveals, authored rule choices, all practice lengths, timer control, clipboard success/fallback and printable text. Progress-isolation checks compare workspace/sync bytes and request methods after reconciliation. Theme/guide/lesson/replay/sync/API regressions remain in the complete existing suite.

Production build uses a reserved public-format test value, `VITE_API_BASE_URL=https://giglink-prep-api.example/api`, to satisfy the existing production configuration guard. This is **not a deployed API address**. The first restricted build could not read ancestor directories; the same command was rerun with approved escalation. No browser restriction was bypassed.

## Manual QA — laptop and phone

**Real-browser QA remains unverified.** Browser access was denied earlier; no browser, alternate browser or automation bypass was used in P5. jsdom does not measure pixels, perform real print/clipboard operations or load a live Sandpack iframe.

Use `npm ci` and `npm run dev` from the root. Open the displayed local frontend address; the public story works with the API stopped or MongoDB absent. Use the real configured API only when separately checking synchronization. Do not share learner tokens or provider/database credentials.

- [ ] From global navigation, homepage, chapter overview and CTO practice, open The GigLink Story. Verify both public routes work without completing a lesson. On the configured Vercel site, refresh both routes and `/presentation?chapter=6`; no hosting 404.
- [ ] Read all ten chapters on laptop and a 320–390px-wide phone. Use chapter list/select, Next/Previous and browser Back. Next should bring the chapter heading into view. Text, long source paths, dropdowns and buttons stay inside the viewport. Keyboard focus stays visible.
- [ ] Select all four workstreams. Confirm the selected card, branch, responsibility, dependency and source agree. C00 attribution is labelled accurately. Unknown personal facts are all To confirm.
- [ ] Advance the architecture request: browser → authorization → Paystack verification → database → response. Analogy, explanation, selected step and state badge change together. This is a labelled explanation, not a live original-server request.
- [ ] Browse the twelve timeline milestones and related commit links. Confirm dates are ordered and latest/main snapshot notes are visible. Open original GitHub sources and significant commits.
- [ ] Change Free/Paid and first-Paid-acceptance choices. Posting fee changes, Free remains available, Paid discovery requires a pass after the first Paid acceptance. Advance the full product diagram to venue reveal and subscription gating.
- [ ] Inspect every before/after comparison, chapter revision and question’s short/deeper answer. Check that authored tests, executed checks and live-demo gaps are clearly distinguished.
- [ ] Switch Quick/Standard/Full practice. Advance/back and jump among speaking sections. Mode changes reset rehearsal. Start/pause/resume/reset timer, leave it running briefly, and verify no automatic section changes. Rehearse at a comfortable pace; length labels are approximate.
- [ ] Copy speaker notes with clipboard permission allowed, then test denied/unavailable clipboard and use the selection fallback. Paste into a blank document; only authored presentation notes should appear. Print preview should contain the selected outline, with no sync panel, token, learner work, global navigation or timer controls.
- [ ] Switch Dark/Light/System, then change OS preference in System. Check all diagrams, selected states, sources, dropdowns, notes and focus. Enable reduced motion; nothing should depend on animation.
- [ ] Record saved code/completions/attempts and remote revision. Explore/rehearse, change theme, refresh and return to the lab. Code and progress must be unchanged; presentation interactions alone cause no progress PUT. A previously saved workspace must survive. Refresh restores a chapter URL, but deliberately does not save rehearsal timer/section.
- [ ] Regression smoke: all six guides; unfinished Lesson 1 behavioral failure; correct L1/L2/L3 at 4/12/18 checks; six-stage replay at 42; edited title affects actual output; `/questions` still has twelve cards; editor/preview follow theme. This remains a real-browser Sandpack check, not established by the production build.

## Known limits

No personal identities/proposal history/approval result are established. Original live deployment, provider transactions/uploads and concurrency/load behavior were not tested in P5. The story is pinned to the reviewed commit and needs a fresh evidence review when the original project changes. Timer uses the device clock, does not record audio and is intentionally not persisted. Browser clipboard/print support varies; copyable notes remain available. Hosting and MongoDB behavior retain P4/P3 configuration and earlier reports; no deployment was performed.

## Files changed

- `README.md`: public routes, content maintenance and evidence guidance.
- `P5_SOURCE_REVIEW.md`: research record and evidence boundaries.
- `P5_VERIFICATION.md`: checks, results and manual QA.
- `client/src/app/App.jsx`: lazy public routes and global/home/chapter entry points.
- `client/src/content/presentation/evidence.js`: snapshot, source registry, roles, milestones and diagram data.
- `client/src/content/presentation/personal-details.js`: unconfirmed personal facts and user-reported foundation distinction.
- `client/src/content/presentation/story.js`: ten chapters with revision and layered questions.
- `client/src/content/presentation/practice.js`: three speaking outlines, notes and timing helpers.
- `client/src/features/presentation/PresentationPage.jsx`: chapter explorers and practice controls.
- `client/src/features/presentation/presentation.css`: responsive theme-token styling and print notes.
- `client/src/features/questions/QuestionsPage.jsx`: story/practice entry links; existing twelve cards retained.
- `client/src/styles/global.css`: entry cards and wrapping, accessible global navigation links.
- `client/test/presentation.test.js`: eight content/timing/style checks.
- `client/test/ui.test.js`: eight presentation DOM interaction/isolation checks added to existing regressions.
- `client/test/deployment.test.js`: existing SPA rewrite check extended to both presentation routes.
