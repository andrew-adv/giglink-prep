# GigLink Prep — Build Blueprint

**Status:** Agreed implementation plan / Codex handoff.  **New repository:** `giglink-prep`.  **Keep `andrew-adv/giglink` untouched.**

## 1. One-sentence goal
Build a phone-friendly learning website that teaches the real GigLink project by letting the learner assemble and run a small working GigLink-like system, one piece of code at a time, and practice answering tough presentation questions in plain English.

## 2. Division of work
- **ChatGPT (planner/reviewer):** decide scope, sequence, lesson content, setup steps, acceptance criteria; read Codex reports, spot gaps, adjust the next instruction. Do not silently broaden scope.
- **Codex (builder):** write and test code in the **new** repository only, one numbered phase at a time. Report the files changed, what was tested, results, blockers, and exact manual setup required. Stop after each phase.
- **User (accounts/deployment):** create GitHub repository and cloud resources, copy environment variables into local `.env` and hosting dashboards (never into chat or Git), approve visible UI, test a phone.

## 3. Reference repository and traceability
Study but never change the existing public repo `andrew-adv/giglink`, branch `develop` (reviewed at `9c98a93950454c6c8a7b491794ef29727edbf15c`, Nov 4, 2026). Link exact functions/files in teaching content; don't invent functionality. The current project has:
- React and React Router frontend: `client/src/app/router.jsx`, `client/src/features/customer/GigForm.jsx`, `client/src/features/talent/ApplyToPositionPage.jsx`.
- Express API registrations: `server/src/app/app.js`; cross-module adapters: `server/src/app/integration.js`.
- Gig posting/payment verification: `server/src/modules/payments/services/gig-posting-payment.service.js`.
- Location redaction & paid gig visibility: `server/src/modules/talent/talentDiscovery.service.js`.
- Audition validation & application acceptance: `server/src/modules/applications/application.service.js`.
- Account/auth: `server/src/modules/auth/auth.middleware.js`.

Core real-world business rules: gig starts as draft; Free posting fee ₦5,000 and Paid posting fee ₦10,000; Paystack payment is verified by the backend before publishing; paid talent compensation starts at ₦25,000; 1–3 requested samples need 1 video each; exact location is hidden until a talent is accepted; after first accepted Paid gig, a talent needs ₦5,000/30-day active subscription for future Paid-gig discovery (Free gigs stay visible). Do not accidentally depict Paystack test mode as live payment processing.

## 4. Product UX: not a points-and-badges course
The **core game** is an interactive mini GigLink project that gets more capable with every chapter. A user types a few lines, clicks Run, watches the system change, and sees which test passed or why it failed. There is a persistent multi-file workspace; the code from earlier chapters is retained for later chapters.

Every lesson has the same short loop:
1. **Show:** a simple real-life analogy (e.g. draft = an event flyer waiting for approval).
2. **Try:** user changes a visual object in a simulation (e.g. attempts to publish without paying).
3. **Code:** fill an actual `TODO` in the mini-project's JS files; no multiple-choice-only stand-ins.
4. **Run:** execute in an isolated browser code-preview environment; observable result and functional tests (not naive answer-string matching).
5. **Connect:** show the actual GigLink source path and explain what is simplified in the mini-project.
6. **Defend:** one CTO-style "why is it built this way?" question. Show a short plain-English answer first, then technical depth on demand.

### Teaching language rules
- Speak like someone teaching a smart newcomer, not a formal architecture document. Short sentences; everyday examples first; define jargon when unavoidable.
- Demonstrate cause-and-effect. Let the learner make a wrong choice and see the consequence.
- Avoid vague phrases like “orchestrates the workflow,” “robust implementation,” “seamless integration,” “leveraging scalable solutions.”
- Prefer “The browser says payment worked. The server checks Paystack before believing it.”
- Every hard question must have an accurate answer grounded in a named GigLink file and distinguish tested behavior from assumptions.
- Visual principles from the requested visual DSA video: analogy → animation/interaction → code → prediction → repeat.

## 5. MVP scope, in strict priority order
**Milestone M0 — make the actual learning loop work (highest priority):**
- Responsive home screen, chapter list, progress bar, overview interactive illustration.
- One mini-project with editable JS files, code editor and live preview/test output.
- 3 *working* connected lessons: (1) Create a gig object; (2) validate a draft; (3) publish only with verified payment. Each lesson adds working code to a retained workspace. Support wrong/correct code, reset-this-lesson, and a final mini-flow that runs all three.
- At least 4 specific CTO questions (with 2-depth explanations), tied to real source paths.
- Save locally to avoid losing work if the backend is sleeping; show clear save status.

**Milestone M1 — connected real GigLink journey:**
- Add (4) browse gigs and redact location; (5) submit 1–3 matching audition videos in a simulation (no real upload); (6) accept/reject applicant and show the paid-subscription gate.
- Final replay: create → validate → verify → publish → browse → apply → accept → reveal venue → gate future paid gigs. Code from every chapter remains connected; no disconnected one-off coding questions.
- 10–12 CTO question cards around trust boundary, payments, privacy, slots, subscriptions, frontend vs backend authorization, data models, endpoints, and deployment.

**Milestone M2 — persistent hosted full-stack app:**
- Express API with MongoDB Atlas stores anonymous learner progress, completed lessons, code snapshots, attempt counts, last active time.
- Anonymous device token stored in localStorage; no email, username, signup, password, social login, analytics, payments, or personal profiles. The token identifies one browser only; provide export/import progress JSON for cross-device migration if practical.
- Auto-save/debounced sync and local fallback; handle Render free sleep gracefully. Static lesson material stays in source-controlled content files; database stores learner work, not the syllabus.
- Vercel frontend, Render backend, one Atlas Free cluster, `.env.example`, health check, CORS, SPA rewrite, setup README.

**Order rule:** Implement M0 fully before M1/M2 unless a tiny foundational piece is needed earlier. Do not start infrastructure complexity before there is a playable learning loop. Once M0 is proven locally, add backend + DB and deploy without destabilizing the core game.

## 6. Recommended technology
- Frontend: React + Vite + React Router + CSS (simple, readable, mobile-first). Use JavaScript (the real repo is JS), not TypeScript migration.
- Code lab: `@codesandbox/sandpack-react` with vanilla JS template, editable multi-file project and sandboxed preview/tests. Build a purpose-designed mobile split/tabs UI instead of the unmodified full Sandpack default. Keep user's active code synchronized and persist snapshots.
- Backend: Express + Node.js.
- Persistence: MongoDB Atlas (Mongoose) with one `LearnerProgress` collection and validated updates.
- Hosting: Vercel (`client` root), Render (`server` root), MongoDB Atlas.
- No AI API, no AI billing, no LLM generated lessons, no authentication, no media uploads for MVP.

For code exercises, **never execute learner code on the Express server** or inside the trusted main window. Use sandbox preview/test execution. Client/editor may carry only lesson/test fixtures and public code; do not inject API secrets into sandboxes.

## 7. Proposed directory structure
```
giglink-prep/
  README.md
  PRODUCT_PLAN.md
  CODEX_BUILD_PROMPTS.md
  SETUP_AND_DEPLOYMENT.md
  .gitignore
  client/
    package.json
    vercel.json
    .env.example
    src/
      app/                 # routes/layout
      content/             # lessons, questions, file references
      features/overview/   # teaching animation/game
      features/lab/        # editor, run tests, mini project
      features/questions/  # CTO prep
      features/progress/   # autosave & offline fallback
      styles/
  server/
    package.json
    .env.example
    src/
      app.js
      server.js
      db.js
      models/LearnerProgress.js
      routes/progress.js
```
Codex can deviate when it gives a good reason, but must keep the frontend/backend separated for two hosting services.

## 8. Data shape (small)
```
LearnerProgress {
  learnerId: String, // high-entropy random browser ID, unique indexed; no real name
  chapterId: String,
  completedLessonIds: [String],
  codeFiles: Object, // bounded path -> source string snapshots, scoped to mini-project
  attempts: Object, // lessonId -> integer
  updatedAt: Date
}
```
A single document per learner is acceptable for MVP. Validate keys, limit size of code files and count of updates, and upsert; send no real user data. LocalStorage is primary offline fallback. Don't write a credential system just for this.

Suggested API: `GET /api/health`, `GET /api/progress/:learnerId`, `PUT /api/progress/:learnerId`. If a different API is proposed, explain the benefit first.

## 9. Definition of done
- Learner can open app on a phone, see plain-English overview, enter a chapter, change code, Run, observe meaningful differences, pass/fail tests, and complete chapter.
- Changes in chapter 1 affect chapter 2, and finishing the chain produces a visibly working mini GigLink scenario.
- Wrong code fails and is explained (no fake green “passed” states).
- Reload does not erase work; Render downtime does not block local learning.
- At least 3 connected lessons are working before deployment; all 6 and CTO questions preferred after core is stable.
- Repo is separate. No Git changes to `giglink`. No real Paystack credentials or secrets. Basic `npm run build` and relevant automated tests pass.
- `README` explains install, start, deploy, env and how to verify frontend-backend-DB connectivity.

## 10. Out of scope for this fast build
Accounts/passwords, user profiles, admin dashboard, payment processing, talent video uploads, production-grade security architecture, AI chat generation, native apps, realtime multiplayer, achievements/leaderboards, a general-purpose course authoring platform, and a full clone of GigLink itself. The mini-project is **a learning simulation**, not a replacement marketplace.
