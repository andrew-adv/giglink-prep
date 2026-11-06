# P5 — Original GigLink evidence review

Reviewed read-only through the GitHub connector on **6 November 2026**. No file, branch or database in the original project was changed. Commit author display names were not used to identify students or assign personal credit.

## Repository state

| Original repository ref | Verified revision |
| --- | --- |
| `develop` | [`9c98a93950454c6c8a7b491794ef29727edbf15c`](https://github.com/andrew-adv/giglink/commit/9c98a93950454c6c8a7b491794ef29727edbf15c), 4 November 2026 |
| `main` | [`6250520ea490ffa1063d4f0b1fee06ad7ba69010`](https://github.com/andrew-adv/giglink/commit/6250520ea490ffa1063d4f0b1fee06ad7ba69010), 5 October 2026 |
| Comparison | [`main...develop`](https://github.com/andrew-adv/giglink/compare/6250520ea490ffa1063d4f0b1fee06ad7ba69010...9c98a93950454c6c8a7b491794ef29727edbf15c): develop ahead 41, behind 0 |

The planning snapshot was still current when checked. The public content records a **dated snapshot**, not a live repository monitor. All original source links are pinned to the reviewed develop commit. The tree API was inspected to validate source paths. The complete available develop history contained 44 commits, including the initial specifications and foundation parents.

## Required documents read

The source registry is [evidence.js](client/src/content/presentation/evidence.js); it contains the full pinned URLs.

- `README.md`: purpose, role workflows, business rules, models, services, exclusions, branching and demo contract.
- `AGENTS.md`: ownership, missing-dependency handoffs, integration and verification responsibilities.
- `docs/TASK_STUDENT_1.md`: authentication/user feature branch and router/component exports.
- `docs/TASK_STUDENT_2.md`: customer/gig ownership, review adapter and payment/application dependencies.
- `docs/TASK_STUDENT_3.md`: discovery, application ownership, audition matching, accepted location access and subscription lookup dependency.
- `docs/TASK_STUDENT_4_CAPTAIN.md`: C00 foundation, C01–C04 payments/admin, C05 actual handoff requirements and C06 release/QA responsibilities.
- `docs/ACCOUNT_APPEARANCE_RELEASE.md`: one-off subscription cancellation, guarded deletion and retained records, appearance, read-only Admin preview.

Task documents describe **assignments**, not a verified personal contribution ledger. The user reports that the instructor supplied C00; the Captain task file assigns C00 to Student 4. Both are explicitly labelled in the story. The documents do not conclusively identify all four people or the original proposer.

## Implementation inspected

- `server/src/app/app.js` and `integration.js`: real route mounting, deferred Paystack client construction, Gig/User/Subscription repositories, customer adapter and first-Paid-acceptance hook.
- `client/src/app/router.jsx`: public, auth and protected feature route integration.
- `auth.controller.js`, `auth.service.js`, `auth.middleware.js`: public Customer/Talent registration allowlist, password hashing, JWT validation, current user and suspended-account checks.
- `gig.validation.js`: server-derived posting fees, compensation constraints, unique 1–3 requests and customer-controlled-field allowlist.
- `application.service.js` / `application.repository.js`: exact matching demos, pending-only review, ownership/capacity checks, transactions, accepted application venue response, first Paid acceptance and separate My Applications access.
- `talentDiscovery.service.js`: explicit safe response construction, Free/Paid feed gating, accepted detail access only after the discovery gate.
- `gig-posting-payment.service.js`, `paystack.client.js`, `subscription-requirement.service.js`, `subscription.service.js`: verification matching, repeat verification handling, server-held provider access, requirement flag, time-bounded passes and cancellation.
- `media.service.js`: backend-held Cloudinary configuration and upload response metadata.
- `publicGig.router.js`: restricted published public previews; no exact venue or compensation/application details.
- `account-deletion.service.js`: password/confirmation, booking blockers, transaction, account/profile removal, pending-application changes and remaining records.
- `AdminRolePreview.jsx`: authored read-only display; no account impersonation or JWT/role mutation.
- Original audition, Paystack-client and mobile-layout test files: inspected test cases and assertions, **not executed**. Other test paths were verified in the tree; presence is not a passing test report.

## Meaningful history reviewed

History metadata was read from the commits collection. Diffs/file changes were inspected for the initial specifications, foundation, C05 integration, withdrawal fix, audition/public refresh, account/appearance release and latest mobile refinement. Other grouped milestones use recorded commit messages and the current implementation; they do not assert unobserved incidents.

| Date (UTC) | Evidence | Interpretation used |
| --- | --- | --- |
| 4 Oct | [`59d17b4`](https://github.com/andrew-adv/giglink/commit/59d17b46842e9c19e15f4e1cbe83242a1521d209) | First commit contains specifications/task files; not proof of conception date. |
| 5 Oct | [`4738b67`](https://github.com/andrew-adv/giglink/commit/4738b67ee195cb8a4f11c2abd1d1021963ad21e2) and `6250520` | Shared runnable structure added and merged; personal attribution remains distinct. |
| 7 Oct | `feeb43b`, `ba7bae6`, `e9cd9bc`, `5a8bc55` | Talent, accounts, gig model and customer-review feature history. |
| 9–11 Oct | `cc39bfa`, `f7d71a3`, `6c815fd`, `a81b0dc` | Payment/subscription services and Admin management history. |
| 12 Oct | Four feature merge commits and [`5676483`](https://github.com/andrew-adv/giglink/commit/56764832067abed70cac391903a09a1207c4c820) | C05 adds real shared integration after merging auth, customer, talent and payment branches. |
| 15–23 Oct | `1ed0af3`, [`986b771`](https://github.com/andrew-adv/giglink/commit/986b7714ae4134abe412b95944f736816365f80d), `3272f91`, `03c0a80`, `3139d8e` | Root environment, withdrawal authorization order, DB startup and SPA route configuration changes. |
| 28–30 Oct | `193d4a5`, `b5b95d8` | UI polish and explicit production API address. |
| 2–3 Nov | `8465b88`, `ce4c323`, `ddee92f`, `47cf28a`, `edc1ec8` | Demo-core/public-shell integration and reconciliation. Labels do not identify real people. |
| 4 Nov | [`ec51cad`](https://github.com/andrew-adv/giglink/commit/ec51cada4715cabe30605894fe2b1eb7596c2ddf) | Fixed-three task contract becomes 1–3 requests across form, model, validation and application service. |
| 4 Nov | [`a876c59`](https://github.com/andrew-adv/giglink/commit/a876c593886821a4845203f93a71a494fa774694), `47dc007` | Account/appearance controls and Admin preview plus follow-up alignment. |
| 4 Nov | [`9c98a93`](https://github.com/andrew-adv/giglink/commit/9c98a93950454c6c8a7b491794ef29727edbf15c) | Latest verified integrated mobile browsing/public preview refinement. |

The interactive timeline includes full links to its primary and related commits. Small commits are grouped; dates do not imply meetings, instructor approvals or personal accounts of difficulty.

## Evidence boundaries

“Implemented” means inspected code exists at that snapshot. “Test code present” means an authored test exists, not that it passed here. “Live demonstration required” covers real provider flows, deployed availability and device QA. Transactions/capacity checks do not establish a complete concurrency guarantee. Subscription gating applies to discovery; My Applications separately retains accepted commitments. The original app uses Paystack Test Mode/Cloudinary/JWT; **GigLink Prep does not add those integrations**.

Unconfirmed personal facts are isolated in [personal-details.js](client/src/content/presentation/personal-details.js): original proposer/date, four students’ names/actual contributions and final demo/approval/release result. They remain labelled **To confirm**, do not appear as named credits, and are not needed to use the public page.
