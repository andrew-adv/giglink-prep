# P2.1 — Guided learning and themes

Started from clean `main` at `ab6fe1baac9af6dc7d9ef947c34bb25605e0c192`. Read `PRODUCT_PLAN.md`, `P2_VERIFICATION.md`, the setup guide, and the current implementation. Changes are confined to GigLink Prep. The original GigLink repository, backend, workspace schema, business rules, six graded exercises, question content, and source links remain unchanged. No P3 work is included.

## Implementation

- All six lessons have **Show me how**, before the coding task and worked example. One data-driven dialog renders authored examples, highlighted lines, a changing visual state, and short explanations. Native dialog behavior handles modal focus, with explicit initial focus, Escape/Close handling, scroll restoration, and focus return. At narrow widths the dialog fills the viewport.
- L1 starts with an event card and explains strings, fields, objects, braces, commas, function inputs, and return. L2–L6 build on the same fictional Friday music night story. There are 14 authored branches across the guides, including missing titles, absent payment proof, discovery gates, repeated song labels, wrong owners, full roles, and rejection.
- Guided examples are deliberately smaller than the coding contracts. Every guide exposes its scope and the existing real GigLink source reference. The authored JavaScript is displayed as text; the main app does not evaluate it. Temporary guide state has no workspace or storage action.
- `LabPage.jsx` is now the lightweight explanation/guide entry. `CodingLab.jsx` contains the existing Sandpack workspace and is imported only after **Open coding lab** / **Open replay lab**. That boundary is required so guides work without loading Sandpack, not a replacement of the normal execution system.
- One shared palette module supplies React CSS tokens, the Sandpack editor theme, and the independent preview HTML. Dark uses the requested page/panel/text/mint/blue references; Light retains the existing visual direction. System listens to OS appearance changes. The theme preference is stored only at `giglink-prep.theme.v1`.
- Preview appearance changes use an origin/source-checked theme message that only updates the preview document's theme attribute. It does not run code again or post completion. The run config also carries the current appearance so a newly loaded preview starts correctly. The host resends the latest appearance after a run result to cover a theme change during bundler startup.

## Automated verification

`npm test`: **42 frontend tests plus 1 API test**.

Existing P1/P2 behavior, six-file replay, privacy, sample matching, ownership, slots, subscriptions, migration, save/restore, and report validation remain covered by the original tests.

New checks cover:

| Area | Evidence |
| --- | --- |
| Authored examples | All 14 branches execute only as repository-authored Node fixtures; their final visual data matches their actual example output |
| Navigation | Next/Back bounds, Replay, Close, branch selection, and synchronized active-line/explanation/visual definitions |
| Actual React handlers | Each of six lesson routes opens, advances through every step, goes back, replays, closes, and handles cancellation in jsdom |
| Isolation | Those interactions run against both P1 and P2 saved fixtures; the exact stored code/progress bytes and storage key count remain unchanged |
| Sandpack independence | No iframe is created during guided use and the deferred coding module is not evaluated |
| Preferences | Dark default, saved Light/Dark/System, invalid/blocked storage, live simulated OS changes, explicit override, and preference restoration on remount |
| Separate persistence | Theme changes leave both workspace keys unchanged; workspace migration format is untouched |
| Editor/preview | Shared palette values, independent themed HTML, trusted theme messages, and a DOM-runner theme update that leaves the test report unchanged |
| Contrast | Primary/secondary text, button text, and feedback token pairs meet at least 4.5:1 contrast in both palettes |
| Routes | Replay entry and all 12 initially closed question cards render in both themes |

The DOM tests use jsdom plus the existing Vite JSX transform. They do not control Chrome, load remote Sandpack, render pixels, or start an HTTP preview server. A small dialog open/close shim supports test events; native focus trapping still needs browser QA. Node prints its existing experimental VM-module notice for authored-fixture tests.

`npm run build` compiles the frontend and separates the lightweight lesson/guide chunk from the larger deferred `CodingLab` chunk. The existing >500 kB advisory for Sandpack remains. No business rule was changed to satisfy UI tests. The install added jsdom as a development-only test dependency; it is not bundled into the app.

## Manual QA required — not verified in a browser

Earlier automatic approval review rejected Chrome access: “Computer Use was not approved to use Google Chrome.” No bypass was attempted. Visual QA, a real remote Sandpack run, actual OS preference changes, and real refresh persistence remain unverified.

1. Run `npm ci`, then `npm run dev`. In a new browser profile, verify Dark is the default even if the OS is light. Use the header to select Light, Dark, and System. In System, change the OS appearance; in explicit Light/Dark, confirm OS changes do not override the selection. Refresh to check preference persistence.
2. Use a browser with existing P1/P2 work. Record the code, completion, selected lesson, and attempts. Open every lesson and use **Show me how** without opening its coding lab. Advance, go back, choose alternate outcomes, Replay, Close, and reopen. None of those records should change. Do not clear browser storage for this test.
3. Check L1 with a beginner: the active line, short explanation, and event card should agree at every step. Check that the learner can explain a string, field, object, input, and return using the displayed example.
4. For L3 choose missing payment proof; expect draft despite the browser claim. For L4 compare New / Required / Active; Free always remains. For L5 choose repeated labels; expect rejection despite two clips. For L6 try Obi, a full role, and rejection; venue and subscription consequences should follow the shown decision.
5. On desktop, verify initial Close focus, keyboard Tab/Shift+Tab stays in the native dialog, Escape closes it, and focus returns to Show me how. Closing must restore page scrolling. Navigate with browser Back while a guide is open; the old dialog should disappear.
6. At about 320 and 390 px width, verify the full-screen dialog, wrapping code lines, visible active-line marker, readable visual cards, and reachable Back / Next / Replay / Close controls. Check the header/theme selector, lesson navigation, and coding panes for page overflow. Enable reduced motion and verify there are no unnecessary animations.
7. Click **Open coding lab**. Confirm your six source files remain, the editor follows the selected theme, and Run / Check still executes learner code. Change themes before and after a run, including while a sandbox is starting; the simulation content should follow without a fresh run, changed attempt count, or completion award caused by the appearance change.
8. Run `/replay` via **Open replay lab**; confirm the six-stage flow and first-failure feedback remain. Visit `/questions`, reveal answers, and inspect source links in both themes. Refresh and confirm theme and code restore independently.
9. Block the remote bundler while keeping the local app available. A fresh lesson's guide should work without opening Sandpack. The coding lab may show its normal connection/start timeout. This is not a claim of a service-worker-based offline app.

## Limits

Guides are ungraded demonstrations, not learner-code execution or a secure exam system. Their examples intentionally cover fewer checks than the coding exercises; differences are stated beside the real source links. Browser storage can be blocked or cleared, and devices/tabs are not synchronized. Sandbox startup screens and full visual contrast/layout need the manual checks above. No MongoDB, auth, backend persistence, deployment, real payment, or upload service was added.

Next phase: **P3 — Not started.**
