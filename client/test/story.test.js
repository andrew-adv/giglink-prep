import assert from 'node:assert/strict';
import test from 'node:test';
import { compile, renderRunner } from './helpers/fixtures.js';
import { baseDetails, editablePaths, exampleSolutions, scenarios, starterFiles } from '../src/features/lab/project.js';
import { runChecks, runFullJourney, runScene } from '../src/features/lab/checks.js';
import { characters, demoSet, storyOptions } from '../src/features/lab/story-project.js';
import { changeFiles, freshWorkspace, legacyStorageKey, readWorkspace, recordChecks, saveWorkspace, storageKey } from '../src/features/progress/workspace.js';
import { isCurrentReport } from '../src/features/lab/report.js';

const scenario = overrides => ({ ...scenarios[4], story: { ...storyOptions, ...overrides } });
const allPass = checks => checks.every(check => check.passed);

test('all six learner files execute one full journey, ending with venue and Free-only discovery', async () => {
  const api = await compile(exampleSolutions), result = runFullJourney(api, scenario());
  assert.equal(result.complete, true, JSON.stringify(result.firstFailure));
  assert.equal(result.firstFailure, null);
  assert.deepEqual(result.stages.map(stage => stage.id), [1, 2, 3, 4, 5, 6]);
  assert.equal(result.application.gigId, result.gig.id);
  assert.equal(result.review.application.status, 'accepted');
  assert.equal(result.review.talent.paidGigSubscriptionRequired, true);
  assert.equal(result.mine[0].gig.location, baseDetails.location);
  assert.ok(result.afterBoard.length > 0 && result.afterBoard.every(gig => gig.gigType === 'free'));
  assert.ok(result.board.every(gig => !Object.hasOwn(gig, 'location')));
  assert.ok(allPass(result.checks));
});

test('full replay identifies the first failing lesson for each unfinished file', async () => {
  for (let index = 0; index < editablePaths.length; index++) {
    const path = editablePaths[index];
    const result = runFullJourney(await compile({ ...exampleSolutions, [path]: starterFiles[path] }), scenario());
    assert.equal(result.complete, false, path);
    assert.equal(result.firstFailure.stage, index + 1, path);
    assert.ok(result.firstFailure.message.length > 10);
  }
});

test('earlier edits propagate into board, application, review, and accepted commitment', async () => {
  const api = await compile({ ...exampleSolutions, '/gig.js': exampleSolutions['/gig.js'].replace('...details,', '...details, title: details.title + " (my event)",') });
  const result = runScene(api, 6, scenario());
  assert.match(result.board[0].title, /\(my event\)$/);
  assert.equal(result.application.gigId, result.gig.id);
  assert.match(result.mine[0].gig.title, /\(my event\)$/);
  const broken = await compile({ ...exampleSolutions, '/publish.js': starterFiles['/publish.js'] });
  assert.equal(runFullJourney(broken, scenario()).firstFailure.stage, 3);
});

test('unsafe browsing fails behavioral checks and the rendered board blocks the venue', async () => {
  const files = { ...exampleSolutions, '/browse.js': 'export function browseGigs(gigs) { return gigs; }' };
  assert.equal(runChecks(await compile(files), 4).find(check => check.id === 'browse-private').passed, false);
  const result = await renderRunner(files, { runId: 'privacy', through: 4, scenario: scenario(), parentOrigin: 'http://localhost:5173' });
  assert.match(result.rendered, /First failing stage: lesson 4/);
  assert.doesNotMatch(result.rendered, new RegExp(baseDetails.location));
});

test('fictional status controls change actual discovery; Free is always available', async () => {
  const api = await compile(exampleSolutions);
  for (const [talentStatus, count] of [['new', 3], ['required', 1], ['active', 3]]) {
    const result = runScene(api, 4, scenario({ talentStatus, character: 'otherTalent' }));
    assert.equal(result.board.length, count);
    assert.equal(result.talent.id, characters.otherTalent.id);
    assert.ok(result.board.some(gig => gig.gigType === 'free'));
    assert.ok(result.board.every(gig => !Object.hasOwn(gig, 'location')));
  }
});

test('1–3 requested samples accept exact mappings and reject each bad demo scenario', async () => {
  const api = await compile(exampleSolutions);
  for (const sampleCount of [1, 2, 3]) {
    assert.equal(runScene(api, 5, scenario({ sampleCount })).application.status, 'pending');
    for (const demos of ['missing', 'extra', 'mismatch', 'duplicate']) assert.equal(runScene(api, 5, scenario({ sampleCount, demos })).firstFailure.stage, 5);
  }
  // A length-only implementation is not enough, even though its happy scene may look valid.
  const weak = await compile({ ...exampleSolutions, '/apply.js': 'export function applyForGig(gig, talent, demos) { return { id: "a", gigId: gig.id, positionId: gig.position.id, talentId: talent.id, demos, status: "pending" }; }' });
  assert.equal(runChecks(weak, 5).find(check => check.id === 'apply-mapping').passed, false);
});

test('review controls enforce ownership, full roles, rejection, and Free consequences', async () => {
  const api = await compile(exampleSolutions);
  for (const options of [{ reviewer: 'outsider' }, { reviewer: 'talent' }, { full: true }]) assert.equal(runScene(api, 6, scenario(options)).firstFailure.stage, 6);
  const rejected = runScene(api, 6, scenario({ decision: 'rejected', full: true }));
  assert.equal(rejected.review.application.status, 'rejected');
  assert.equal(rejected.review.talent.paidGigSubscriptionRequired, false);
  assert.equal(Object.hasOwn(rejected.mine[0].gig, 'location'), false);
  const free = runScene(api, 6, scenario({ gigType: 'free' }));
  assert.equal(free.review.talent.paidGigSubscriptionRequired, false);
  assert.equal(free.mine[0].gig.location, baseDetails.location);
});

test('accepted commitments remain accessible after discovery closes; other talent cannot read them', async () => {
  const api = await compile(exampleSolutions), result = runFullJourney(api, scenario());
  assert.equal(api.browseGigs([result.gig], result.review.talent).length, 0);
  assert.equal(api.myApplications([result.gig], [result.review.application], result.review.talent)[0].gig.location, result.gig.location);
  assert.equal(api.myApplications([result.gig], [result.review.application], characters.otherTalent).length, 0);
  const gig = result.gig;
  assert.throws(() => api.applyForGig(gig, characters.talent, demoSet(gig.position.auditionSongs), [result.review.application]));
});

test('six-file sandbox runner displays executed acceptance, gating, and a failed stage', async () => {
  const config = { runId: 'six-files', through: 6, fullJourney: true, scenario: scenario(), parentOrigin: 'http://localhost:5173' };
  const passed = await renderRunner(exampleSolutions, config);
  assert.match(passed.rendered, /Full journey passed/);
  assert.match(passed.rendered, /My Applications/);
  assert.match(passed.rendered, /Venue: Demo music hall/);
  assert.match(passed.rendered, /Subscription required for future Paid discovery: true/);
  assert.ok(allPass(passed.posted.message.checks));
  const failed = await renderRunner({ ...exampleSolutions, '/review.js': starterFiles['/review.js'] }, config);
  assert.match(failed.rendered, /First failing stage: lesson 6/);
  assert.equal(allPass(failed.posted.message.checks), false);
});

test('P1 save migration preserves every old file, completion, lesson and attempt; keeps a backup', () => {
  const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const old = { version: 1, codeFiles: Object.fromEntries(editablePaths.slice(0, 3).map(path => [path, exampleSolutions[path] + '// my retained P1 work\n'])), completed: [1, 2, 3], currentLesson: 3, attempts: { 1: 2, 2: 4, 3: 6 } };
  const original = JSON.stringify(old); storage.setItem(legacyStorageKey, original);
  const { workspace, message } = readWorkspace(storage);
  assert.match(message, /Restored P1/);
  assert.equal(workspace.version, 2);
  for (const path of editablePaths.slice(0, 3)) assert.equal(workspace.codeFiles[path], old.codeFiles[path]);
  for (const path of editablePaths.slice(3)) assert.equal(workspace.codeFiles[path], starterFiles[path]);
  assert.deepEqual(workspace.completed, old.completed);
  assert.deepEqual(workspace.attempts, { ...old.attempts, 4: 0, 5: 0, 6: 0 });
  assert.equal(workspace.currentLesson, 3);
  saveWorkspace(storage, workspace);
  assert.equal(storage.getItem(legacyStorageKey), original);
  assert.ok(storage.getItem(storageKey));
  assert.deepEqual(readWorkspace(storage).workspace, workspace);
});

test('six-lesson progress invalidates downstream edits and never awards stages after a failure', async () => {
  const checks = runChecks(await compile(exampleSolutions), 6);
  const completed = recordChecks(freshWorkspace(), 6, checks);
  assert.deepEqual(completed.completed, [1, 2, 3, 4, 5, 6]);
  for (const [path, lastKept] of [['/browse.js', 3], ['/apply.js', 4], ['/review.js', 5], ['/gig.js', 0]]) {
    const changed = changeFiles(completed, { ...completed.codeFiles, [path]: '// edited' });
    assert.deepEqual(changed.completed, completed.completed.filter(id => id <= lastKept));
  }
  const fail = checks.map(check => check.id === 'apply-mapping' ? { ...check, passed: false } : check);
  assert.deepEqual(recordChecks(freshWorkspace(), 6, fail).completed, [1, 2, 3, 4]);
});

test('completion accepts a current six-stage report but never a partial three-stage result', async () => {
  const api = await compile(exampleSolutions), frame = { src: 'https://2-19-8-sandpack.codesandbox.io/', contentWindow: {} };
  const run = { id: 'full-run', through: 6 };
  const event = { source: frame.contentWindow, origin: new URL(frame.src).origin, data: { kind: 'giglink-prep:checks', runId: run.id, through: 6, checks: runChecks(api, 6) } };
  assert.equal(isCurrentReport(event, frame, run), true);
  assert.equal(isCurrentReport({ ...event, data: { ...event.data, checks: runChecks(api, 3) } }, frame, run), false);
});
