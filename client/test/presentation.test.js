import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { chapters } from '../src/content/presentation/story.js';
import { integrations, milestones, productJourney, refinements, requestSteps, snapshot, sources, verification, workstreams } from '../src/content/presentation/evidence.js';
import { foundationReport, personalDetails } from '../src/content/presentation/personal-details.js';
import { elapsedSeconds, formatTime, presentationModes, speakerNotes } from '../src/content/presentation/practice.js';

test('ten connected story chapters each have teaching, revision, layered answers and pinned evidence', () => {
  assert.deepEqual(chapters.map(item => item.id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(new Set(chapters.map(item => item.visual)).size, 10);
  for (const chapter of chapters) {
    for (const key of ['title', 'kicker', 'introduction', 'depth', 'summary', 'question', 'answer', 'technical']) assert.ok(chapter[key].length > 15, `${chapter.id}: ${key}`);
    assert.ok(chapter.points.length >= 2);
    for (const [heading, explanation] of chapter.points) { assert.ok(heading); assert.ok(explanation.length > 60); }
    for (const id of chapter.sources) assert.ok(sources[id]);
  }
  for (const source of Object.values(sources)) {
    const url = new URL(source.url);
    assert.equal(url.hostname, 'github.com');
    assert.equal(url.pathname, `/andrew-adv/giglink/blob/${snapshot.develop}/${source.path}`);
    assert.ok(['documented', 'implementation', 'test-code'].includes(source.kind));
  }
});

test('four role assignments preserve their exact branches and cross-feature dependencies', () => {
  assert.deepEqual(workstreams.map(item => [item.id, item.branch]), [
    [1, 'feature/auth-users'], [2, 'feature/customer-gigs'], [3, 'feature/talent-applications'], [4, 'feature/payments-admin'],
  ]);
  for (const role of workstreams) {
    assert.ok(role.sources.includes(role.id === 4 ? 'captain' : `student${role.id}`));
    for (const field of ['responsibility', 'dependency', 'handoff']) assert.ok(role[field].length > 40);
  }
  assert.match(workstreams[3].handoff, /assigned responsibilities/);
  assert.match(foundationReport.text, /instructor provided/);
  assert.equal(foundationReport.status, 'User-reported');
  assert.match(foundationReport.text, /task document assigns C00 to Student 4/);
});

test('dated milestones are ordered, linked to commit evidence, and end at the reviewed develop snapshot', () => {
  assert.equal(snapshot.checkedOn, '2026-11-06');
  assert.equal(snapshot.ahead, 41);
  assert.notEqual(snapshot.develop, snapshot.main);
  assert.ok(milestones.length >= 10);
  let previous = '';
  for (const milestone of milestones) {
    assert.match(milestone.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(milestone.date >= previous);
    assert.ok(milestone.date <= snapshot.checkedOn);
    previous = milestone.date;
    for (const ref of [milestone, ...milestone.related]) {
      assert.match(ref.sha, /^[a-f0-9]{40}$/);
      assert.equal(ref.url, `${snapshot.repository}/commit/${ref.sha}`);
    }
    for (const field of ['built', 'why', 'achieved']) assert.ok(milestone[field].length > 40);
  }
  assert.equal(milestones[0].sha, '59d17b46842e9c19e15f4e1cbe83242a1521d209');
  assert.equal(milestones.at(-1).sha, snapshot.develop);
  assert.ok(milestones.some(item => item.sha === '56764832067abed70cac391903a09a1207c4c820'));
});

test('diagrams and before/after comparisons use the same source registry and cover the connected original flow', () => {
  assert.equal(productJourney.length, 10);
  assert.equal(requestSteps.length, 5);
  assert.equal(integrations.length, 4);
  assert.ok(refinements.length >= 10);
  for (const item of [...productJourney, ...requestSteps, ...integrations, ...refinements, ...verification]) {
    assert.ok(item.sources.length);
    for (const id of item.sources) assert.ok(sources[id], `${item.title || item.label}: ${id}`);
  }
  for (const item of refinements) {
    assert.ok(milestones[item.milestone]);
    for (const field of ['before', 'change', 'reason', 'result']) assert.ok(item[field].length > 20);
  }
});

test('unknown personal details remain explicitly unconfirmed and separate from speaking scripts', () => {
  assert.equal(personalDetails.length, 6);
  for (const item of personalDetails) { assert.equal(item.status, 'To confirm'); assert.equal(item.value, ''); assert.ok(item.source); }
  assert.match(chapters[0].depth, /does not conclusively identify/);
  assert.match(verification[1].detail, /not executed during P5/);
  assert.match(verification[2].detail, /No instructor approval or deployment success is inferred/);
  const narrative = JSON.stringify([chapters, presentationModes]);
  assert.doesNotMatch(narrative, /\b(TODO|TBD|INSERT NAME|John Doe|Jane Doe)\b/);
  assert.match(chapters[6].depth, /separate application/);
});

test('three presentation lengths have practical speaking sections, evidence, printable notes and plausible word counts', () => {
  assert.deepEqual(presentationModes.map(item => item.id), ['quick', 'standard', 'full']);
  const ranges = [[120, 180], [450, 700], [1000, 1400]];
  presentationModes.forEach((mode, index) => {
    const words = mode.sections.map(section => section.speech).join(' ').split(/\s+/).length;
    assert.ok(words >= ranges[index][0] && words <= ranges[index][1], `${mode.id}: ${words} words`);
    for (const section of mode.sections) {
      for (const field of ['keyPoint', 'speech', 'followUp', 'response']) assert.ok(section[field].length > 30);
      assert.ok(section.remember.length >= 2);
      section.sources.forEach(id => assert.ok(sources[id]));
    }
    const outline = speakerNotes(mode);
    assert.match(outline, /Original tests were inspected, not run/);
    assert.match(outline, /To confirm/);
    for (const section of mode.sections) { assert.ok(outline.includes(section.speech)); assert.ok(outline.includes(sources[section.sources[0]].url)); }
    assert.match(outline, /\/questions/);
    assert.doesNotMatch(outline, /localStorage|Bearer |MONGODB_URI|learnerToken/);
  });
});

test('rehearsal clock handles pause, resume, elapsed time and backward clock adjustments', () => {
  assert.equal(elapsedSeconds(null, 12500, 999999), 12);
  assert.equal(elapsedSeconds(1000, 12500, 4500), 16);
  assert.equal(elapsedSeconds(1000, 12500, 500), 12);
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(601), '10:01');
});

test('presentation styling provides theme tokens, phone selectors, wrapping, focus and private-data-free print notes', async () => {
  const css = await readFile(new URL('../src/features/presentation/presentation.css', import.meta.url), 'utf8');
  for (const token of ['--panel', '--text', '--line', '--accent', '--focus', '--code']) assert.ok(css.includes(`var(${token})`));
  assert.match(css, /min-height: 44px/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /minmax\(0, 1fr\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /story-mobile-selector/);
  assert.match(css, /@media print/);
  assert.match(css, /progress-sync/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
  const global = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.match(global, /prefers-reduced-motion/);
  // Structural guarantees, not a claim of measured layout in a real browser.
});
