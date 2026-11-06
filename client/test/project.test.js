import assert from 'node:assert/strict';
import test from 'node:test';
import { compile, renderRunner } from './helpers/fixtures.js';
import { baseDetails, exampleSolutions, prepareScenario, starterFiles, scenarios } from '../src/features/lab/project.js';
import { requiredCheckIds, runChecks, runScene } from '../src/features/lab/checks.js';

const allPass = (checks) => checks.length > 0 && checks.every((check) => check.passed);

for (const through of [1, 2, 3, 4, 5, 6]) {
  test(`lesson ${through}: unfinished TODO fails; completed connected code passes`, async () => {
    const before = { ...exampleSolutions, [Object.keys(starterFiles)[through - 1]]: Object.values(starterFiles)[through - 1] };
    const failed = runChecks(await compile(before), through);
    assert.equal(allPass(failed), false);
    assert.ok(failed.some((check) => !check.passed && check.message.length > 10));
    const passed = runChecks(await compile(exampleSolutions), through);
    assert.equal(allPass(passed), true, JSON.stringify(passed.filter((check) => !check.passed)));
    assert.deepEqual(passed.map((check) => check.id), requiredCheckIds(through));
  });
}

test('lesson 1: a hardcoded event fails the different-input check', async () => {
  const api = await compile({ ...exampleSolutions, '/gig.js': `export function createGig() { return ${JSON.stringify({ ...baseDetails, publicationStatus: 'draft', postingPaymentStatus: 'unpaid' })}; }` });
  assert.equal(runChecks(api, 1).find((check) => check.id === 'create-second-event').passed, false);
});

test('lesson 2: always-accept and always-reject validators both fail', async () => {
  for (const body of ['return [];', 'return ["Always invalid"];']) {
    const api = await compile({ ...exampleSolutions, '/validate.js': `export function validateGig() { ${body} }` });
    assert.equal(allPass(runChecks(api, 2)), false);
  }
});

test('lesson 3: browser-claim publication fails and displays its actual wrong output', async () => {
  const api = await compile({ ...exampleSolutions, '/publish.js': 'export function publishGig(gig, payment) { return payment.browserSaysPaid ? { ...gig, publicationStatus: "published", postingPaymentStatus: "paid" } : gig; }' });
  const checks = runChecks(api, 3);
  assert.equal(checks.find((check) => check.id === 'publish-browser-only').passed, false);
  const scene = runScene(api, 3, scenarios.find((item) => item.id === 'browser-only'));
  assert.equal(scene.gig.publicationStatus, 'published'); // No separate hardcoded success/draft state hides the bug.
});

test('all three lessons use the same functions and keep the created event through replay', async () => {
  const api = await compile(exampleSolutions);
  const selected = { ...scenarios.find((item) => item.id === 'verified'), details: { ...baseDetails, title: 'Demo connected event' } };
  const scene = runScene(api, 3, selected);
  assert.equal(scene.gig.title, 'Demo connected event');
  assert.equal(scene.gig.publicationStatus, 'published');
  assert.equal(scene.gig.postingPaymentStatus, 'paid');
  assert.equal(scene.errors.length, 0);
  assert.deepEqual(scene.steps.map((step) => step.value), ['draft', 'valid', 'backend: yes', 'published']);
  assert.equal(allPass(runChecks(api, 3)), true);
});

test('changes in gig.js visibly affect later scenes; broken earlier work fails later checks', async () => {
  const renamed = await compile({ ...exampleSolutions, '/gig.js': exampleSolutions['/gig.js'].replace('...details,', '...details, title: details.title + " (my version)",') });
  assert.match(runScene(renamed, 3, scenarios[4]).gig.title, /\(my version\)$/);
  const broken = await compile({ ...exampleSolutions, '/gig.js': 'export function createGig(details) { return { ...details, title: "", publicationStatus: "draft", postingPaymentStatus: "unpaid" }; }' });
  assert.equal(allPass(runChecks(broken, 2)), false);
  assert.equal(allPass(runChecks(broken, 3)), false);
  const scene = runScene(broken, 3, scenarios[4]);
  assert.equal(scene.gig.publicationStatus, 'draft');
  assert.ok(scene.errors.length > 0);
});

test('correct code responds to every interactive scenario, including rejection cases', async () => {
  const api = await compile(exampleSolutions);
  for (const scenario of scenarios) {
    const scene = runScene(api, 3, scenario);
    assert.equal(scene.gig.publicationStatus, scenario.id === 'verified' ? 'published' : 'draft', scenario.id);
    if (['missing-title', 'low-pay'].includes(scenario.id)) assert.ok(scene.errors.length > 0);
  }
  // Replay deliberately selects valid demo input even after the missing-title experiment.
  const replay = prepareScenario('missing-title', '', true);
  assert.equal(replay.id, 'verified');
  assert.equal(runScene(api, 3, replay).gig.publicationStatus, 'published');
  assert.equal(prepareScenario('verified', 'My demo title', true).details.title, 'My demo title');
});

test('sandbox runner renders the executed output and posts real check results', async () => {
  for (const correct of [false, true]) {
    const config = { runId: 'fixture-run', through: 3, scenario: scenarios[4], parentOrigin: 'http://localhost:5173' };
    const { rendered, posted } = await renderRunner(correct ? exampleSolutions : starterFiles, config);
    assert.match(rendered, correct ? /18\/18 behavioral checks passed/ : /FAIL/);
    if (correct) assert.match(rendered, /published.*An evening of live music/);
    assert.equal(allPass(posted.message.checks), correct);
    assert.equal(posted.message.runId, config.runId);
    assert.equal(posted.origin, config.parentOrigin);
  }
});
