# GigLink Prep — Copy-ready Codex task queue

Use **one phase prompt at a time**, in a new VS Code workspace for `giglink-prep`, **not** your existing `giglink` workspace. Feed Codex `PRODUCT_PLAN.md` and `SETUP_AND_DEPLOYMENT.md` (put all three files at the new repo root). Review the report and ask ChatGPT to check the result before starting the next phase. This saves usage credits and prevents runaway rewrites.

## Standing instructions for all phases
```
You are implementing the separate `giglink-prep` educational web app.
Read PRODUCT_PLAN.md and SETUP_AND_DEPLOYMENT.md before making edits.
The real GigLink repo (andrew-adv/giglink, branch develop) is READ-ONLY evidence; do not change it.
Use practical plain-English teaching, real interactive code exercises, and a single connected mini-project.
Do not overengineer. Finish the stated phase, run its relevant checks, stop.
Do not use any paid AI API, auth provider, Paystack integration, Cloudinary or personal data.
At the end output: PHASE; DONE; FILES CHANGED; TESTS RUN + results; MANUAL STEPS; KNOWN LIMITATIONS; NEXT PHASE (do not start it).
```

## P0 — New repo skeleton and running frontend (start here)
```
Implement P0 only. Create a Vite/React frontend under client/, Node/Express backend skeleton under server/, sensible root scripts/README, and a mobile-first app shell. Use a clean visual theme. Make homepage show the GigLink Prep mission, an interactive-looking (but clearly marked not yet playable) lesson journey and chapter entry. Include client/vercel.json SPA rewrite and .env.example files, no secrets. Add backend GET /api/health returning JSON. Do not add MongoDB connection or the full game yet. Verify frontend builds and API server starts/health responds. Report exactly what runs locally. Stop.
```

## P1 — The actual playable code loop (most important)
```
Implement P1 only. Build three fully working, connected mobile-friendly lessons around one retained multi-file JavaScript mini GigLink: (1) create a valid gig object; (2) validate a draft gig; (3) publish only when a backend-verified-payment flag is true. Build an interactive visual simulation (actual state changes) and embed Sandpack multi-file JavaScript editor + Run/Check functionality. The learner edits real TODO blocks; functional tests evaluate behavior, not code text matching. Wrong code must fail visibly; correct code must pass and change the preview. Persist code and completion to localStorage. Lessons are short: plain-language analogy, interactive try, code task, result, link to specific REAL GigLink source file, one deep question. Keep code from chapter 1 for chapter 2 and chapter 3; final scene runs the complete joined flow. Do not implement a fake code editor or pretend code executed. Implement and run relevant tests/build and inspect the mobile layout. Stop.
```

## P2 — Complete GigLink story + CTO preparation
```
Implement P2 only. Extend the SAME mini-project (do not create unrelated mini labs) with connected lessons: (4) browse gigs and hide exact location for unaccepted talent; (5) require a matching demo for each requested sample (1–3); (6) accept/reject applicant, reveal venue to accepted talent, and show that after first accepted Paid gig future Paid-gig browsing needs subscription while Free gigs remain available. For MVP, uploads/payments are simulated, not actual external services. Have a 'Replay full journey' game screen that executes the complete learner-authored code and reveals which stage fails. Add 10–12 tough but relevant CTO/instructor questions with a short simple answer, then deeper technical explanation and actual source file links. Prove every exercise tests behavior, the code carries forward across stages, and the final replay works. Stop.
```

## P3 — Real persistence (MongoDB + Render API)
```
Implement P3 only. Add a Mongoose LearnerProgress model and Express GET/PUT /api/progress/:learnerId. No user accounts or passwords. Generate a random opaque learnerId locally and store locally. Save chapter completion, current chapter, code files and attempts; bound request payloads. Use debounced save and localStorage fallback when backend is unavailable; reconcile cautiously (latest timestamp or explicit manual choice; do not silently delete local work). Add clear Syncing/Saved Offline/Saved statuses. Use MONGODB_URI and CLIENT_ORIGIN environment variables from server/.env; implement /api/health with database state but without exposing secrets. Verify local data survives refresh and after server restart, including error cases. Add specific environment instructions to README. Stop.
```

## P4 — Deploy readiness and release QA
```
Implement P4 only. Prepare client for Vercel and server for Render using their subdirectory roots; production API URL is VITE_API_BASE_URL; backend uses process.env.PORT, MONGODB_URI, CLIENT_ORIGIN. Ensure CORS accepts exact frontend origin and local development. Confirm Vercel SPA route refreshes, Render GET /api/health, MongoDB connectivity, error handling when backend sleeps, no secrets in Git, and basic input validation. Run frontend build and available tests. Write a manual end-to-end QA checklist (phone + laptop) proving a learner starts, edits code, fails, fixes, completes lessons, refreshes, and recovers saved progress. Do NOT deploy without required URLs and user-managed secrets. Stop.
```

## Recovery instruction if Codex goes off track
```
Stop making changes. Compare what you built to the CURRENT PHASE in CODEX_BUILD_PROMPTS.md and acceptance criteria in PRODUCT_PLAN.md. List differences, regressions, and tests needed. Propose the smallest fix only. Do not rewrite the project, start a new phase, or touch the original GigLink repository.
```

## Review gate after each phase
Show ChatGPT the Codex report, Git commit SHA or diff, and a screenshot if UI changed. Have ChatGPT check the result against that phase's acceptance criteria, then either provide a tiny fix prompt or approve the next phase. Don't run all phases in one Codex prompt.
