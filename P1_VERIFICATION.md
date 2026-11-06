# P1 verification and handoff

P0 checkpoint: clean `main`, remote `andrew-adv/giglink-prep`, HEAD and `origin/main` both `4f7546a8dbcfee1bc64a61e4335cd401b4529080` before P1 edits. No uncommitted P0 files, unrelated files, or matched secret patterns were found. The original GigLink checkout was not modified; source evidence was read through GitHub.

## Automated checks

Run `npm test` from the root. There are 16 frontend tests plus the unchanged API test.

| Coverage | Demonstration |
| --- | --- |
| Lesson 1 fails and passes | Unfinished object fails; completed creator passes 4 checks; hardcoded event fails alternate-input check |
| Lesson 2 fails and passes | Unfinished validator fails; completed code passes 12 cumulative checks; always-accept and always-reject functions fail |
| Lesson 3 fails and passes | Unfinished publisher fails; completed code passes 18 cumulative checks; trusting only the browser fails |
| Connected flow | The actual imported creator, validator, and publisher create → check → verify (simulated) → publish one retained event |
| Earlier edits affect later work | Changing the creator changes the final card; invalid earlier data blocks later publication |
| Actual output | The sandbox runner renders fixture output and posts calculated checks; a wrong publisher visibly returns published while its behavioral check fails |
| Scenarios | Missing title, low payment, unverified result, browser-only claim, and backend-only proof all exercise the same functions |
| Saving | Save/read round trip retains code, completion, current lesson, and attempts; edits clear dependent completion; invalid or blocked storage reports failure |
| Result messages | Only a complete report with the current run ID, exact iframe source, and expected sandbox origin can update completion; malformed and stale reports fail |
| Existing API | Health JSON, CORS header, and JSON 404 still pass |

`npm run build` builds the frontend. Sandpack is lazy-loaded from the lesson route so the original overview does not load the editor immediately. Vite warns that the Sandpack chunk exceeds 500 kB before gzip; this is an advisory warning, not a build failure. Node prints its experimental VM-modules notice during authored-fixture tests; production execution uses the browser sandbox instead.

These are logic and runner tests. They do **not** claim to verify the remote Sandpack bundler, visual layout, editor keyboard behavior, or a real browser refresh. Browser access was rejected earlier in this session, and no alternate browser automation was used to bypass that restriction.

## Manual browser and phone checklist (not yet verified)

Start with `npm ci` then `npm run dev`. Use a fresh browser profile or keep a copy of existing code before resetting a lesson. No secrets are needed. Internet access is required for Sandpack's bundler.

1. Open `http://localhost:5173/lessons/1` at about 390 px width. Confirm Learn / Code / Result switch without horizontal page overflow. Check the desktop layout too.
2. Run the unchanged TODO: expect failed checks and an incomplete event card. In Learn, read the worked example; type it into `gig.js` and run. Expect **4/4** passing checks, an unpaid draft, and **1/3** complete. Change the fictional event title and confirm the card follows it after Run.
3. Open lesson 2. Confirm `gig.js` retains your code. Run the unfinished validator: it must fail invalid-input checks. Complete `validate.js` using the shown contract/example. Expect **12/12** checks. Choose Missing event title or Paid gig below ₦25,000 and run: the scene shows your validator's messages while the tests still prove the function works for both valid and invalid fixtures.
4. Open lesson 3. Run its unfinished publisher: the verified-publication check must fail. Complete `publish.js`. Expect **18/18** checks. Browser says paid / backend says no must remain draft. Backend verified / browser says no must publish. Missing title with backend proof must remain draft with validation errors.
5. Click Replay all 3 lessons. Expect the same event title and the flow **draft → valid → backend: yes → published**, calculated from all three current files.
6. Refresh the page. Confirm all three code files, current lesson, attempt counts, and **3/3** completion are restored. Results must wait for another Run rather than pretending code reran on refresh.
7. Edit `gig.js` to return a blank title. Completion must clear downstream. Run lesson 3: it must visibly fail and retain a draft. Restore your code and run again to regain completion.
8. Reset lesson 2. Confirm only `validate.js` resets; creator and publisher code remain. Lesson 1 stays checked; lessons 2 and 3 need fresh checks.
9. Introduce a syntax error and run: expect an error with no completion award. Fix it and rerun. Try switching lessons during a run: an old result must not complete the new lesson.
10. Stop only the API and reload: local code and completion must remain. Block internet access to the bundler and run: expect a start/timeout error, never invented success. Browser-storage failures should say Not saved. Check the source links and keyboard focus; Escape then Tab should leave the editor.

## Real GigLink evidence and simplifications

Read-only `develop` resolved to `9c98a93950454c6c8a7b491794ef29727edbf15c`. Teaching links are pinned to that commit.

- [gig.service.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/gigs/gig.service.js): `createGigDraft` validates and stores an unpaid draft; `updateCustomerGig` rejects system-controlled fields. Mini `createGig` only returns an in-memory object.
- [gig.validation.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/gigs/gig.validation.js): `validateGigDraft` checks types, roles, samples, and whole-naira payment ranges. Mini `validateGig` keeps type/range rules and returns messages rather than throwing. Roles, samples, full dates, and normalization are outside P1.
- [gig.model.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/gigs/gig.model.js): title and location are required by the real schema; our validator checks these explicitly.
- [gig-posting-payment.service.js](https://github.com/andrew-adv/giglink/blob/9c98a93950454c6c8a7b491794ef29727edbf15c/server/src/modules/payments/services/gig-posting-payment.service.js): verification checks transaction status, reference, amount, and currency before `publishVerifiedGig` asks the repository to publish. Mini `backendVerified` is an explicitly simulated input, not a secure payment result. Mini publication directly revalidates because there is no stored database record; this is not a claim that the real payment service calls the draft validator.

Sandpack integration uses its documented [provider/editor components](https://sandpack.codesandbox.io/docs/advanced-usage/components) and [client hooks](https://sandpack.codesandbox.io/docs/advanced-usage/hooks). The iframe is cross-origin and sandboxed. Learner files remain separate from the trusted React window and Express. Hidden checks and completion are learning aids, not tamper-proof examination grading. A worked example is intentionally available; opening it does not award completion.

No P2 behavior, MongoDB, authentication, personal-data fields, payment integration, media service, or deployment changes are included. Local storage has no cross-device or concurrent-tab synchronization.
