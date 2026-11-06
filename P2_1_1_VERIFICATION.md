# P2.1.1 — Sandpack runner compiler hotfix

Started from clean `main` at P3 commit `29f4820b172e74d5b048092689139cf10a58ea0d`. P3 database/synchronization code, local workspace migration/storage, lesson functions and grading rules, walkthroughs, themes, and the original GigLink project are unchanged. No new phase is started.

## Exact cause

`sandbox-files.js` imports `sandbox-runner.js?raw` and supplies that string as the hidden `/index.js`. Vite builds the surrounding app but does not transpile this raw text. Sandpack's `vanilla` template uses its Parcel environment. In the installed Sandpack client 2.19.8, the absence of `@babel/core` from the virtual package's dependencies/devDependencies leaves its Babel 6 path selected.

Using Sandpack's own bundled **Babel 6.26.0** locally reproduces the user's error exactly: **`/index.js: Unexpected token (38:19)`**, at `journey?.complete`. It also rejects a catch without a binding (`catch {}`). These features occur in other hidden modules and worked examples too. Changing only the first optional chain would merely move the compiler error.

The production fix changes only the hidden `/package.json` definition in `sandbox-files.js`: declare `@babel/core: "7.21.8"` under devDependencies. Sandpack's actual compiler-selection function then chooses Babel 7, whose 7.21.8 compiler is already shipped with this bundler. The runner, imports and saved learner source remain intact. There is no editor/library switch, new root npm dependency, workspace rewrite, reset or progress migration.

## Regression verification

New tests load the actual `sandboxFiles` output through the existing Vite test loader. They extract and run the installed bundler's compiler selector, then use its shipped Babel compilers in Node. They do not use the host Vite/Babel compiler as a substitute for Sandpack's parser.

- Babel 6 reproduces the exact original `/index.js` line/column failure and the optional-catch-binding failure.
- The fixed virtual package selects Babel 7.21.8.
- Every supplied JavaScript module is parsed/transformed with that compiler, with both starter files and worked solutions: `/index.js`, all six learner files, checks, story checks/scene/project, generated project data, and the shared theme module. This includes optional chaining, nullish coalescing and optional catch bindings.
- Compiler-processed sources execute in the existing isolated Node VM/DOM fixture. An unfinished L1 returns normal failed behavioral checks; correct L1/L2/L3 report **4/4**, **12/12**, **18/18**. Correct six-lesson replay reports **42/42** and completes the connected flow.
- An edited `gig.js` changes the rendered event title and fails the appropriate behavioral check, rather than displaying a canned success state.
- The preview starts Dark, receives Light/Dark theme messages, and its HTML still contains the requested dark tokens. The saved workspace/progress JSON remains byte-for-byte unchanged by constructing, compiling and executing the test sandbox.
- Existing P3 synchronization, conflict, offline recovery, migration, lesson/replay, theme, guide and question tests remain in the full suite.

`npm test`: **63 frontend tests and 7 API tests passed**. `npm run build`: **passed**, with the existing Sandpack chunk-size advisory. `git diff --check`: **passed**. No backend/database integration change requires a new live MongoDB run for this hotfix.

The compiler fixture deliberately targets the installed bundler assets. If Sandpack is upgraded, its selector/asset paths must be reviewed; a missing asset fails the test instead of silently substituting another parser. Only repository-authored fixtures run in Node. Normal learner code continues to execute in Sandpack.

## Browser status and manual retest

**The pre-fix failure was confirmed by the user in a real browser. The post-fix real-browser Sandpack run is unverified.** Prior automatic approval review rejected Chrome access with “Computer Use was not approved to use Google Chrome.” No browser automation or bypass was attempted. Compiler transformation plus Node execution is stronger than a frontend build alone, but does not exercise the remote bundler worker, dependency fetches, iframe messaging or rendered browser layout end to end.

1. Pull this commit, run `npm ci` and `npm run dev`, refresh the page and reopen the coding lab so it receives the updated hidden package. **Keep existing browser storage; do not reset saved code/progress.** Use a separate browser profile for deliberately unfinished/solution experiments if needed.
2. Run unfinished Lesson 1. Expect ordinary FAIL results, not a compiler overlay. Then use correct connected examples: L1 **4/4**, L2 **12/12**, L3 **18/18**. Confirm no optional-chaining/catch compiler error appears in hidden imports or learner files.
3. Finish/use your six working files and run `/replay`. Expect **42/42**, the complete review/venue/subscription flow, and the success message. Edit an earlier learner file; its actual preview output or first failing check must change.
4. Change Dark/Light/System before and after Run; check the editor and preview. Refresh and verify all six saved files, completion, attempts, selected lesson and theme remain. Confirm the P3 save/sync banner still behaves as before.

Next phase: **P4 — Not started. P3 is preserved.**
